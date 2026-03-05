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
