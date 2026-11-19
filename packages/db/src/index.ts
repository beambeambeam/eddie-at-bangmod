import { drizzle } from "drizzle-orm/d1";
import type { SQLiteAsyncDatabase } from "drizzle-orm/sqlite-core/async";

import type { DatabaseConfig } from "./config";
import { relations } from "./relations";

/** Any async SQLite Drizzle database with this schema: D1 or libsql. */
export type Database = SQLiteAsyncDatabase<"async", unknown, typeof relations>;

export const createDb = (env: DatabaseConfig): Database =>
  drizzle(env.DB, { relations });
