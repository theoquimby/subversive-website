// Seasonal windows (spec §8.4, plan Q17): anything outside its window is left out, then
// any group or section that is left empty. A window's bounds are inclusive; a missing
// bound is open; no window at all is always in (seasonal: true alone only earns a badge).
import type { IsoDate } from "@/lib/time/ny";
import type { Menu, MenuWindow } from "./schema";

export function inWindow(x: MenuWindow, today: IsoDate): boolean {
  if (x.availableFrom && today < x.availableFrom) return false;
  if (x.availableUntil && today > x.availableUntil) return false;
  return true;
}

export function applySeasonal(menu: Menu, today: IsoDate): Menu {
  const keep = (x: MenuWindow) => inWindow(x, today);
  return {
    ...menu,
    drinks: menu.drinks
      .filter(keep)
      .map((s) => ({
        ...s,
        groups: s.groups
          .filter(keep)
          .map((g) => ({ ...g, items: g.items.filter(keep) }))
          .filter((g) => g.items.length > 0),
      }))
      .filter((s) => s.groups.length > 0),
    food: menu.food
      .filter(keep)
      .map((s) => ({ ...s, items: s.items.filter(keep) }))
      .filter((s) => s.items.length > 0),
  };
}
