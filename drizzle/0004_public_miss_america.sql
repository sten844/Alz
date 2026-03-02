CREATE TABLE `article_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL DEFAULT '',
	`excerpt` varchar(1000) NOT NULL DEFAULT '',
	`content` text,
	`category` varchar(100) NOT NULL DEFAULT 'Behandling',
	`language` varchar(5) NOT NULL DEFAULT 'sv',
	`imageUrl` varchar(2000),
	`publishedAt` varchar(30),
	`published` boolean NOT NULL DEFAULT true,
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `article_drafts_id` PRIMARY KEY(`id`)
);
