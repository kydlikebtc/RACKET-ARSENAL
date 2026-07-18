CREATE TABLE `decision_candidates` (
	`owner_key` text NOT NULL,
	`racket_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`owner_key`, `racket_id`),
	FOREIGN KEY (`owner_key`) REFERENCES `decision_rooms`(`owner_key`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "decision_candidates_status_check" CHECK("decision_candidates"."status" IN ('candidate', 'trial', 'eliminated', 'final')),
	CONSTRAINT "decision_candidates_note_length_check" CHECK(length("decision_candidates"."note") <= 120)
);
--> statement-breakpoint
CREATE INDEX `decision_candidates_owner_order_idx` ON `decision_candidates` (`owner_key`,`sort_order`);--> statement-breakpoint
CREATE TABLE `decision_rooms` (
	`owner_key` text PRIMARY KEY NOT NULL,
	`baseline_id` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trial_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_key` text NOT NULL,
	`racket_id` text NOT NULL,
	`control` integer NOT NULL,
	`power` integer NOT NULL,
	`comfort` integer NOT NULL,
	`verdict` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "trial_feedback_control_check" CHECK("trial_feedback"."control" BETWEEN 1 AND 5),
	CONSTRAINT "trial_feedback_power_check" CHECK("trial_feedback"."power" BETWEEN 1 AND 5),
	CONSTRAINT "trial_feedback_comfort_check" CHECK("trial_feedback"."comfort" BETWEEN 1 AND 5),
	CONSTRAINT "trial_feedback_verdict_length_check" CHECK(length("trial_feedback"."verdict") BETWEEN 1 AND 40),
	CONSTRAINT "trial_feedback_note_length_check" CHECK(length("trial_feedback"."note") <= 240)
);
--> statement-breakpoint
CREATE INDEX `trial_feedback_owner_created_idx` ON `trial_feedback` (`owner_key`,`created_at`);