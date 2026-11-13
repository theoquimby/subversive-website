import { describe, expect, it } from "vitest";
import { SLASH_DEG, slashBand, slashRun, toPoints } from "@/components/graphics/slash";

describe("slash geometry (spec §3.1: about 61° from horizontal)", () => {
  it("is 61 degrees", () => {
    expect(SLASH_DEG).toBe(61);
  });

  it("runs height / tan(61°) horizontally", () => {
    expect(slashRun(100)).toBeCloseTo(100 / Math.tan((61 * Math.PI) / 180), 10);
    expect(slashRun(100)).toBeCloseTo(55.43, 2);
  });

  it("builds a right-leaning band with horizontal ends", () => {
    const p = slashBand({ height: 100, thickness: 12 });
    // bottom-left, bottom-right, top-right, top-left
    expect(p[0]).toEqual([0, 100]);
    expect(p[1]).toEqual([12, 100]);
    expect(p[2]?.[0]).toBeCloseTo(12 + 55.43, 2);
    expect(p[2]?.[1]).toBe(0);
    expect(p[3]?.[0]).toBeCloseTo(55.43, 2);
    expect(p[3]?.[1]).toBe(0);
  });

  it("has sides parallel at 61°", () => {
    const [bl, , tr, tl] = slashBand({ height: 80, thickness: 10 });
    const angle = (a: [number, number], b: [number, number]) =>
      (Math.atan2(a[1] - b[1], b[0] - a[0]) * 180) / Math.PI;
    expect(angle(bl as [number, number], tl as [number, number])).toBeCloseTo(61, 6);
    expect(angle([10, 80], tr as [number, number])).toBeCloseTo(61, 6);
  });

  it("formats points for SVG to two decimals", () => {
    expect(
      toPoints([
        [0, 1],
        [2.345, 3],
      ]),
    ).toBe("0,1 2.35,3");
  });
});
