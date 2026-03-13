import { eq, desc, asc, and, sql, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, articles, InsertArticle, diaryEntries, InsertDiaryEntry, articleDrafts, InsertArticleDraft, sitePages, InsertSitePage, aiSections, InsertAiSection, aiItems, InsertAiItem, subscribers, InsertSubscriber, siteSettings } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ---- Article queries ----

export async function listArticles(opts?: { language?: string; published?: boolean }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (opts?.language) conditions.push(eq(articles.language, opts.language));
  if (opts?.published !== undefined) conditions.push(eq(articles.published, opts.published));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(articles).where(where).orderBy(desc(articles.publishedAt));
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createArticle(article: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(articles).values(article);
  return { id: result[0].insertId };
}

export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(articles).set(data).where(eq(articles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(articles).where(eq(articles.id, id));
}

export async function getArticleByPairIdAndLanguage(pairId: number, language: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles)
    .where(and(eq(articles.pairId, pairId), eq(articles.language, language)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- Diary entry queries ----

export async function listDiaryEntries(opts?: { published?: boolean; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { entries: [], total: 0 };

  const conditions = [];
  if (opts?.published !== undefined) conditions.push(eq(diaryEntries.published, opts.published));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(diaryEntries).where(where);
  const total = Number(countResult[0]?.count ?? 0);

  // Get paginated entries
  let query = db.select().from(diaryEntries).where(where).orderBy(desc(diaryEntries.entryDate));
  if (opts?.limit) query = query.limit(opts.limit) as typeof query;
  if (opts?.offset) query = query.offset(opts.offset) as typeof query;

  const entries = await query;
  return { entries, total };
}

export async function getDiaryEntryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(diaryEntries).where(eq(diaryEntries.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDiaryEntry(entry: InsertDiaryEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(diaryEntries).values(entry);
  return { id: result[0].insertId };
}

export async function updateDiaryEntry(id: number, data: Partial<InsertDiaryEntry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(diaryEntries).set(data).where(eq(diaryEntries.id, id));
}

export async function deleteDiaryEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(diaryEntries).where(eq(diaryEntries.id, id));
}

// ---- Article draft queries ----

export async function saveDraft(draft: InsertArticleDraft) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if a draft already exists for this user + articleId combo
  const conditions = [eq(articleDrafts.userId, draft.userId)];
  if (draft.articleId) {
    conditions.push(eq(articleDrafts.articleId, draft.articleId));
  } else {
    conditions.push(isNull(articleDrafts.articleId));
  }

  const existing = await db.select().from(articleDrafts).where(and(...conditions)).limit(1);

  if (existing.length > 0) {
    // Update existing draft
    await db.update(articleDrafts).set({
      title: draft.title,
      excerpt: draft.excerpt,
      content: draft.content,
      category: draft.category,
      language: draft.language,
      imageUrl: draft.imageUrl,
      publishedAt: draft.publishedAt,
      published: draft.published,
      savedAt: new Date(),
    }).where(eq(articleDrafts.id, existing[0].id));
    return { id: existing[0].id };
  } else {
    // Create new draft
    const result = await db.insert(articleDrafts).values(draft);
    return { id: result[0].insertId };
  }
}

export async function getDraft(userId: number, articleId?: number | null) {
  const db = await getDb();
  if (!db) return undefined;

  const conditions = [eq(articleDrafts.userId, userId)];
  if (articleId) {
    conditions.push(eq(articleDrafts.articleId, articleId));
  } else {
    conditions.push(isNull(articleDrafts.articleId));
  }

  const result = await db.select().from(articleDrafts).where(and(...conditions)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteDraft(userId: number, articleId?: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(articleDrafts.userId, userId)];
  if (articleId) {
    conditions.push(eq(articleDrafts.articleId, articleId));
  } else {
    conditions.push(isNull(articleDrafts.articleId));
  }

  await db.delete(articleDrafts).where(and(...conditions));
}

export async function listDrafts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(articleDrafts).where(eq(articleDrafts.userId, userId)).orderBy(desc(articleDrafts.savedAt));
}

// ---- Site pages queries ----

export async function getSitePage(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sitePages).where(eq(sitePages.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSitePage(slug: string, data: { contentSv?: string | null; contentEn?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(sitePages).where(eq(sitePages.slug, slug)).limit(1);
  if (existing.length > 0) {
    await db.update(sitePages).set(data).where(eq(sitePages.slug, slug));
    return { id: existing[0].id };
  } else {
    const result = await db.insert(sitePages).values({ slug, ...data });
    return { id: result[0].insertId };
  }
}

// ---- AI page section queries ----

export async function listAiSections() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aiSections).orderBy(asc(aiSections.sortOrder));
}

export async function getAiSection(sectionKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiSections).where(eq(aiSections.sectionKey, sectionKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertAiSection(sectionKey: string, data: Partial<InsertAiSection>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(aiSections).where(eq(aiSections.sectionKey, sectionKey)).limit(1);
  if (existing.length > 0) {
    await db.update(aiSections).set(data).where(eq(aiSections.sectionKey, sectionKey));
    return { id: existing[0].id };
  } else {
    const result = await db.insert(aiSections).values({ sectionKey, ...data } as InsertAiSection);
    return { id: result[0].insertId };
  }
}

// ---- AI page item queries ----

export async function listAiItems(sectionKey?: string) {
  const db = await getDb();
  if (!db) return [];

  if (sectionKey) {
    return db.select().from(aiItems).where(eq(aiItems.sectionKey, sectionKey)).orderBy(asc(aiItems.sortOrder));
  }
  return db.select().from(aiItems).orderBy(asc(aiItems.sortOrder));
}

export async function getAiItem(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aiItems).where(eq(aiItems.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createAiItem(item: InsertAiItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aiItems).values(item);
  return { id: result[0].insertId };
}

export async function updateAiItem(id: number, data: Partial<InsertAiItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiItems).set(data).where(eq(aiItems.id, id));
}

export async function deleteAiItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(aiItems).where(eq(aiItems.id, id));
}

// ---- Subscriber queries ----

export async function listSubscribers(opts?: { activeOnly?: boolean }) {
  const db = await getDb();
  if (!db) return [];

  if (opts?.activeOnly) {
    return db.select().from(subscribers).where(eq(subscribers.active, true)).orderBy(desc(subscribers.createdAt));
  }
  return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
}

export async function getSubscriberByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscribers).where(eq(subscribers.email, email.toLowerCase().trim())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSubscriber(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const normalizedEmail = email.toLowerCase().trim();

  // Check if already exists
  const existing = await getSubscriberByEmail(normalizedEmail);
  if (existing) {
    // Reactivate if previously unsubscribed
    if (!existing.active) {
      await db.update(subscribers).set({ active: true }).where(eq(subscribers.id, existing.id));
    }
    return { id: existing.id, alreadyExists: true };
  }

  const result = await db.insert(subscribers).values({ email: normalizedEmail });
  return { id: result[0].insertId, alreadyExists: false };
}

export async function unsubscribe(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subscribers).set({ active: false }).where(eq(subscribers.email, email.toLowerCase().trim()));
}

export async function deleteSubscriber(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(subscribers).where(eq(subscribers.id, id));
}

export async function getActiveSubscriberCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(subscribers).where(eq(subscribers.active, true));
  return Number(result[0]?.count ?? 0);
}

// ---- Site settings queries ----

export async function getSiteSetting(key: string): Promise<string | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  return result.length > 0 ? result[0].settingValue : undefined;
}

export async function upsertSiteSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  if (existing.length > 0) {
    await db.update(siteSettings).set({ settingValue: value }).where(eq(siteSettings.settingKey, key));
    return { id: existing[0].id };
  } else {
    const result = await db.insert(siteSettings).values({ settingKey: key, settingValue: value });
    return { id: result[0].insertId };
  }
}

export async function listSiteSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings);
}

// ---- Export / Import helpers ----

export async function exportAllContent() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allArticles = await db.select().from(articles).orderBy(desc(articles.publishedAt));
  const allDiary = await db.select().from(diaryEntries).orderBy(desc(diaryEntries.entryDate));
  const allAiSections = await db.select().from(aiSections).orderBy(asc(aiSections.sortOrder));
  const allAiItems = await db.select().from(aiItems).orderBy(asc(aiItems.sortOrder));
  const allSubscribers = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  const allSitePages = await db.select().from(sitePages);
  const allSettings = await db.select().from(siteSettings);

  return {
    exportVersion: 1,
    exportDate: new Date().toISOString(),
    articles: allArticles,
    diaryEntries: allDiary,
    aiSections: allAiSections,
    aiItems: allAiItems,
    subscribers: allSubscribers,
    sitePages: allSitePages,
    siteSettings: allSettings,
  };
}

