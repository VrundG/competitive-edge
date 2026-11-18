CREATE TABLE `content_reviews` (
	`question_id` text NOT NULL,
	`question_version` integer NOT NULL,
	`status` text DEFAULT 'unreviewed' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	PRIMARY KEY(`question_id`, `question_version`)
);
--> statement-breakpoint
CREATE INDEX `idx_content_reviews_status` ON `content_reviews` (`status`,`reviewed_at`);
