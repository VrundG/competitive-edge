CREATE TABLE `diagnostic_completions` (
	`user_id` text NOT NULL,
	`track` text NOT NULL,
	`completed_at` text NOT NULL,
	`attempt_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `track`)
);
--> statement-breakpoint
CREATE INDEX `idx_diagnostic_completions_user` ON `diagnostic_completions` (`user_id`);