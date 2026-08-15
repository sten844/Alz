import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return { ...actual, getSiteSetting: vi.fn(), upsertSiteSetting: vi.fn() };
});

import { appRouter } from "./routers";
import { getSiteSetting, upsertSiteSetting } from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(role: "admin" | "user" | null): TrpcContext {
  const user: AuthenticatedUser | null = role ? {
    id: 1, openId: `${role}-user`, email: `${role}@example.com`, name: role,
    loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  } : null;
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
}

describe("admin workspace", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the saved private workspace-chat link to an admin", async () => {
    (getSiteSetting as any).mockResolvedValue("https://chat.example.com/workspace");
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.adminWorkspace.get()).resolves.toEqual({ chatLink: "https://chat.example.com/workspace" });
  });

  it("allows an admin to save the private workspace-chat link", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    await expect(caller.adminWorkspace.updateChatLink({ chatLink: "https://chat.example.com/workspace" })).resolves.toEqual({ success: true });
    expect(upsertSiteSetting).toHaveBeenCalledWith("admin_workspace_chat_link", "https://chat.example.com/workspace");
  });

  it("rejects non-admin access", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.adminWorkspace.get()).rejects.toThrow();
  });
});
