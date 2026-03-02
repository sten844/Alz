import { describe, expect, it, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { deleteDiaryEntry } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Track created entries for cleanup
const createdEntryIds: number[] = [];

afterAll(async () => {
  for (const id of createdEntryIds) {
    try {
      await deleteDiaryEntry(id);
    } catch {
      // ignore cleanup errors
    }
  }
});

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

function createRegularUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
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

describe("diary", () => {
  describe("diary.list (public)", () => {
    it("returns entries and total count for public users", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.diary.list();

      expect(result).toHaveProperty("entries");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.entries)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("respects limit parameter", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.diary.list({ limit: 2, offset: 0 });

      expect(result.entries.length).toBeLessThanOrEqual(2);
    });
  });

  describe("diary.create (admin only)", () => {
    it("allows admin to create a diary entry", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.diary.create({
        content: "Test dagboksinlägg - vitest",
        published: true,
      });

      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");
      // Track for cleanup
      createdEntryIds.push(result.id);
    });

    it("rejects non-admin users from creating entries", async () => {
      const caller = appRouter.createCaller(createRegularUserContext());

      await expect(
        caller.diary.create({
          content: "Should fail",
          published: true,
        })
      ).rejects.toThrow();
    });

    it("rejects unauthenticated users from creating entries", async () => {
      const caller = appRouter.createCaller(createPublicContext());

      await expect(
        caller.diary.create({
          content: "Should fail",
          published: true,
        })
      ).rejects.toThrow();
    });
  });

  describe("diary.update (admin only)", () => {
    it("allows admin to update a diary entry", async () => {
      const adminCaller = appRouter.createCaller(createAdminContext());

      // First create an entry
      const created = await adminCaller.diary.create({
        content: "Original content",
        published: true,
      });
      createdEntryIds.push(created.id);

      // Then update it (translation runs in background, may take time)
      const result = await adminCaller.diary.update({
        id: created.id,
        content: "Updated content",
      });

      expect(result).toEqual({ success: true });
    }, 15000);

    it("rejects non-admin users from updating entries", async () => {
      const caller = appRouter.createCaller(createRegularUserContext());

      await expect(
        caller.diary.update({
          id: 1,
          content: "Should fail",
        })
      ).rejects.toThrow();
    });
  });

  describe("diary.delete (admin only)", () => {
    it("allows admin to delete a diary entry", async () => {
      const adminCaller = appRouter.createCaller(createAdminContext());

      // First create an entry
      const created = await adminCaller.diary.create({
        content: "To be deleted",
        published: true,
      });

      // Then delete it (no need to track since we're deleting it)
      const result = await adminCaller.diary.delete({ id: created.id });
      expect(result).toEqual({ success: true });
    });

    it("rejects non-admin users from deleting entries", async () => {
      const caller = appRouter.createCaller(createRegularUserContext());

      await expect(
        caller.diary.delete({ id: 1 })
      ).rejects.toThrow();
    });
  });

  describe("diary.listAll (admin only)", () => {
    it("allows admin to list all entries including unpublished", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.diary.listAll();

      expect(result).toHaveProperty("entries");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.entries)).toBe(true);
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createRegularUserContext());

      await expect(caller.diary.listAll()).rejects.toThrow();
    });
  });
});
