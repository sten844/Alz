import { eq, desc, and, sql, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, articles, InsertArticle, diaryEntries, InsertDiaryEntry, articleDrafts, InsertArticleDraft } from "../drizzle/schema";
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
