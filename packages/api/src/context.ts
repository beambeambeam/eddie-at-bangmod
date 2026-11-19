import type { Database } from "@eddie-at-bangmod/db";

export interface Context {
  db: Database;
  /** The server clock. Injected so tests can control time. */
  now: () => Date;
}
