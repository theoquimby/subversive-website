import { describe, expect, it } from "vitest";
import { burstPoints } from "@/components/graphics/sticker-geometry";

describe("burst (spec §3.5 shape, refined per Theo 11/13: 20 points, outer r 50, inner r 45)", () => {
  const pts = burstPoints();

  it("has 40 vertices", () => {
    expect(pts).toHaveLength(40);
  });

  it("alternates outer 50 and inner 45 around the centre", () => {
    pts.forEach(([x, y], i) => {
      const r = Math.hypot(x - 50, y - 50);
      expect(r).toBeCloseTo(i % 2 === 0 ? 50 : 45, 6);
    });
  });

  it("starts at the top and steps evenly", () => {
    expect(pts[0]?.[0]).toBeCloseTo(50, 6);
    expect(pts[0]?.[1]).toBeCloseTo(0, 6);
    const angle = ([x, y]: [number, number]) => Math.atan2(y - 50, x - 50);
    const step = (2 * Math.PI) / 40;
    const a0 = angle(pts[0] as [number, number]);
    const a1 = angle(pts[1] as [number, number]);
    expect(a1 - a0).toBeCloseTo(step, 6);
  });
});
