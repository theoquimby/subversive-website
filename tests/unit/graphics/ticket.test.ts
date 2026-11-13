import { describe, expect, it } from "vitest";
import { zigzagEdge } from "@/components/graphics/ticket-geometry";

describe("torn stub edge (spec §3.6)", () => {
  const poly = zigzagEdge({ teeth: 8, depth: 6 });

  it("is a closed CSS polygon starting at the top-left", () => {
    expect(poly.startsWith("polygon(0 0, ")).toBe(true);
    expect(poly.endsWith(", 0 100%)")).toBe(true);
  });

  it("has two points per tooth on the right edge plus the corners", () => {
    const points = poly.slice("polygon(".length, -1).split(", ");
    // 0 0, 100% 0, then 2 per tooth (in, out), then 0 100%
    expect(points).toHaveLength(2 + 8 * 2 + 1);
  });

  it("cuts in by the depth and runs top to bottom", () => {
    expect(poly).toContain("calc(100% - 6px) 6.25%");
    expect(poly).toContain("100% 12.5%");
    expect(poly).toContain("100% 100%");
  });
});
