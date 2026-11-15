import { describe, expect, it } from "vitest";
import { NY_PLACES } from "@/components/graphics/ny-map.generated";
import { projectNY } from "@/lib/map/project";

// The run-time projection must land where the generator put the same places.
const SOURCE: Record<string, [number, number]> = {
  catskill: [42.217, -73.865],
  "hudson-falls": [43.301, -73.586],
  cairo: [42.299, -73.998],
  altamont: [42.7, -74.034],
  hammondsport: [42.408, -77.224],
};

describe("projectNY", () => {
  for (const p of NY_PLACES) {
    const ll = SOURCE[p.id];
    if (!ll) continue;
    it(`puts ${p.label} where the generated map has it`, () => {
      const at = projectNY(ll[0], ll[1]);
      expect(Math.abs(at.x - p.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(at.y - p.y)).toBeLessThanOrEqual(1);
      expect(at.onMap).toBe(true);
    });
  }
  it("says a place far outside New York is not on the map", () => {
    expect(projectNY(34.05, -118.24).onMap).toBe(false);
  });
});
