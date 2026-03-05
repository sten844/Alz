CREATE TABLE `site_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`content_sv` text,
	`content_en` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_pages_slug_unique` UNIQUE(`slug`)
);
