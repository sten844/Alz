import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { appRouter } from "./routers";
import { invokeLLM } from "./_core/llm";
import type { TrpcContext } from "./_core/context";

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
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("homepage introduction translation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an editable English suggestion without saving settings", async () => {
    (invokeLLM as ReturnType<typeof vi.fn>).mockResolvedValue({
      choices: [{ message: { content: "A personal website about living with Alzheimer's." } }],
    });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.settings.suggestHomepageIntroTranslation({
      swedishText: "En personlig webbplats om att leva med Alzheimer.",
    });

    expect(result).toEqual({ translation: "A personal website about living with Alzheimer's." });
    expect(invokeLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-5-mini" }));
  });
});
