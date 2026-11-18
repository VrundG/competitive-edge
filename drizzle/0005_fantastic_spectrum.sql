ALTER TABLE `student_accounts` ADD `role` text DEFAULT 'student' NOT NULL;--> statement-breakpoint
INSERT INTO `student_accounts` (`id`, `username`, `password_hash`, `role`, `region`, `region_updated_at`, `created_at`)
VALUES ('management-ntce', 'ntce', 'disabled:configure-management-passphrase-before-use', 'management', 'Prefer not to say', 1791690000000, 1791690000000)
ON CONFLICT(`username`) DO UPDATE SET `password_hash` = excluded.`password_hash`, `role` = 'management';--> statement-breakpoint
INSERT INTO `student_accounts` (`id`, `username`, `password_hash`, `role`, `region`, `region_updated_at`, `created_at`)
VALUES ('demo-edge-bot', 'edge_bot_student', 'disabled:configure-demo-passphrase-before-use', 'demo', 'North Central', 1791690000000, 1791690000000)
ON CONFLICT(`username`) DO UPDATE SET `password_hash` = excluded.`password_hash`, `role` = 'demo';
