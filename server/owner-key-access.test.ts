import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isValidOwnerAccessKey } from "./_core/trpc";

const testOwnerKey = "test-only-owner-bookmark-key";
const testOwnerKeyHash = createHash("sha256").update(testOwnerKey).digest("hex");

describe("owner bookmark access", () => {
  it("accepts the correct bookmark key", () => {
    expect(isValidOwnerAccessKey(testOwnerKey, testOwnerKeyHash)).toBe(true);
  });

  it("rejects a missing or incorrect bookmark key", () => {
    expect(isValidOwnerAccessKey(undefined, testOwnerKeyHash)).toBe(false);
    expect(isValidOwnerAccessKey("incorrect-key", testOwnerKeyHash)).toBe(false);
  });
});
