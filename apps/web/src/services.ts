import { type Database, createDb } from "@eddie-at-bangmod/db";

import { ENV } from "./env.server";

export function getDb(): Database {
  return createDb(ENV);
}
