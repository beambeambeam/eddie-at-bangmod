import path from "node:path";

import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

import type { Database } from "./index";
import { relations } from "./relations";

const migrationsFolder = path.join(import.meta.dirname, "migrations");

/** A fresh in-memory SQLite database with every migration applied. */
export const createTestDb = async (): Promise<Database> => {
  const db = drizzle({ connection: { url: ":memory:" }, relations });

  await migrate(db, { migrationsFolder });

  return db;
};
