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
