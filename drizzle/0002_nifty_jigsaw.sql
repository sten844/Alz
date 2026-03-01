CREATE TABLE `diary_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`entryDate` timestamp NOT NULL DEFAULT (now()),
	`published` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diary_entries_id` PRIMARY KEY(`id`)
);
