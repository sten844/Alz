import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    createSubscriber: vi.fn(),
    unsubscribe: vi.fn(),
    listSubscribers: vi.fn(),
    deleteSubscriber: vi.fn(),
    getActiveSubscriberCount: vi.fn(),
  };
});

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { createSubscriber, unsubscribe, listSubscribers, deleteSubscriber, getActiveSubscriberCount } from "./db";

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

describe("subscribers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("subscribe (public)", () => {
    it("creates a new subscriber", async () => {
      (createSubscriber as any).mockResolvedValue({ id: 1, alreadyExists: false });
      const caller = appRouter.createCaller(createPublicContext());

      const result = await caller.subscribers.subscribe({ email: "test@example.com" });

      expect(result).toEqual({ success: true, alreadyExists: false });
      expect(createSubscriber).toHaveBeenCalledWith("test@example.com");
    });

    it("reports when subscriber already exists", async () => {
      (createSubscriber as any).mockResolvedValue({ id: 1, alreadyExists: true });
      const caller = appRouter.createCaller(createPublicContext());

      const result = await caller.subscribers.subscribe({ email: "existing@example.com" });

      expect(result).toEqual({ success: true, alreadyExists: true });
    });

    it("rejects invalid email", async () => {
      const caller = appRouter.createCaller(createPublicContext());

      await expect(caller.subscribers.subscribe({ email: "not-an-email" }))
        .rejects.toThrow();
    });
  });

  describe("unsubscribe (public)", () => {
    it("unsubscribes an email", async () => {
      (unsubscribe as any).mockResolvedValue(undefined);
      const caller = appRouter.createCaller(createPublicContext());

      const result = await caller.subscribers.unsubscribe({ email: "test@example.com" });

      expect(result).toEqual({ success: true });
      expect(unsubscribe).toHaveBeenCalledWith("test@example.com");
    });
  });

  describe("list (admin only)", () => {
    it("returns subscriber list for admin", async () => {
      const mockSubs = [
        { id: 1, email: "a@test.com", confirmed: true, active: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, email: "b@test.com", confirmed: true, active: false, createdAt: new Date(), updatedAt: new Date() },
      ];
      (listSubscribers as any).mockResolvedValue(mockSubs);
      const caller = appRouter.createCaller(createAdminContext());

      const result = await caller.subscribers.list();

      expect(result).toEqual(mockSubs);
      expect(listSubscribers).toHaveBeenCalled();
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createPublicContext());

      await expect(caller.subscribers.list()).rejects.toThrow();
    });
  });

  describe("count (admin only)", () => {
    it("returns active subscriber count", async () => {
      (getActiveSubscriberCount as any).mockResolvedValue(5);
      const caller = appRouter.createCaller(createAdminContext());

      const result = await caller.subscribers.count();

      expect(result).toBe(5);
    });
  });

  describe("delete (admin only)", () => {
    it("deletes a subscriber", async () => {
      (deleteSubscriber as any).mockResolvedValue(undefined);
      const caller = appRouter.createCaller(createAdminContext());

      const result = await caller.subscribers.delete({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(deleteSubscriber).toHaveBeenCalledWith(1);
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createPublicContext());

      await expect(caller.subscribers.delete({ id: 1 })).rejects.toThrow();
    });
  });
});
