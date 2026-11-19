import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** The server-issued permission to post one Score for one Run. */
export const runTicket = sqliteTable("run_ticket", {
  id: text().primaryKey(),
  deviceId: text().notNull(),
  issuedAt: integer({ mode: "timestamp_ms" }).notNull(),
  usedAt: integer({ mode: "timestamp_ms" }),
});

/** One Device's best Score under its latest Nickname. */
export const leaderboardEntry = sqliteTable(
  "leaderboard_entry",
  {
    deviceId: text().primaryKey(),
    nickname: text().notNull(),
    bestScore: integer().notNull(),
    bestScoreAt: integer({ mode: "timestamp_ms" }).notNull(),
    updatedAt: integer({ mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("leaderboard_entry_rank_idx").on(table.bestScore, table.bestScoreAt),
  ]
);
