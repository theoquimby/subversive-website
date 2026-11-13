import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NY_PATH, NY_PLACES, NY_VIEWBOX } from "@/components/graphics/ny-map.generated";
import { buildNyMap } from "../../../scripts/build-ny-map.ts";

const place = (id: string) => NY_PLACES.find((p) => p.id === id) as (typeof NY_PLACES)[number];

describe("NY map (plan §3, M6)", () => {
  it("the path is under 4 KB", () => {
    expect(new TextEncoder().encode(NY_PATH).length).toBeLessThan(4096);
  });

  it("every place is inside the viewBox", () => {
    const [, , w, h] = NY_VIEWBOX.split(" ").map(Number) as [number, number, number, number];
    for (const p of NY_PLACES) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(w);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(h);
    }
  });

  it("geography holds: Hammondsport west of Catskill, Hudson Falls north of it", () => {
    expect(place("hammondsport").x).toBeLessThan(place("catskill").x);
    expect(place("hudson-falls").y).toBeLessThan(place("catskill").y);
  });

  it("regenerating gives an identical file", async () => {
    const file = "src/components/graphics/ny-map.generated.ts";
    const before = readFileSync(file, "utf8");
    await buildNyMap();
    expect(readFileSync(file, "utf8")).toBe(before);
  });
});
