CREATE TABLE `learner_progress` (
	`user_id` text PRIMARY KEY NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`last_write_id` text NOT NULL,
	`updated_at` text NOT NULL
);
