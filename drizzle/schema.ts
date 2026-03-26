import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Articles table for blog posts.
 * Each article can have a Swedish and English version linked by pairId.
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: varchar("excerpt", { length: 1000 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  language: varchar("language", { length: 5 }).notNull().default("sv"),
  pairId: int("pairId"),
  imageUrl: varchar("imageUrl", { length: 2000 }),
  bottomImageUrl: varchar("bottomImageUrl", { length: 2000 }),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Diary entries table for the daily column/kåseri.
 * Short, casual daily entries displayed in a sidebar column.
 */
export const diaryEntries = mysqlTable("diary_entries", {
  id: int("id").autoincrement().primaryKey(),
  content: text("content").notNull(),
  contentEn: text("content_en"),
  entryDate: timestamp("entryDate").defaultNow().notNull(),
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry = typeof diaryEntries.$inferInsert;

/**
 * Article drafts table for auto-saving work in progress.
 * Stores the latest auto-saved state of an article being edited.
 */
export const articleDrafts = mysqlTable("article_drafts", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId"),  // null for new articles, set for editing existing ones
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).default("").notNull(),
  excerpt: varchar("excerpt", { length: 1000 }).default("").notNull(),
  content: text("content"),
  category: varchar("category", { length: 100 }).default("Behandling").notNull(),
  language: varchar("language", { length: 5 }).default("sv").notNull(),
  imageUrl: varchar("imageUrl", { length: 2000 }),
  publishedAt: varchar("publishedAt", { length: 30 }),
  published: boolean("published").default(true).notNull(),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArticleDraft = typeof articleDrafts.$inferSelect;
export type InsertArticleDraft = typeof articleDrafts.$inferInsert;

/**
 * Site pages table for editable static pages (e.g. About page).
 * Stores content as markdown, with Swedish and English versions.
 */
export const sitePages = mysqlTable("site_pages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  contentSv: text("content_sv"),
  contentEn: text("content_en"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SitePage = typeof sitePages.$inferSelect;
export type InsertSitePage = typeof sitePages.$inferInsert;

/**
 * AI page sections (e.g. "AI som hjälpmedel", "Verktyg att testa", etc.)
 * Each section has a title, subtitle, and display settings.
 */
export const aiSections = mysqlTable("ai_sections", {
  id: int("id").autoincrement().primaryKey(),
  sectionKey: varchar("section_key", { length: 100 }).notNull().unique(),
  titleSv: varchar("title_sv", { length: 500 }).notNull(),
  titleEn: varchar("title_en", { length: 500 }).notNull(),
  subtitleSv: varchar("subtitle_sv", { length: 1000 }),
  subtitleEn: varchar("subtitle_en", { length: 1000 }),
  sortOrder: int("sort_order").notNull().default(0),
  visible: boolean("visible").default(true).notNull(),
  variant: varchar("variant", { length: 50 }).default("light").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiSection = typeof aiSections.$inferSelect;
export type InsertAiSection = typeof aiSections.$inferInsert;

/**
 * AI page items/cards within sections.
 * Each item has a name, description (SV/EN), URL, and optional icon.
 */
export const aiItems = mysqlTable("ai_items", {
  id: int("id").autoincrement().primaryKey(),
  sectionKey: varchar("section_key", { length: 100 }).notNull(),
  nameSv: varchar("name_sv", { length: 300 }).notNull(),
  nameEn: varchar("name_en", { length: 300 }).notNull(),
  descSv: varchar("desc_sv", { length: 1000 }).notNull(),
  descEn: varchar("desc_en", { length: 1000 }).notNull(),
  url: varchar("url", { length: 2000 }).notNull(),
  linkTextSv: varchar("link_text_sv", { length: 200 }),
  linkTextEn: varchar("link_text_en", { length: 200 }),
  iconName: varchar("icon_name", { length: 100 }),
  sortOrder: int("sort_order").notNull().default(0),
  visible: boolean("visible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiItem = typeof aiItems.$inferSelect;
export type InsertAiItem = typeof aiItems.$inferInsert;

/**
 * Email subscribers for article notifications.
 * Stores email addresses of people who want to be notified when new articles are published.
 */
export const subscribers = mysqlTable("subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  confirmed: boolean("confirmed").default(true).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

/**
 * Site settings table for feature toggles.
 * Key-value store for site-wide settings like comments on/off.
 */
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: varchar("setting_value", { length: 500 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

/**
 * Resource links for the /lankar page.
 * Simple model: name, comment, url — fully editable from admin.
 */
export const resourceLinks = mysqlTable("resource_links", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  comment: text("comment"),
  url: varchar("url", { length: 2000 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
  visible: boolean("visible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResourceLink = typeof resourceLinks.$inferSelect;
export type InsertResourceLink = typeof resourceLinks.$inferInsert;
