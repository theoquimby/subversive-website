import raw from "@content/menu.json";
import { describe, expect, it } from "vitest";
import {
  type DrinkFilter,
  type FoodFilter,
  matchCount,
  matchesDrink,
  matchesFood,
  parseShow,
} from "@/lib/menu/filters";
import { parseMenu } from "@/lib/menu/schema";
import { buildMenuView, draftBeers, findItem } from "@/lib/menu/view";

const view = buildMenuView(parseMenu(raw));
const beers = draftBeers(view);
const names = (active: DrinkFilter[]) =>
  beers.filter((b) => matchesDrink(b, new Set(active))).map((b) => b.item.name);
const item = (id: string) => {
  const found = findItem(view, id);
  if (!found) throw new Error(id);
  return found;
};

describe("drink filters (plan smaller assumptions)", () => {
  it("nothing active matches everything", () => {
    expect(names([])).toHaveLength(beers.length);
  });

  it("each family alone", () => {
    expect(names(["light"])).toEqual(["Puff Puff Pils", "¡Chinga La Migra!"]);
    expect(names(["hoppy"])).toHaveLength(3);
    expect(names(["malty"])).toEqual(["Festbier", "Mountain Märzen"]);
    expect(names(["farmhouse"])).toHaveLength(2);
    expect(names(["sour"])).toEqual(["Forbidden Fruit", "Cheap Dills"]);
  });

  it("two families are OR'd", () => {
    expect(names(["light", "sour"])).toHaveLength(4);
  });

  it("a family AND under-5", () => {
    expect(names(["hoppy", "under-5"])).toEqual([]);
    expect(names(["sour", "under-5"])).toEqual(["Cheap Dills"]);
  });

  it("under-5 excludes 5.0", () => {
    expect(names(["under-5"])).not.toContain("Hoppy American Lager");
    expect(names(["under-5"])).toEqual(["Puff Puff Pils", "¡Chinga La Migra!", "Festbier", "Cheap Dills"]);
  });

  it("drink filters touch beer rows only", () => {
    expect(matchesDrink(item("negroni"), new Set(["hoppy"]))).toBe(true);
  });

  it("matchCount", () => {
    expect(matchCount(beers, (b) => matchesDrink(b, new Set(["light", "sour"])))).toBe(4);
  });
});

describe("food filters", () => {
  const on = (...f: FoodFilter[]) => new Set(f);

  it("vegan matches Vegetarian", () => {
    expect(matchesFood(item("impossible-vegan"), on("vegetarian"))).toBe(true);
    expect(matchesFood(item("impossible-vegan"), on("vegan"))).toBe(true);
    expect(matchesFood(item("impossible-classic"), on("vegan"))).toBe(false);
    expect(matchesFood(item("classic"), on("vegetarian"))).toBe(false);
  });

  it("food filters are AND'd", () => {
    expect(matchesFood(item("frites"), on("vegetarian", "kid-friendly"))).toBe(false);
    expect(matchesFood(item("lil-burger"), on("kid-friendly"))).toBe(true);
    expect(matchesFood(item("classic"), on())).toBe(true);
  });
});

describe("parseShow", () => {
  it("food, drinks, junk, array", () => {
    expect(parseShow("food")).toBe("food");
    expect(parseShow("drinks")).toBe("drinks");
    expect(parseShow("FOOD!")).toBe("drinks");
    expect(parseShow(undefined)).toBe("drinks");
    expect(parseShow(["food", "drinks"])).toBe("food");
    expect(parseShow(["x"])).toBe("drinks");
  });
});
