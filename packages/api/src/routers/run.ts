import { leaderboardEntry, runTicket } from "@eddie-at-bangmod/db/schema/index";
import { RUN_TICKS, TICKS_PER_SECOND, maxScore } from "@eddie-at-bangmod/game";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure } from "../index";
import { nicknameReasonSchema, validateNickname } from "../nickname";
import { entryOf, rankForScore } from "../ranking";

/** A Run lasts this long, so no real Run can post sooner. */
const RUN_MS = (RUN_TICKS / TICKS_PER_SECOND) * 1000;

const entry = leaderboardEntry;

/** True when the incoming Score beats the stored best Score. */
const beatsBest = sql`excluded.${sql.identifier("bestScore")} > ${entry.bestScore}`;

/** The highest Score the game rules allow in one Run. */
const SCORE_CAP = maxScore();

export const runRouter = {
  /** Issues a Run Ticket when the countdown starts. */
  start: publicProcedure
    .input(z.object({ deviceId: z.uuid() }))
    .handler(async ({ input, context }) => {
      const ticketId = crypto.randomUUID();
      const issuedAt = context.now();

      await context.db
        .insert(runTicket)
        .values({ id: ticketId, deviceId: input.deviceId, issuedAt });

      return { ticketId };
    }),

  /**
   * Posts one Run's Score against its Run Ticket. The Nickname always
   * updates; the best Score only when this one is higher.
   */
  submit: publicProcedure
    .errors({
      RUN_TOO_SHORT: {
        status: 400,
        message: "This Run ended too early to post a Score.",
      },
      TICKET_NOT_FOUND: {
        status: 404,
        message: "This Run has no Run Ticket for this Device.",
      },
      TICKET_USED: {
        status: 409,
        message: "This Run already posted its Score.",
      },
      SCORE_OVER_CAP: {
        status: 400,
        message: "This Score is higher than a Run can reach.",
      },
      INVALID_NICKNAME: {
        status: 400,
        message: "This Nickname breaks the rules.",
        data: z.object({ reason: nicknameReasonSchema }),
      },
    })
    .input(
      z.object({
        ticketId: z.uuid(),
        deviceId: z.uuid(),
        nickname: z.string(),
        score: z.number().int().min(0),
      })
    )
    .handler(async ({ input, context, errors }) => {
      const now = context.now();

      const [ticket] = await context.db
        .select()
        .from(runTicket)
        .where(eq(runTicket.id, input.ticketId));

      // A ticket from another Device looks the same as no ticket at all.
      if (!ticket || ticket.deviceId !== input.deviceId) {
        throw errors.TICKET_NOT_FOUND();
      }

      if (ticket.usedAt) {
        throw errors.TICKET_USED();
      }

      if (now.getTime() - ticket.issuedAt.getTime() < RUN_MS) {
        throw errors.RUN_TOO_SHORT();
      }

      if (input.score > SCORE_CAP) {
        throw errors.SCORE_OVER_CAP();
      }

      const nickname = validateNickname(input.nickname);

      if (!nickname.success) {
        throw errors.INVALID_NICKNAME({
          data: { reason: nickname.reason },
        });
      }

      const previousBest = await entryOf(context.db, input.deviceId);

      // Marks the ticket used only if no other post got there first.
      const claimed = await context.db
        .update(runTicket)
        .set({ usedAt: now })
        .where(and(eq(runTicket.id, input.ticketId), isNull(runTicket.usedAt)))
        .returning({ id: runTicket.id });

      if (claimed.length === 0) {
        throw errors.TICKET_USED();
      }

      await context.db
        .insert(entry)
        .values({
          deviceId: input.deviceId,
          nickname: nickname.nickname,
          bestScore: input.score,
          bestScoreAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: entry.deviceId,
          set: {
            nickname: nickname.nickname,
            updatedAt: now,
            bestScore: sql`case when ${beatsBest} then excluded.${sql.identifier("bestScore")} else ${entry.bestScore} end`,
            bestScoreAt: sql`case when ${beatsBest} then excluded.${sql.identifier("bestScoreAt")} else ${entry.bestScoreAt} end`,
          },
        });

      const runRank = await rankForScore(
        context.db,
        input.deviceId,
        input.score
      );

      const best = await entryOf(context.db, input.deviceId);

      if (!best) {
        throw new Error("The Leaderboard entry was not saved.");
      }

      return {
        runRank,
        bestScore: best.score,
        bestRank: best.rank,
        // A Device's first post has no best to beat.
        newBest: previousBest !== undefined && input.score > previousBest.score,
      };
    }),
};
