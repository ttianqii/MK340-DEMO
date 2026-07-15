CREATE TABLE `checklist_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`category` varchar(255) NOT NULL,
	`anchor_id` varchar(32),
	`credit_earned` int,
	`credit_required` int,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `checklist_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklist_courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`group_id` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`credit` varchar(16) NOT NULL,
	`grade` varchar(16) NOT NULL,
	`note` varchar(255),
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `checklist_courses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklist_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category_id` int NOT NULL,
	`group_name` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `checklist_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `class_schedule` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campus` varchar(128) NOT NULL,
	`semester` varchar(64) NOT NULL,
	`day` varchar(16) NOT NULL,
	`room` varchar(32) NOT NULL,
	`room_capacity` int,
	`start_time` varchar(16) NOT NULL,
	`end_time` varchar(16) NOT NULL,
	`course_code` varchar(32) NOT NULL,
	`course_name` varchar(255) NOT NULL,
	`section` varchar(16),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `class_schedule_id` PRIMARY KEY(`id`),
	CONSTRAINT `class_schedule_slot_uq` UNIQUE(`semester`,`day`,`room`,`start_time`,`course_code`)
);
--> statement-breakpoint
CREATE TABLE `student_info_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`label` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `student_info_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name_th` varchar(255) NOT NULL,
	`name_en` varchar(255) NOT NULL,
	`student_code` varchar(32) NOT NULL,
	`photo` varchar(512),
	`gpa` varchar(16),
	`total_credits` varchar(16),
	`credits_earned` varchar(16),
	`credits_transferred` varchar(16),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_username_uq` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `checklist_categories` ADD CONSTRAINT `checklist_categories_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checklist_courses` ADD CONSTRAINT `checklist_courses_group_id_checklist_groups_id_fk` FOREIGN KEY (`group_id`) REFERENCES `checklist_groups`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `checklist_groups` ADD CONSTRAINT `checklist_groups_category_id_checklist_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `checklist_categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_info_items` ADD CONSTRAINT `student_info_items_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `checklist_categories_student_idx` ON `checklist_categories` (`student_id`);--> statement-breakpoint
CREATE INDEX `checklist_courses_group_idx` ON `checklist_courses` (`group_id`);--> statement-breakpoint
CREATE INDEX `checklist_groups_category_idx` ON `checklist_groups` (`category_id`);--> statement-breakpoint
CREATE INDEX `student_info_items_student_idx` ON `student_info_items` (`student_id`);