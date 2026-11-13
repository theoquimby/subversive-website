import { describe, expect, it } from "vitest";
import { CURVES, cubicBezier, curveCss, SPRINGS, sample, springToLinear } from "@/lib/motion/curves";

describe("cubicBezier", () => {
  it("is 0 at t = 0 and 1 at t = 1 for every named curve", () => {
    for (const c of Object.values(CURVES)) {
      const f = cubicBezier(...c.values);
      expect(f(0)).toBeCloseTo(0, 6);
      expect(f(1)).toBeCloseTo(1, 6);
    }
  });

  it("is linear for (0,0,1,1)", () => {
    const f = cubicBezier(0, 0, 1, 1);
    for (const t of [0.1, 0.25, 0.5, 0.9]) expect(f(t)).toBeCloseTo(t, 4);
  });

  it("matches known midpoints", () => {
    // ease-in-out is symmetric: exactly half way at t = 0.5
    expect(cubicBezier(...CURVES.inOut.values)(0.5)).toBeCloseTo(0.5, 4);
    // ease-out decelerates: well past half way at t = 0.5
    expect(cubicBezier(...CURVES.out.values)(0.5)).toBeGreaterThan(0.85);
    // fall accelerates: behind at t = 0.5
    expect(cubicBezier(...CURVES.fall.values)(0.5)).toBeLessThan(0.3);
  });

  it("overshoots about 10% on ease-stamp (spec §2.6)", () => {
    const peak = Math.max(...sample(CURVES.stamp.values, 400));
    expect(peak).toBeGreaterThan(1.08);
    expect(peak).toBeLessThan(1.2);
  });
});

describe("springToLinear", () => {
  const { points, duration, css } = springToLinear(SPRINGS.sticker);
  it("starts at 0 and settles at 1", () => {
    expect(points[0]).toBe(0);
    expect(points.at(-1)).toBe(1);
  });
  it("overshoots, as a sticker spring should", () => {
    expect(Math.max(...points)).toBeGreaterThan(1.02);
  });
  it("settles in a believable time for a pop-in", () => {
    expect(duration).toBeGreaterThan(250);
    expect(duration).toBeLessThan(900);
  });
  it("prints a CSS linear() easing", () => {
    expect(css.startsWith("linear(0, ")).toBe(true);
    expect(css.endsWith(", 1)")).toBe(true);
  });
});

describe("tokens", () => {
  it("prints the CSS the tokens use", () => {
    expect(curveCss(CURVES.out.values)).toBe("cubic-bezier(0.2, 0.8, 0.2, 1)");
  });
  it("keeps the spec springs", () => {
    expect(SPRINGS.sticker).toEqual({ stiffness: 420, damping: 22, mass: 0.9 });
    expect(SPRINGS.heavy).toEqual({ stiffness: 180, damping: 26, mass: 1 });
  });
});
