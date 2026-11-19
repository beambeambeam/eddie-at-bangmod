import type { Database } from "@eddie-at-bangmod/db";
import { leaderboardEntry } from "@eddie-at-bangmod/db/schema/index";
import { and, asc, count, desc, eq, gt, gte, lt, ne, or } from "drizzle-orm";

const entry = leaderboardEntry;

export interface RankedEntry {
  rank: number;
  nickname: string;
  score: number;
  /** When the Device first reached this Score. */
  at: Date;
}

/**
 * The Leaderboard from the top: higher Score first. In a tie, whoever
 * reached the Score first. The Device id settles exact ties, so every rank
 * is unique.
 */
export const topEntries = async (
  db: Database,
  limit: number
): Promise<RankedEntry[]> => {
  const rows = await db
    .select()
    .from(entry)
    .orderBy(desc(entry.bestScore), asc(entry.bestScoreAt), asc(entry.deviceId))
    .limit(limit);

  return rows.map((row, index) => ({
    rank: index + 1,
    nickname: row.nickname,
    score: row.bestScore,
    at: row.bestScoreAt,
  }));
};

const countWhere = async (db: Database, where: ReturnType<typeof and>) => {
  const [row] = await db.select({ ahead: count() }).from(entry).where(where);

  return row?.ahead ?? 0;
};

/** The Device's entry and its rank, or `undefined` if it has none. */
export const entryOf = async (
  db: Database,
  deviceId: string
): Promise<RankedEntry | undefined> => {
  const [mine] = await db
    .select()
    .from(entry)
    .where(eq(entry.deviceId, deviceId));

  if (!mine) {
    return undefined;
  }

  const ahead = await countWhere(
    db,
    or(
      gt(entry.bestScore, mine.bestScore),
      and(
        eq(entry.bestScore, mine.bestScore),
        or(
          lt(entry.bestScoreAt, mine.bestScoreAt),
          and(
            eq(entry.bestScoreAt, mine.bestScoreAt),
            lt(entry.deviceId, mine.deviceId)
          )
        )
      )
    )
  );

  return {
    rank: ahead + 1,
    nickname: mine.nickname,
    score: mine.bestScore,
    at: mine.bestScoreAt,
  };
};

/**
 * The rank a Score posted now would hold among the other Devices. Anyone
 * with the same Score reached it earlier, so they stay ahead.
 */
export const rankForScore = async (
  db: Database,
  deviceId: string,
  score: number
) =>
  (await countWhere(
    db,
    and(ne(entry.deviceId, deviceId), gte(entry.bestScore, score))
  )) + 1;
