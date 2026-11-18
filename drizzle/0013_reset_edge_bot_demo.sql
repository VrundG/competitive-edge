DELETE FROM `learner_progress` WHERE `user_id` = 'student:demo-edge-bot';--> statement-breakpoint
DELETE FROM `diagnostic_completions` WHERE `user_id` = 'student:demo-edge-bot';--> statement-breakpoint
DELETE FROM `question_reports` WHERE `user_id` = 'student:demo-edge-bot';--> statement-breakpoint
DELETE FROM `question_sessions` WHERE `user_id` = 'student:demo-edge-bot';--> statement-breakpoint
DELETE FROM `student_sessions` WHERE `student_id` = 'demo-edge-bot';--> statement-breakpoint
UPDATE `student_accounts`
SET `profile_image` = NULL, `recovery_hash` = NULL, `recovery_created_at` = NULL
WHERE `id` = 'demo-edge-bot';