export async function importAllContent(data: {
  articles?: any[];
  diaryEntries?: any[];
  aiSections?: any[];
  aiItems?: any[];
  subscribers?: any[];
  sitePages?: any[];
  siteSettings?: any[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = { articles: 0, diaryEntries: 0, aiSections: 0, aiItems: 0, subscribers: 0, sitePages: 0, siteSettings: 0 };

  // Import articles
  if (data.articles?.length) {
    for (const a of data.articles) {
      const { id, createdAt, updatedAt, ...rest } = a;
      await db.insert(articles).values({
        ...rest,
        publishedAt: rest.publishedAt ? new Date(rest.publishedAt) : new Date(),
      }).onDuplicateKeyUpdate({ set: { title: rest.title } });
      stats.articles++;
    }
  }

  // Import diary entries
  if (data.diaryEntries?.length) {
    for (const d of data.diaryEntries) {
      const { id, createdAt, updatedAt, ...rest } = d;
      await db.insert(diaryEntries).values({
        ...rest,
        entryDate: rest.entryDate ? new Date(rest.entryDate) : new Date(),
      }).onDuplicateKeyUpdate({ set: { content: rest.content } });
      stats.diaryEntries++;
    }
  }

  // Import AI sections
  if (data.aiSections?.length) {
    for (const s of data.aiSections) {
      const { id, updatedAt, ...rest } = s;
      await db.insert(aiSections).values(rest).onDuplicateKeyUpdate({ set: { titleSv: rest.titleSv } });
      stats.aiSections++;
    }
  }

  // Import AI items
  if (data.aiItems?.length) {
    for (const item of data.aiItems) {
      const { id, createdAt, updatedAt, ...rest } = item;
      await db.insert(aiItems).values(rest).onDuplicateKeyUpdate({ set: { nameSv: rest.nameSv } });
      stats.aiItems++;
    }
  }

  // Import subscribers
  if (data.subscribers?.length) {
    for (const sub of data.subscribers) {
      const { id, createdAt, updatedAt, ...rest } = sub;
      await db.insert(subscribers).values(rest).onDuplicateKeyUpdate({ set: { active: rest.active } });
      stats.subscribers++;
    }
  }

  // Import site pages
  if (data.sitePages?.length) {
    for (const page of data.sitePages) {
      const { id, updatedAt, ...rest } = page;
      await db.insert(sitePages).values(rest).onDuplicateKeyUpdate({ set: { contentSv: rest.contentSv } });
      stats.sitePages++;
    }
  }

  // Import site settings
  if (data.siteSettings?.length) {
    for (const setting of data.siteSettings) {
      const { id, updatedAt, ...rest } = setting;
      await db.insert(siteSettings).values(rest).onDuplicateKeyUpdate({ set: { settingValue: rest.settingValue } });
      stats.siteSettings++;
    }
  }

  return stats;
}
