import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { leaderboardRouter } from "./leaderboard";
import { runRouter } from "./run";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  run: runRouter,
  leaderboard: leaderboardRouter,
};

export type AppRouter = typeof appRouter;

export type AppRouterClient = RouterClient<typeof appRouter>;
