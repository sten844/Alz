import { describe, expect, it, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getArticleById, getArticleByPairIdAndLanguage, deleteArticle } from "./db";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// Track created articles for cleanup
const createdArticleIds: number[] = [];

afterAll(async () => {
  // Clean up test articles
  for (const id of createdArticleIds) {
    try {
      await deleteArticle(id);
    } catch {
      // ignore cleanup errors
    }
  }
});

describe("article auto-translation", () => {
  it("creates a Swedish article and auto-translates to English", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    const result = await caller.articles.create({
      title: "Testöversättning vitest",
      excerpt: "Detta är ett test av automatisk översättning.",
      content: "Jag testar att artiklar översätts automatiskt till engelska.",
      category: "Vardagsliv",
      language: "sv",
      published: true,
    });

    expect(result.id).toBeDefined();
    createdArticleIds.push(result.id);

    // Wait for the background translation to complete
    await new Promise((resolve) => setTimeout(resolve, 15000));

    // Check that the Swedish article has pairId set
    const svArticle = await getArticleById(result.id);
    expect(svArticle).toBeDefined();
    expect(svArticle!.pairId).toBe(result.id);

    // Check that an English translation was created
    const enArticle = await getArticleByPairIdAndLanguage(result.id, "en");
    expect(enArticle).toBeDefined();
    expect(enArticle!.language).toBe("en");
    expect(enArticle!.pairId).toBe(result.id);
    expect(enArticle!.category).toBe("Daily Life"); // Vardagsliv → Daily Life
    expect(enArticle!.title).toBeTruthy();
    expect(enArticle!.content).toBeTruthy();
    expect(enArticle!.published).toBe(true);

    createdArticleIds.push(enArticle!.id);
  }, 30000); // 30s timeout for LLM call

  it("the translated article appears in the English articles list", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const enArticles = await caller.articles.list({ language: "en", published: true });
    expect(Array.isArray(enArticles)).toBe(true);
    // Should find at least one English article (our translated one + seed data)
    expect(enArticles.length).toBeGreaterThan(0);
  });

  it("getArticleByPairIdAndLanguage returns correct article", async () => {
    // Use the existing article pair (30001 sv, 30002 en)
    const enArticle = await getArticleByPairIdAndLanguage(30001, "en");
    expect(enArticle).toBeDefined();
    expect(enArticle!.language).toBe("en");
    expect(enArticle!.pairId).toBe(30001);
  });

  it("deleting a Swedish article also deletes its English pair", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    // Create a test article pair
    const result = await caller.articles.create({
      title: "Radera-test vitest",
      excerpt: "Testar att radering tar bort paret.",
      content: "Denna artikel ska raderas tillsammans med sin översättning.",
      category: "Forskning",
      language: "sv",
      published: true,
    });

    createdArticleIds.push(result.id);

    // Wait for translation
    await new Promise((resolve) => setTimeout(resolve, 15000));

    const svArticle = await getArticleById(result.id);
    expect(svArticle).toBeDefined();

    // Find the English pair
    const enArticle = await getArticleByPairIdAndLanguage(result.id, "en");
    if (enArticle) {
      createdArticleIds.push(enArticle.id);
    }

    // Delete the Swedish article
    await caller.articles.delete({ id: result.id });

    // Both should be gone
    const svAfter = await getArticleById(result.id);
    expect(svAfter).toBeUndefined();

    if (enArticle) {
      const enAfter = await getArticleById(enArticle.id);
      expect(enAfter).toBeUndefined();
    }
  }, 30000);
});

describe("category mapping", () => {
  it("maps Swedish categories to English correctly in translations", async () => {
    // Verify the existing translated article has correct category mapping
    const enArticle = await getArticleByPairIdAndLanguage(30001, "en");
    expect(enArticle).toBeDefined();
    // 30001 is "Vardagsliv" in Swedish, should be "Daily Life" in English
    expect(enArticle!.category).toBe("Daily Life");
  });
});
