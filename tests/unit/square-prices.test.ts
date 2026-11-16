import raw from "@content/menu.json";
import { describe, expect, it } from "vitest";
import { parseMenu } from "@/lib/menu/schema";
import { applyPrices, squarePriceMap } from "@/lib/menu/square-prices";

const menu = parseMenu(raw);
const priceOf = (m: typeof menu, name: string) =>
  m.food.flatMap((s) => s.items).find((i) => i.name === name)?.price;
const list = (items: { name: string; low: number; high: number }[]) => ({
  data: items.map((i) => ({ name: i.name, price: { low: i.low, high: i.high }, visibility: "visible" })),
});

describe("live prices from Square", () => {
  it("lays Square's price over the menu's, matching Square's longer names to the menu's", () => {
    const prices = squarePriceMap(
      list([
        { name: "Classic Smash Burger", low: 19, high: 19 },
        { name: "Wings (6)", low: 14, high: 14 },
        { name: "Frites", low: 12, high: 12 },
      ]),
    );
    const live = applyPrices(menu, prices);
    expect(priceOf(live, "Classic")).toBe(19);
    expect(priceOf(live, "Chicken Wings")).toBe(14);
    expect(priceOf(live, "Frites")).toBe(priceOf(menu, "Frites"));
    // nothing but prices moves
    expect(live.food.map((s) => s.items.map((i) => i.name))).toEqual(
      menu.food.map((s) => s.items.map((i) => i.name)),
    );
    expect(live.drinks).toBe(menu.drinks);
  });

  it("leaves an item alone when Square has a range of prices for it, or none", () => {
    const prices = squarePriceMap(
      list([
        { name: "Lil’ Burger", low: 9, high: 11 },
        { name: "Sauces & Sides", low: 0, high: 0 },
      ]),
    );
    expect(prices.size).toBe(0);
    expect(applyPrices(menu, prices)).toBe(menu);
  });

  it("ignores things Square sells that the menu does not list", () => {
    const live = applyPrices(
      menu,
      squarePriceMap(list([{ name: "40 CL Pilsner Glass", low: 15, high: 15 }])),
    );
    expect(live.food).toEqual(menu.food);
  });

  it("a list in an unexpected shape changes nothing", () => {
    for (const bad of [null, {}, { data: "no" }, { data: [{ title: "x" }] }, "<html>"]) {
      expect(squarePriceMap(bad).size).toBe(0);
    }
  });
});
