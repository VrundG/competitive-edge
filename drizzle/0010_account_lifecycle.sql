ALTER TABLE `student_accounts` ADD `recovery_hash` text;--> statement-breakpoint
ALTER TABLE `student_accounts` ADD `recovery_created_at` integer;--> statement-breakpoint
ALTER TABLE `student_sessions` ADD `created_at` integer;
