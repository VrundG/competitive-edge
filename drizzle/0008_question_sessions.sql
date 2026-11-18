CREATE TABLE `question_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`track` text NOT NULL,
	`question_ids` text NOT NULL,
	`last_revealed` integer DEFAULT -1 NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_question_sessions_user` ON `question_sessions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_question_sessions_expiry` ON `question_sessions` (`expires_at`);
