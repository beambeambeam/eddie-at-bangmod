import type { Context as ApiContext } from "@eddie-at-bangmod/api/context";

import { getDb } from "./services";

export async function createContext(_options: { req: Request }): Promise<ApiContext> {
  const db = await getDb();
  return {
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
