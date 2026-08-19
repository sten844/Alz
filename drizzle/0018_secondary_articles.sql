CREATE TABLE `secondary_articles` (
  `id` int AUTO_INCREMENT NOT NULL,
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
  CONSTRAINT `secondary_articles_id` PRIMARY KEY(`id`)
);

INSERT INTO `secondary_articles` (`title_sv`, `title_en`, `excerpt_sv`, `excerpt_en`, `content_sv`, `content_en`, `sort_order`, `published`, `published_at`) VALUES
  (
    'Under uppbyggnad: Nya perspektiv',
    'Under construction: New perspectives',
    'Detta är en exempelartikel som du kan ersätta med ditt eget innehåll.',
    'This is a sample article that you can replace with your own content.',
    '# Under uppbyggnad\n\nDet här är en tydligt märkt exempelartikel. När du är redo kan du ersätta texten, lägga till bild och själv publicera din egen artikel i det parallella artikelspåret.',
    '# Under construction\n\nThis is a clearly labelled sample article. When you are ready, you can replace the text, add an image and publish your own article in the independent article stream.',
    1,
    true,
    now()
  ),
  (
    'Under uppbyggnad: Vardagsreflektioner',
    'Under construction: Everyday reflections',
    'En plats för kommande personliga reflektioner och nya texter.',
    'A place for future personal reflections and new writing.',
    '# Under uppbyggnad\n\nDen här exempelartikeln visar hur en egen text kan se ut i den nya, fristående artikelraden.',
    '# Under construction\n\nThis sample article shows how an individual text can appear in the new, independent article row.',
    2,
    true,
    now()
  ),
  (
    'Under uppbyggnad: Frågor att utforska',
    'Under construction: Questions to explore',
    'En exempelplats för framtida ämnen som du vill undersöka närmare.',
    'A sample space for future topics you want to explore further.',
    '# Under uppbyggnad\n\nHär kan du senare skriva om frågor, erfarenheter eller teman som du vill utforska mer i lugn och ro.',
    '# Under construction\n\nHere you can later write about questions, experiences or themes that you want to explore further at your own pace.',
    3,
    true,
    now()
  );
