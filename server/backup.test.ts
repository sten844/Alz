import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    exportAllContent: vi.fn(),
    importAllContent: vi.fn(),
  };
});

import { exportAllContent, importAllContent } from "./db";

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

describe("backup export/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("export (admin only)", () => {
    it("returns all content for admin users", async () => {
      const mockExportData = {
        exportVersion: 1,
        exportDate: "2026-03-13T10:00:00.000Z",
        articles: [{ id: 1, title: "Test Article", language: "sv" }],
        diaryEntries: [{ id: 1, content: "Test diary" }],
        aiSections: [{ id: 1, sectionKey: "tools", titleSv: "Verktyg" }],
        aiItems: [{ id: 1, nameSv: "ChatGPT" }],
        subscribers: [{ id: 1, email: "test@example.com" }],
        sitePages: [{ id: 1, slug: "about" }],
        siteSettings: [{ id: 1, settingKey: "comments_enabled", settingValue: "true" }],
      };
      (exportAllContent as any).mockResolvedValue(mockExportData);
      const caller = appRouter.createCaller(createAdminContext());

      const result = await caller.backup.export();

      expect(result).toEqual(mockExportData);
      expect(exportAllContent).toHaveBeenCalled();
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createUserContext());

      await expect(caller.backup.export()).rejects.toThrow();
    });

    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createPublicContext());

      await expect(caller.backup.export()).rejects.toThrow();
    });
  });

  describe("import (admin only)", () => {
    it("imports content and returns stats for admin users", async () => {
      const mockStats = {
        articles: 5,
        diaryEntries: 3,
        aiSections: 2,
        aiItems: 8,
        subscribers: 4,
        sitePages: 1,
        siteSettings: 2,
      };
      (importAllContent as any).mockResolvedValue(mockStats);
      const caller = appRouter.createCaller(createAdminContext());

      const importData = {
        articles: [{ title: "Test", excerpt: "Test", content: "Test", category: "Forskning", language: "sv" }],
        diaryEntries: [{ content: "Test diary", entryDate: "2026-03-13" }],
      };

      const result = await caller.backup.import(importData);

      expect(result).toEqual({ success: true, stats: mockStats });
      expect(importAllContent).toHaveBeenCalledWith(importData);
    });

    it("works with empty import data", async () => {
      const mockStats = {
        articles: 0,
        diaryEntries: 0,
        aiSections: 0,
        aiItems: 0,
        subscribers: 0,
        sitePages: 0,
        siteSettings: 0,
      };
      (importAllContent as any).mockResolvedValue(mockStats);
      const caller = appRouter.createCaller(createAdminContext());

      const result = await caller.backup.import({});

      expect(result).toEqual({ success: true, stats: mockStats });
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createUserContext());

      await expect(caller.backup.import({ articles: [] })).rejects.toThrow();
    });

    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createPublicContext());

      await expect(caller.backup.import({ articles: [] })).rejects.toThrow();
    });
  });
});
