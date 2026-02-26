CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`excerpt` varchar(1000) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`language` varchar(5) NOT NULL DEFAULT 'sv',
	`pairId` int,
	`imageUrl` varchar(2000),
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`published` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`)
);
