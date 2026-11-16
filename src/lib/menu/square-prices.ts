// Live prices from Square (Theo, 2026-11-15).
//
// The kitchen's prices are set in Square, where the till and the ordering page read them.
// This lays those prices over the menu the site already has, so a price changed in Square
// shows here within about ten minutes with nobody editing the site. Nothing else moves:
// names, descriptions, sections and order stay the site's own; draft pours are not sold
// online, so beer keeps its menu prices.
//
// Where the prices come from: the public product list that the brewery's own Square
// ordering page (subversiveonline.square.site) loads in every visitor's browser. Read
// only, no key, nothing is ever written to Square. It is not a documented API, so every
// step assumes it can fail: the list is checked with Zod, an item with a price range
// (options at different prices) is left alone, a name that does not match is left alone,
// and any error at all leaves the menu exactly as it was.
//
// Off in test builds (SV_E2E=1) so tests never depend on the network, and with
// SQUARE_PRICES=off. SQUARE_PRODUCTS_URL overrides the address.
import { unstable_cache } from "next/cache";
import { z } from "zod";
import type { Menu } from "./schema";

const PRODUCTS_URL =
  "https://cdn5.editmysite.com/app/store/api/v28/editor/users/135422299/sites/842531678939396841/products?page=1&per_page=180&visibilities[]=visible";

const productList = z.object({
  data: z.array(
    z.object({
      name: z.string(),
      price: z.object({ low: z.number().nonnegative(), high: z.number().nonnegative() }).optional(),
    }),
  ),
});

/** Square's name for a dish, where it differs from the menu's (both lower case). */
const ALIAS: Record<string, string> = {
  "classic smash burger": "classic",
  "mushroom + swiss burger": "mushroom & swiss",
  "bacon barbecue smash burger": "bacon barbecue",
  "impossible classic burger": "impossible classic",
  "impossible mushroom + swiss burger": "impossible mushroom & swiss",
  "vegan impossible burger": "impossible vegan",
  "panko fried chicken sandwich": "panko fried chicken",
  "buffalo chicken sandwich": "buffalo chicken",
  "grilled chicken sandwich": "grilled chicken",
  "wings (6)": "chicken wings",
};

const norm = (name: string) => name.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();

/** Menu name (normalised) → Square's price, for items with exactly one price. */
export function squarePriceMap(raw: unknown): Map<string, number> {
  const out = new Map<string, number>();
  const parsed = productList.safeParse(raw);
  if (!parsed.success) return out;
  for (const p of parsed.data.data) {
    if (!p.price || p.price.low !== p.price.high || p.price.low <= 0) continue;
    const key = norm(p.name);
    out.set(ALIAS[key] ?? key, p.price.low);
  }
  return out;
}

/** The menu with Square's price on every food item Square has one price for. */
export function applyPrices(menu: Menu, prices: Map<string, number>): Menu {
  if (prices.size === 0) return menu;
  return {
    ...menu,
    food: menu.food.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        const live = prices.get(norm(item.name));
        return live !== undefined && item.price !== undefined && live !== item.price
          ? { ...item, price: live }
          : item;
      }),
    })),
  };
}

const read = unstable_cache(
  async (): Promise<[string, number][]> => {
    const res = await fetch(process.env.SQUARE_PRODUCTS_URL ?? PRODUCTS_URL, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`Square product list answered ${res.status}`);
    return [...squarePriceMap(await res.json())];
  },
  ["square-prices"],
  { revalidate: 600, tags: ["menu"] },
);

export async function withSquarePrices(menu: Menu): Promise<Menu> {
  if (process.env.SV_E2E === "1" || process.env.SQUARE_PRICES === "off") return menu;
  try {
    return applyPrices(menu, new Map(await read()));
  } catch (e) {
    console.warn(`menu: Square prices not used (${e instanceof Error ? e.message : "error"})`);
    return menu;
  }
}
