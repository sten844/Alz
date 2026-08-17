CREATE TABLE `lifestyle_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(100) NOT NULL,
	`title_sv` varchar(500) NOT NULL,
	`title_en` varchar(500),
	`excerpt_sv` varchar(1000) NOT NULL DEFAULT '',
	`excerpt_en` varchar(1000),
	`content_sv` text NOT NULL,
	`content_en` text,
	`image_url` varchar(2000),
	`sort_order` int NOT NULL DEFAULT 0,
	`published` boolean NOT NULL DEFAULT false,
	`published_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lifestyle_pages_id` PRIMARY KEY(`id`)
);
