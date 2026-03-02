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

describe("drafts.save", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.drafts.save({
        title: "Test Draft",
        excerpt: "Test excerpt",
        content: "Test content",
        category: "Vardagsliv",
        language: "sv",
        published: true,
      })
    ).rejects.toThrow();
  });

  it("requires admin role", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.drafts.save({
        title: "Test Draft",
        excerpt: "Test excerpt",
        content: "Test content",
        category: "Vardagsliv",
        language: "sv",
        published: true,
      })
    ).rejects.toThrow();
  });

  it("saves a new draft for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.drafts.save({
      title: "Auto-save Test Draft",
      excerpt: "Test excerpt for auto-save",
      content: "This is auto-saved content",
      category: "Forskning",
      language: "sv",
      published: false,
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("updates existing draft when saving again (same articleId=null)", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    // Save first draft
    const first = await caller.drafts.save({
      title: "First version",
      excerpt: "First excerpt",
      content: "First content",
      category: "Vardagsliv",
      language: "sv",
      published: true,
    });

    // Save again (should update, not create new)
    const second = await caller.drafts.save({
      title: "Updated version",
      excerpt: "Updated excerpt",
      content: "Updated content",
      category: "Vardagsliv",
      language: "sv",
      published: true,
    });

    // Should return the same draft id
    expect(second.id).toBe(first.id);
  });
});

describe("drafts.get", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.drafts.get({})).rejects.toThrow();
  });

  it("returns a saved draft for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    // Save a draft first
    await caller.drafts.save({
      title: "Retrievable Draft",
      excerpt: "Retrievable excerpt",
      content: "Retrievable content",
      category: "Behandling",
      language: "sv",
      published: true,
    });

    // Get the draft
    const draft = await caller.drafts.get({});
    expect(draft).toBeDefined();
    expect(draft!.title).toBe("Retrievable Draft");
    expect(draft!.excerpt).toBe("Retrievable excerpt");
    expect(draft!.content).toBe("Retrievable content");
    expect(draft!.category).toBe("Behandling");
  });

  it("returns undefined when no draft exists for given articleId", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const draft = await caller.drafts.get({ articleId: 999999 });
    expect(draft).toBeUndefined();
  });
});

describe("drafts.list", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.drafts.list()).rejects.toThrow();
  });

  it("returns all drafts for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const drafts = await caller.drafts.list();
    expect(Array.isArray(drafts)).toBe(true);
    // Should have at least the drafts we created in previous tests
    expect(drafts.length).toBeGreaterThan(0);
  });
});

describe("drafts.delete", () => {
  it("requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.drafts.delete({})).rejects.toThrow();
  });

  it("deletes a draft for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    // Ensure a draft exists
    await caller.drafts.save({
      title: "Draft to delete",
      excerpt: "Will be deleted",
      content: "Delete me",
      category: "Vardagsliv",
      language: "sv",
      published: true,
    });

    // Delete the draft (articleId=null)
    const result = await caller.drafts.delete({});
    expect(result).toEqual({ success: true });

    // Verify it's gone
    const draft = await caller.drafts.get({});
    expect(draft).toBeUndefined();
  });
});
