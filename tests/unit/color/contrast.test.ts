import { describe, expect, it } from "vitest";
import { apcaLc, composite, parseHex, toHex, wcagRatio } from "@/lib/color/contrast";
import { fromOklch, toOklch } from "@/lib/color/oklch";

describe("wcagRatio", () => {
  it("is 21 for black on white and 1 for a colour on itself", () => {
    expect(wcagRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(wcagRatio("#F5ECDC", "#F5ECDC")).toBeCloseTo(1, 5);
  });
  it("is symmetric", () => {
    expect(wcagRatio("#EE6A1F", "#F5ECDC")).toBeCloseTo(wcagRatio("#F5ECDC", "#EE6A1F"), 10);
  });
  it("matches the plan's measured ember on paper (2.67)", () => {
    expect(wcagRatio("#EE6A1F", "#F5ECDC")).toBeCloseTo(2.67, 2);
  });
});

describe("apcaLc", () => {
  // Reference values from the APCA 0.0.98G-4g reference implementation.
  it("gives Lc 106 for black on white and -108 for white on black", () => {
    expect(apcaLc("#000000", "#FFFFFF")).toBeCloseTo(106.04, 1);
    expect(apcaLc("#FFFFFF", "#000000")).toBeCloseTo(-107.88, 1);
  });
  it("gives the reference value for #888 on #fff", () => {
    expect(apcaLc("#888888", "#FFFFFF")).toBeCloseTo(63.06, 1);
  });
  it("is zero for identical colours", () => {
    expect(apcaLc("#151412", "#151412")).toBe(0);
  });
});

describe("composite", () => {
  it("returns the background at alpha 0 and the foreground at alpha 1", () => {
    expect(composite("#151412", 0, "#F5ECDC")).toBe("#F5ECDC");
    expect(composite("#151412", 1, "#F5ECDC")).toBe("#151412");
  });
  it("mixes in sRGB at the given alpha", () => {
    expect(composite("#000000", 0.5, "#FFFFFF")).toBe("#808080");
  });
});

describe("hex and oklch", () => {
  it("round-trips hex", () => {
    expect(toHex(parseHex("#ee6a1f"))).toBe("#EE6A1F");
  });
  it("round-trips through OKLCH within one 8-bit step", () => {
    for (const hex of ["#EE6A1F", "#2F9BE0", "#F5ECDC", "#151412", "#2DB55D"]) {
      expect(toHex(fromOklch(toOklch(parseHex(hex))))).toBe(hex);
    }
  });
});
