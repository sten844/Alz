import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/SiteHeader.tsx"), "utf8");
const adminSource = readFileSync(resolve(process.cwd(), "client/src/pages/AdminPage.tsx"), "utf8");

describe("SiteHeader ingress", () => {
  it("visar den godkända svenska ingresstexten", () => {
    expect(source).toContain("homepage_intro_sv");
    expect(source).toContain(
      "En personlig webbplats om att leva med Alzheimer – och om mitt försök att följa forskning, finna behandling och förbättra vardagsliv.",
    );
  });

  it("har en motsvarande engelsk ingresstext", () => {
    expect(source).toContain("homepage_intro_en");
    expect(source).toContain(
      "A personal website about living with Alzheimer's – and about my attempt to follow research, find treatments, and improve everyday life.",
    );
  });

  it("gör båda ingressversionerna redigerbara i administrationsläget", () => {
    expect(adminSource).toContain('key: "homepage_intro_sv", value: form.introSv');
    expect(adminSource).toContain('key: "homepage_intro_en", value: form.introEn');
    expect(adminSource).toContain("Ingresstext (svenska)");
    expect(adminSource).toContain("Ingresstext (engelska)");
  });
});
