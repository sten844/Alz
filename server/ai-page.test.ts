import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@test.com",
    name: "Test Admin",
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

describe("aiPage", () => {
  describe("getSections (public)", () => {
    it("returns sections with items from the database", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const sections = await caller.aiPage.getSections();

      expect(Array.isArray(sections)).toBe(true);
      expect(sections.length).toBeGreaterThanOrEqual(5);

      // Check structure of first section
      const firstSection = sections[0];
      expect(firstSection).toHaveProperty("sectionKey");
      expect(firstSection).toHaveProperty("titleSv");
      expect(firstSection).toHaveProperty("titleEn");
      expect(firstSection).toHaveProperty("items");
      expect(Array.isArray(firstSection.items)).toBe(true);
    });

    it("returns sections sorted by sortOrder", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const sections = await caller.aiPage.getSections();

      for (let i = 1; i < sections.length; i++) {
        expect(sections[i].sortOrder).toBeGreaterThanOrEqual(sections[i - 1].sortOrder);
      }
    });

    it("includes cognitive_help section with items", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const sections = await caller.aiPage.getSections();

      const cogHelp = sections.find(s => s.sectionKey === "cognitive_help");
      expect(cogHelp).toBeDefined();
      expect(cogHelp!.items.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe("updateSection (admin)", () => {
    it("updates section title and subtitle", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiPage.updateSection({
        sectionKey: "cognitive_help",
        titleSv: "AI som hjälpmedel (uppdaterad)",
        titleEn: "AI as an aid (updated)",
      });
      expect(result).toEqual({ success: true });

      // Verify the update
      const sections = await caller.aiPage.getSections();
      const updated = sections.find(s => s.sectionKey === "cognitive_help");
      expect(updated?.titleSv).toBe("AI som hjälpmedel (uppdaterad)");
      expect(updated?.titleEn).toBe("AI as an aid (updated)");

      // Restore original
      await caller.aiPage.updateSection({
        sectionKey: "cognitive_help",
        titleSv: "AI som hjälpmedel",
        titleEn: "AI as an aid",
      });
    });
  });

  describe("createItem (admin)", () => {
    let createdItemId: number;

    it("creates a new item in a section", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiPage.createItem({
        sectionKey: "tools",
        nameSv: "Test AI Verktyg",
        nameEn: "Test AI Tool",
        descSv: "Ett testverktyg",
        descEn: "A test tool",
        url: "https://test.example.com",
        linkTextSv: "Testa",
        linkTextEn: "Test",
        iconName: "Sparkles",
        sortOrder: 99,
        visible: true,
      });

      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");
      createdItemId = result.id;
    });

    it("the new item appears in getSections", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const sections = await caller.aiPage.getSections();

      const tools = sections.find(s => s.sectionKey === "tools");
      const newItem = tools?.items.find((i: any) => i.id === createdItemId);
      expect(newItem).toBeDefined();
      expect(newItem?.nameSv).toBe("Test AI Verktyg");
    });

    it("updates the created item", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiPage.updateItem({
        id: createdItemId,
        nameSv: "Uppdaterat Verktyg",
        descSv: "Uppdaterad beskrivning",
      });
      expect(result).toEqual({ success: true });
    });

    it("deletes the created item", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiPage.deleteItem({ id: createdItemId });
      expect(result).toEqual({ success: true });

      // Verify deletion
      const sections = await caller.aiPage.getSections();
      const tools = sections.find(s => s.sectionKey === "tools");
      const deleted = tools?.items.find((i: any) => i.id === createdItemId);
      expect(deleted).toBeUndefined();
    });
  });

  describe("visibility toggle", () => {
    it("can hide and show a section", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Hide
      await caller.aiPage.updateSection({
        sectionKey: "useful_links",
        visible: false,
      });

      let sections = await caller.aiPage.getSections();
      let links = sections.find(s => s.sectionKey === "useful_links");
      expect(links?.visible).toBe(false);

      // Show again
      await caller.aiPage.updateSection({
        sectionKey: "useful_links",
        visible: true,
      });

      sections = await caller.aiPage.getSections();
      links = sections.find(s => s.sectionKey === "useful_links");
      expect(links?.visible).toBe(true);
    });
  });
});
