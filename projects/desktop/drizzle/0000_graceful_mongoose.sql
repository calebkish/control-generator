CREATE TABLE `chats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `controls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`name` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `controls_to_chats` (
	`control_id` integer NOT NULL,
	`chat_id` integer NOT NULL,
	`type` text NOT NULL,
	PRIMARY KEY(`chat_id`, `control_id`),
	FOREIGN KEY (`control_id`) REFERENCES `controls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `controls_name_unique` ON `controls` (`name`);