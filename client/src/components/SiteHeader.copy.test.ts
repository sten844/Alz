import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/components/SiteHeader.tsx"), "utf8");

describe("SiteHeader ingress", () => {
  it("visar den godkända svenska ingresstexten", () => {
    expect(source).toContain(
      "En personlig webbplats om att leva med Alzheimer – och om mitt försök att följa forskning, behandling och vardagsliv.",
    );
  });

  it("har en motsvarande engelsk ingresstext", () => {
    expect(source).toContain(
      "A personal website about living with Alzheimer's – and about my attempt to follow research, treatment and everyday life.",
    );
  });
});
