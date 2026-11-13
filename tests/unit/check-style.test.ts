import { describe, expect, it } from "vitest";
import { scanSource } from "../../scripts/check-style";

describe("check-style scanner", () => {
  it("flags the banned easing keywords in CSS and in code", () => {
    expect(scanSource("a.css", "a { transition: opacity 200ms ease; }")).toHaveLength(1);
    expect(scanSource("a.css", "a { transition-timing-function: ease-in-out; }")).toHaveLength(1);
    expect(scanSource("a.css", "a { animation: x 1s ease-out both; }")).toHaveLength(1);
    expect(scanSource("a.tsx", 'motion({ transition: { ease: "easeOut" } })')).toHaveLength(1);
    expect(scanSource("a.tsx", '<div className="transition ease-in" />')).toHaveLength(1);
  });

  it("allows linear and cubic-bezier easing", () => {
    expect(
      scanSource("a.css", "a { animation: roll 1s linear; transition: x var(--d-1) var(--ease-out); }"),
    ).toEqual([]);
    expect(scanSource("a.css", "a { transition-timing-function: cubic-bezier(.2,.8,.2,1); }")).toEqual([]);
  });

  it("flags hex colours outside tokens and content", () => {
    expect(scanSource("src/components/x.tsx", 'const c = "#151412";')).toHaveLength(1);
    expect(scanSource("src/styles/globals.css", "a { color: #fff; }")).toHaveLength(1);
    expect(scanSource("src/styles/tokens.css", "--ink: #151412;")).toEqual([]);
    expect(scanSource("src/styles/tokens.ts", 'ink: "#151412",')).toEqual([]);
    expect(scanSource("content/menu.json", '"color": "#F2C744"')).toEqual([]);
  });

  it("does not mistake JSX ids or URL fragments for colours", () => {
    expect(scanSource("a.tsx", '<use href="#icon-pin" />')).toEqual([]);
    expect(scanSource("a.tsx", '<a href="#main">Skip</a>')).toEqual([]);
  });

  it("flags vh units and allows svh, dvh and lvh", () => {
    expect(scanSource("a.css", "a { height: 100vh; }")).toHaveLength(1);
    expect(scanSource("a.tsx", 'className="h-[50vh]"')).toHaveLength(1);
    expect(scanSource("a.css", "a { height: 100dvh; min-height: 100svh; max-height: 100lvh; }")).toEqual([]);
  });

  it("ignores comments", () => {
    expect(scanSource("a.css", "/* never use ease or 100vh or #fff */ a { color: var(--fg); }")).toEqual([]);
    expect(scanSource("a.ts", "// no ease here, no 100vh\nconst a = 1;")).toEqual([]);
  });
});
