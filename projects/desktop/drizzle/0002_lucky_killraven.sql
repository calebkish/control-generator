CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`value` text NOT NULL,
	`public_id` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`is_email_verified` integer DEFAULT false NOT NULL,
	`email_verification_code` text,
	`email_verification_code_expiry` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_public_id_idx` ON `users` (`public_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);