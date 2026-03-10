import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getSiteSetting: vi.fn(),
    upsertSiteSetting: vi.fn(),
  };
});

import { getSiteSetting, upsertSiteSetting } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

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
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
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
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("site settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("get (public)", () => {
    it("returns setting value when it exists", async () => {
      (getSiteSetting as any).mockResolvedValue("true");
      const caller = appRouter.createCaller(createPublicContext());

      const result = await caller.settings.get({ key: "comments_enabled" });

      expect(result).toBe("true");
      expect(getSiteSetting).toHaveBeenCalledWith("comments_enabled");
    });

    it("returns null when setting does not exist", async () => {
      (getSiteSetting as any).mockResolvedValue(undefined);
      const caller = appRouter.createCaller(createPublicContext());

      const result = await caller.settings.get({ key: "nonexistent" });

      expect(result).toBeNull();
    });
  });

  describe("update (admin only)", () => {
    it("allows admin to update a setting", async () => {
      (upsertSiteSetting as any).mockResolvedValue({ id: 1 });
      const caller = appRouter.createCaller(createAdminContext());

      const result = await caller.settings.update({ key: "comments_enabled", value: "true" });

      expect(result).toEqual({ success: true });
      expect(upsertSiteSetting).toHaveBeenCalledWith("comments_enabled", "true");
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createUserContext());

      await expect(caller.settings.update({ key: "comments_enabled", value: "true" }))
        .rejects.toThrow();
    });

    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createPublicContext());

      await expect(caller.settings.update({ key: "comments_enabled", value: "true" }))
        .rejects.toThrow();
    });
  });
});
