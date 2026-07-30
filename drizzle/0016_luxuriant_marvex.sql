CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`article_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
