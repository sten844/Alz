CREATE TABLE `resource_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(50) NOT NULL,
	`name_sv` varchar(300) NOT NULL,
	`name_en` varchar(300) NOT NULL,
	`desc_sv` text NOT NULL,
	`desc_en` text NOT NULL,
	`url` varchar(2000) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resource_links_id` PRIMARY KEY(`id`)
);
