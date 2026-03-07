CREATE TABLE `ai_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`section_key` varchar(100) NOT NULL,
	`name_sv` varchar(300) NOT NULL,
	`name_en` varchar(300) NOT NULL,
	`desc_sv` varchar(1000) NOT NULL,
	`desc_en` varchar(1000) NOT NULL,
	`url` varchar(2000) NOT NULL,
	`link_text_sv` varchar(200),
	`link_text_en` varchar(200),
	`icon_name` varchar(100),
	`sort_order` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`section_key` varchar(100) NOT NULL,
	`title_sv` varchar(500) NOT NULL,
	`title_en` varchar(500) NOT NULL,
	`subtitle_sv` varchar(1000),
	`subtitle_en` varchar(1000),
	`sort_order` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`variant` varchar(50) NOT NULL DEFAULT 'light',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_sections_section_key_unique` UNIQUE(`section_key`)
);
