import type { Context as ApiContext } from "@eddie-at-bangmod/api/context";

import { getDb } from "./services";

export const createContext = (_options: { req: Request }): ApiContext => ({
  db: getDb(),
});

export type Context = ReturnType<typeof createContext>;
