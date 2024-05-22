CREATE TABLE `llm_configs` (
	`id` integer PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`option` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`value` text NOT NULL
);
