import raw from "@content/menu.json";
import { describe, expect, it } from "vitest";
import { isBeer, parseMenu } from "@/lib/menu/schema";

// biome-ignore lint/suspicious/noExplicitAny: fixtures are broken on purpose
type Loose = any;
const clone = (): Loose => structuredClone(raw);
const firstBeer = (m: Loose): Loose => m.drinks[0].groups[0].items[0];

describe("menu.json (plan §5.5)", () => {
  it("the real file parses", () => {
    const menu = parseMenu(raw);
    expect(menu._meta.updated).toBe("2026-10-23");
    expect(menu.drinks[0]?.id).toBe("house-beer");
    const beer = menu.drinks[0]?.groups[0]?.items[0];
    expect(beer && isBeer(beer)).toBe(true);
  });

  it("rejects an unknown key", () => {
    const m = clone();
    firstBeer(m).colour = "#F2C744";
    expect(() => parseMenu(m)).toThrow();
  });

  it("rejects a beer without a color", () => {
    const m = clone();
    delete firstBeer(m).color;
    expect(() => parseMenu(m)).toThrow();
  });

  it("rejects a bad hex", () => {
    const m = clone();
    firstBeer(m).color = "#F2C74";
    expect(() => parseMenu(m)).toThrow();
  });

  it("rejects availableFrom after availableUntil", () => {
    const m = clone();
    m.drinks[1].availableFrom = "2026-11-01";
    m.drinks[1].availableUntil = "2026-10-31";
    expect(() => parseMenu(m)).toThrow();
  });

  it("rejects an impossible date", () => {
    const m = clone();
    m.drinks[1].availableUntil = "2026-10-32";
    expect(() => parseMenu(m)).toThrow();
  });
});
