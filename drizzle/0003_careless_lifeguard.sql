CREATE TABLE `question_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`attempt_id` text NOT NULL,
	`question_id` text NOT NULL,
	`question_version` integer NOT NULL,
	`category` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `question_reports_unique_item` ON `question_reports` (`user_id`,`attempt_id`,`question_id`,`question_version`,`category`);--> statement-breakpoint
CREATE INDEX `idx_question_reports_status` ON `question_reports` (`status`,`created_at`);