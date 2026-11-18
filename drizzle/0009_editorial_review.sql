ALTER TABLE `question_reports` ADD `reviewed_at` integer;--> statement-breakpoint
ALTER TABLE `question_reports` ADD `reviewed_by` text;--> statement-breakpoint
ALTER TABLE `question_reports` ADD `resolution_note` text DEFAULT '' NOT NULL;
