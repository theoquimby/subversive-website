// Menu filters (spec §6.2, plan smaller assumptions). Style families are OR'd; Under 5%
// is AND'd with them and means ABV below 5.0. Drink filters touch beer rows only. Food
// filters are AND'd, and a vegan item counts as vegetarian.
import { isBeer } from "./schema";
import type { ItemView, StyleFamily } from "./view";

export type DrinkFilter = StyleFamily | "under-5";
export type FoodFilter = "vegetarian" | "vegan" | "kid-friendly";
export type Show = "drinks" | "food";

export const DRINK_FILTERS: readonly DrinkFilter[] = [
  "light",
  "hoppy",
  "malty",
  "farmhouse",
  "sour",
  "under-5",
];
export const FOOD_FILTERS: readonly FoodFilter[] = ["vegetarian", "vegan", "kid-friendly"];

export function matchesDrink(i: ItemView, active: ReadonlySet<DrinkFilter>): boolean {
  if (active.size === 0 || !isBeer(i.item)) return true;
  const families = [...active].filter((f): f is StyleFamily => f !== "under-5");
  if (families.length > 0 && !(i.family && families.includes(i.family))) return false;
  if (active.has("under-5") && !(i.item.abv < 5)) return false;
  return true;
}

export function matchesFood(i: ItemView, active: ReadonlySet<FoodFilter>): boolean {
  const tags = new Set<string>(i.item.tags ?? []);
  if (tags.has("vegan")) tags.add("vegetarian");
  for (const f of active) if (!tags.has(f)) return false;
  return true;
}

export function matchCount(items: readonly ItemView[], pred: (i: ItemView) => boolean): number {
  return items.reduce((n, i) => (pred(i) ? n + 1 : n), 0);
}

export function parseShow(param: string | string[] | undefined): Show {
  const v = Array.isArray(param) ? param[0] : param;
  return v === "food" ? "food" : "drinks";
}
