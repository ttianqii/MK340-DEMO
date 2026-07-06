CREATE TABLE `class_schedule` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campus` text NOT NULL,
	`semester` text NOT NULL,
	`day` text NOT NULL,
	`room` text NOT NULL,
	`room_capacity` integer,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`course_code` text NOT NULL,
	`course_name` text NOT NULL,
	`section` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `class_schedule_slot_uq` ON `class_schedule` (`semester`,`day`,`room`,`start_time`,`course_code`);