import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { resourceLinks } from "../drizzle/schema";
import { sql } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
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

describe("resourceLinks", () => {
  let testLinkId: number;

  it("admin can create a resource link", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.resourceLinks.create({
      category: "swedish",
      nameSv: "Test Länk",
      nameEn: "Test Link",
      descSv: "En testlänk för vitest",
      descEn: "A test link for vitest",
      url: "https://test.example.com",
      sortOrder: 999,
      visible: true,
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    testLinkId = result.id;
  });

  it("admin can list all resource links", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const links = await caller.resourceLinks.listAll();
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThan(0);

    const testLink = links.find((l: any) => l.id === testLinkId);
    expect(testLink).toBeDefined();
    expect(testLink?.nameSv).toBe("Test Länk");
  });

  it("public can list visible resource links", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const links = await caller.resourceLinks.list();
    expect(Array.isArray(links)).toBe(true);
    // All returned links should be visible
    for (const link of links) {
      expect((link as any).visible).toBe(true);
    }
  });

  it("admin can update a resource link", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.resourceLinks.update({
      id: testLinkId,
      nameSv: "Uppdaterad Länk",
      visible: false,
    });

    expect(result.success).toBe(true);

    // Verify the update
    const links = await caller.resourceLinks.listAll();
    const updated = links.find((l: any) => l.id === testLinkId);
    expect(updated?.nameSv).toBe("Uppdaterad Länk");
    expect(updated?.visible).toBe(false);
  });

  it("hidden links should not appear in public list", async () => {
    const publicCtx = createPublicContext();
    const publicCaller = appRouter.createCaller(publicCtx);

    const publicLinks = await publicCaller.resourceLinks.list();
    const hiddenLink = publicLinks.find((l: any) => l.id === testLinkId);
    expect(hiddenLink).toBeUndefined();
  });

  it("admin can delete a resource link", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.resourceLinks.delete({ id: testLinkId });
    expect(result.success).toBe(true);

    // Verify deletion
    const links = await caller.resourceLinks.listAll();
    const deleted = links.find((l: any) => l.id === testLinkId);
    expect(deleted).toBeUndefined();
  });

  it("unauthenticated users cannot create links", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.resourceLinks.create({
        category: "swedish",
        nameSv: "Unauthorized",
        nameEn: "Unauthorized",
        descSv: "Should fail",
        descEn: "Should fail",
        url: "https://fail.example.com",
      })
    ).rejects.toThrow();
  });
});
