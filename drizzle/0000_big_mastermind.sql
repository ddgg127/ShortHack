CREATE TABLE `solved_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_id` text NOT NULL,
	`description` text NOT NULL,
	`summary` text NOT NULL,
	`category` text NOT NULL,
	`priority` text NOT NULL,
	`missing` text NOT NULL,
	`next_action` text NOT NULL,
	`draft` text NOT NULL,
	`source` text NOT NULL,
	`confidence` integer NOT NULL,
	`resolved_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_solved_requests_ticket_id` ON `solved_requests` (`ticket_id`);--> statement-breakpoint
CREATE INDEX `idx_solved_requests_resolved_at` ON `solved_requests` (`resolved_at`);