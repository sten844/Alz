CREATE TABLE `page_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`path` varchar(500) NOT NULL,
	`visitor_id` varchar(64) NOT NULL,
	`referrer` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_views_id` PRIMARY KEY(`id`)
);
