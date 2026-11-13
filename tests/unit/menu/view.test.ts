import raw from "@content/menu.json";
import { describe, expect, it } from "vitest";
import { parseMenu } from "@/lib/menu/schema";
import { applySeasonal } from "@/lib/menu/seasonal";
import { buildMenuView, draftBeers, findItem, kebab } from "@/lib/menu/view";
import type { IsoDate } from "@/lib/time/ny";

const full = buildMenuView(parseMenu(raw));
const allItems = [...full.drinks, ...full.food].flatMap((s) => s.groups.flatMap((g) => g.items));

describe("buildMenuView (plan §5.5)", () => {
  it("ids are unique across the menu", () => {
    const ids = allItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    const sectionIds = [...full.drinks, ...full.food].map((s) => s.id);
    expect(new Set([...sectionIds, ...ids]).size).toBe(sectionIds.length + ids.length);
  });

  it("collisions resolve with the section prefix", () => {
    const ids = allItems.map((i) => i.id);
    expect(ids).toContain("drink-specials-the-full-hookup");
    expect(ids).toContain("seasonal-specials-the-full-hookup");
    expect(ids).toContain("drink-specials-hot-apple-cider");
    expect(ids).toContain("other-beverages-hot-apple-cider");
    expect(ids).not.toContain("the-full-hookup");
  });

  it("kebab ids read cleanly", () => {
    expect(findItem(full, "cheap-dills")?.item.name).toBe("Cheap Dills");
    expect(kebab("¡Chinga La Migra!")).toBe("chinga-la-migra");
    expect(kebab("Lil’ Burger")).toBe("lil-burger");
    expect(kebab("Mushroom & Swiss")).toBe("mushroom-and-swiss");
    expect(kebab("Mountain Märzen")).toBe("mountain-marzen");
  });

  it("families map from group titles", () => {
    expect(findItem(full, "puff-puff-pils")?.family).toBe("light");
    expect(findItem(full, "new-york-nectar")?.family).toBe("hoppy");
    expect(findItem(full, "festbier")?.family).toBe("malty");
    expect(findItem(full, "sudachi-saison")?.family).toBe("farmhouse");
    expect(findItem(full, "forbidden-fruit")?.family).toBe("sour");
    expect(findItem(full, "negroni")?.family).toBeUndefined();
  });

  it("badges: the data's own, else Seasonal", () => {
    expect(findItem(full, "new-york-nectar")?.badge).toBe("Flagship");
    expect(findItem(full, "chinga-la-migra")?.badge).toBe("15% to CCSM");
    expect(findItem(full, "festbier")?.badge).toBe("Seasonal");
    expect(findItem(full, "puff-puff-pils")?.badge).toBeUndefined();
  });

  it("chips per section, with other-beverages split in three", () => {
    expect(full.drinks.map((s) => [s.id, s.chip])).toEqual([
      ["house-beer", "Beer"],
      ["drink-specials", "Specials"],
      ["wine-and-cider", "Wine & cider"],
      ["cocktails", "Cocktails"],
      ["no-alcohol", "No-alcohol"],
    ]);
    expect(full.food.map((s) => s.chip)).toEqual([
      "Burgers",
      "Burgers",
      "Chicken",
      "Small bites",
      "Salads",
      "Sides & sauces",
      "Sides & sauces",
      "This week",
      "Specials",
    ]);
    const wine = full.drinks.find((s) => s.id === "wine-and-cider");
    expect(wine?.groups.map((g) => g.title)).toEqual(["Wine", "Hard cider"]);
  });

  it("an empty description is no description", () => {
    expect(findItem(full, "subversive-saison")?.item.description).toBeUndefined();
  });

  it("draftBeers are the house beers in menu order", () => {
    const now = buildMenuView(applySeasonal(parseMenu(raw), "2026-11-13" as IsoDate));
    const names = draftBeers(now).map((i) => i.item.name);
    expect(names[0]).toBe("Puff Puff Pils");
    expect(names.at(-1)).toBe("Cheap Dills");
    expect(names).toHaveLength(11);
    expect(now.updated).toBe("2026-10-23");
  });
});
