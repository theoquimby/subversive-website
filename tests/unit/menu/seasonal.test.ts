import raw from "@content/menu.json";
import { describe, expect, it } from "vitest";
import { parseMenu } from "@/lib/menu/schema";
import { applySeasonal, inWindow } from "@/lib/menu/seasonal";
import type { IsoDate } from "@/lib/time/ny";

const d = (s: string) => s as IsoDate;
const oct = { seasonal: true, availableFrom: d("2026-10-01"), availableUntil: d("2026-10-31") };

describe("inWindow", () => {
  it("inside, on each bound, outside", () => {
    expect(inWindow(oct, d("2026-10-15"))).toBe(true);
    expect(inWindow(oct, d("2026-10-01"))).toBe(true);
    expect(inWindow(oct, d("2026-10-31"))).toBe(true);
    expect(inWindow(oct, d("2026-09-30"))).toBe(false);
    expect(inWindow(oct, d("2026-11-01"))).toBe(false);
  });

  it("a missing bound is open; no window is always in", () => {
    expect(inWindow({ availableFrom: d("2026-10-01") }, d("2030-01-01"))).toBe(true);
    expect(inWindow({ availableUntil: d("2026-10-31") }, d("2020-01-01"))).toBe(true);
    expect(inWindow({ seasonal: true }, d("2026-11-13"))).toBe(true);
    expect(inWindow({}, d("2026-11-13"))).toBe(true);
  });
});

describe("applySeasonal", () => {
  const menu = parseMenu(raw);

  it("on 2026-11-13 both specials sections are gone and Festbier remains", () => {
    const out = applySeasonal(menu, d("2026-11-13"));
    expect(out.drinks.map((s) => s.id)).not.toContain("drink-specials");
    expect(out.food.map((s) => s.id)).not.toContain("seasonal-specials");
    const names = out.drinks.flatMap((s) => s.groups.flatMap((g) => g.items.map((i) => i.name)));
    expect(names).toContain("Festbier");
    expect(names).toContain("Mountain Märzen");
  });

  it("in October the specials are there", () => {
    const out = applySeasonal(menu, d("2026-10-23"));
    expect(out.drinks.map((s) => s.id)).toContain("drink-specials");
    expect(out.food.map((s) => s.id)).toContain("seasonal-specials");
  });

  it("drops a section emptied by item windows, and an emptied group", () => {
    const m = structuredClone(menu);
    const sides = m.food.find((s) => s.id === "sides");
    for (const item of sides?.items ?? []) item.availableUntil = d("2026-01-01");
    const beer = m.drinks[0];
    for (const item of beer?.groups[0]?.items ?? []) item.availableFrom = d("2027-01-01");
    const out = applySeasonal(m, d("2026-11-13"));
    expect(out.food.map((s) => s.id)).not.toContain("sides");
    expect(out.drinks[0]?.groups.map((g) => g.title)).not.toContain("Light");
  });

  it("does not mutate its input", () => {
    const before = JSON.stringify(menu);
    applySeasonal(menu, d("2026-11-13"));
    expect(JSON.stringify(menu)).toBe(before);
  });
});
