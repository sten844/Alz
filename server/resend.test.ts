import { describe, it, expect } from "vitest";

describe("Resend API key validation", () => {
  it("should authenticate with the Resend API", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.object).toBe("list");
  });
});
