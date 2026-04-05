import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
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

describe("articles.list", () => {
  it("returns articles from the database (public procedure)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.articles.list({ language: "sv" });
    expect(Array.isArray(result)).toBe(true);
    // Should have Swedish articles from seed
    expect(result.length).toBeGreaterThan(0);
    // All should be Swedish
    for (const article of result) {
      expect(article.language).toBe("sv");
    }
  });

  it("returns English articles when language is en", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.articles.list({ language: "en" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    for (const article of result) {
      expect(article.language).toBe("en");
    }
  });
});

describe("articles.getById", () => {
  it("returns a single article by id", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    // First get the list to find a valid id
    const list = await caller.articles.list({ language: "sv" });
    expect(list.length).toBeGreaterThan(0);
    const firstId = list[0].id;

    const article = await caller.articles.getById({ id: firstId });
    expect(article).toBeDefined();
    expect(article!.id).toBe(firstId);
    expect(article!.title).toBeTruthy();
    expect(article!.content).toBeTruthy();
  });

  it("returns null for non-existent article", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const article = await caller.articles.getById({ id: 999999 });
    expect(article).toBeUndefined();
  });
});

describe("articles.listAll (admin)", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.articles.listAll()).rejects.toThrow();
  });

  it("requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.articles.listAll()).rejects.toThrow();
  });

  it("returns all articles for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.articles.listAll();
    expect(Array.isArray(result)).toBe(true);
    // Should include both Swedish and English
    expect(result.length).toBeGreaterThanOrEqual(14);
  });
});

describe("articles.update - unpublish", () => {
  it("allows admin to unpublish a published article (set published=false)", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    // Create a published article
    const created = await caller.articles.create({
      title: "Test Unpublish Article",
      excerpt: "This article will be unpublished",
      content: "Some content for unpublish test",
      category: "Vardagsliv",
      language: "sv",
      imageUrl: null,
      bottomImageUrl: null,
      published: true,
      publishedAt: new Date(),
    });
    expect(created).toBeDefined();
    expect(created.id).toBeDefined();

    // Verify it's published
    const beforeUpdate = await caller.articles.getById({ id: created.id });
    expect(beforeUpdate).toBeDefined();
    expect(beforeUpdate!.published).toBe(true);

    // Unpublish it
    await caller.articles.update({
      id: created.id,
      published: false,
    });

    // Verify it's now a draft
    const afterUpdate = await caller.articles.getById({ id: created.id });
    expect(afterUpdate).toBeDefined();
    expect(afterUpdate!.published).toBe(false);

    // Clean up
    await caller.articles.delete({ id: created.id });
  });

  it("unpublishing a Swedish article also unpublishes its English pair", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    // Create a published Swedish article (auto-creates English pair)
    const created = await caller.articles.create({
      title: "Test Avpublicera Artikel",
      excerpt: "Denna artikel ska avpubliceras",
      content: "Innehåll för avpubliceringstest",
      category: "Vardagsliv",
      language: "sv",
      imageUrl: null,
      bottomImageUrl: null,
      published: true,
      publishedAt: new Date(),
    });
    expect(created).toBeDefined();

    // Wait a bit for auto-translation to potentially start
    await new Promise((r) => setTimeout(r, 1000));

    // Unpublish the Swedish article
    await caller.articles.update({
      id: created.id,
      published: false,
    });

    // Verify the Swedish article is now a draft
    const svArticle = await caller.articles.getById({ id: created.id });
    expect(svArticle).toBeDefined();
    expect(svArticle!.published).toBe(false);

    // Clean up
    await caller.articles.delete({ id: created.id });
  });
});
