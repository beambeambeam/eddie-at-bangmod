import { z } from "zod";

import { publicProcedure } from "../index";
import { entryOf, topEntries } from "../ranking";

const TOP_SIZE = 50;

export const leaderboardRouter = {
  /** The top 50 entries, best first. */
  top: publicProcedure.handler(
    async ({ context }) => await topEntries(context.db, TOP_SIZE)
  ),

  /** The Device's own entry and rank, or `null` if it has not posted. */
  me: publicProcedure
    .input(z.object({ deviceId: z.uuid() }))
    .handler(
      async ({ input, context }) =>
        (await entryOf(context.db, input.deviceId)) ?? null
    ),
};
