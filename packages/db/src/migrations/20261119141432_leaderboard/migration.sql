CREATE TABLE `leaderboard_entry` (
	`deviceId` text PRIMARY KEY,
	`nickname` text NOT NULL,
	`bestScore` integer NOT NULL,
	`bestScoreAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `run_ticket` (
	`id` text PRIMARY KEY,
	`deviceId` text NOT NULL,
	`issuedAt` integer NOT NULL,
	`usedAt` integer
);
--> statement-breakpoint
CREATE INDEX `leaderboard_entry_rank_idx` ON `leaderboard_entry` (`bestScore`,`bestScoreAt`);