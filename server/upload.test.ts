import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock storagePut before importing routers
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "article-images/abc123-test.png",
    url: "https://cdn.example.com/article-images/abc123-test.png",
  }),
}));

import { appRouter } from "./routers";
import { storagePut } from "./storage";

// Helper to create a caller with admin context
function createAdminCaller() {
  return appRouter.createCaller({
    user: { id: 1, openId: "test-admin", name: "Admin", role: "admin" },
    req: {} as any,
    res: { clearCookie: vi.fn() } as any,
  });
}

function createUnauthCaller() {
  return appRouter.createCaller({
    user: null,
    req: {} as any,
    res: { clearCookie: vi.fn() } as any,
  });
}

describe("upload.image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload an image and return the URL", async () => {
    const caller = createAdminCaller();
    // Small 1x1 red PNG as base64
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    const result = await caller.upload.image({
      fileName: "test-image.png",
      fileData: base64Data,
      contentType: "image/png",
    });

    expect(result).toHaveProperty("url");
    expect(result.url).toContain("https://");
    expect(storagePut).toHaveBeenCalledOnce();
    // Check that storagePut was called with correct content type
    const callArgs = (storagePut as any).mock.calls[0];
    expect(callArgs[0]).toContain("article-images/");
    expect(callArgs[0]).toContain("test-image.png");
    expect(callArgs[2]).toBe("image/png");
  });

  it("should sanitize the file name", async () => {
    const caller = createAdminCaller();
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    await caller.upload.image({
      fileName: "my image (1).png",
      fileData: base64Data,
      contentType: "image/png",
    });

    const callArgs = (storagePut as any).mock.calls[0];
    // Should not contain spaces or parentheses
    expect(callArgs[0]).not.toContain(" ");
    expect(callArgs[0]).not.toContain("(");
    expect(callArgs[0]).toContain("my_image__1_.png");
  });

  it("should reject unauthenticated users", async () => {
    const caller = createUnauthCaller();
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    await expect(
      caller.upload.image({
        fileName: "test.png",
        fileData: base64Data,
        contentType: "image/png",
      })
    ).rejects.toThrow();
  });
});
