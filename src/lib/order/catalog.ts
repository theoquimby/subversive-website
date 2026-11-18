// What can be ordered, read from Square's catalog (the till's own list of items).
//
// An item on the site's menu can be ordered when Square has an item of the same name (the
// same matching the live prices use: square-prices.ts) that is not archived, is sold at
// the taproom's location, and has at least one fixed-price variation. Its options are the
// modifier lists Square attaches to it. Everything an order needs is taken from here on the
// server; the browser only ever sends ids and quantities.
//
// What is left out, each on purpose:
//   - anything Square marks sold out at the taproom (the till's "86"), until Square says it
//     is back;
//   - anything alcoholic: Square's own `is_alcoholic` mark, or a category whose name says
//     beer, wine, cider, cocktails or spirits. Selling alcohol to go needs an age check and
//     a decision that is not this code's to make, so it is off unless an item is named in
//     ORDER_ALCOHOL_ALLOW (Square item ids or names, comma separated; empty by default);
//   - an item with a required choice that nobody could make online.
//
// Checked against Square's documentation on 2026-11-18: ListCatalog (`types` and `cursor`
// as query parameters, 100 objects a page, deleted objects never returned), the pricing
// types FIXED_PRICING and VARIABLE_PRICING, `location_overrides[].sold_out` and
// `sold_out_valid_until`, and CatalogItem's `is_alcoholic`, `is_archived`, `categories` and
// `reporting_category`. The path GET /v2/catalog/list itself is from memory: its reference
// page would not load. None of it has been run against Square yet (docs/ordering.md).
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { squareItemKey } from "../menu/square-prices";
import { type SquareEnv, square } from "../square/api";

const money = z.object({ amount: z.number().int().nonnegative(), currency: z.string() });
const presence = {
  is_deleted: z.boolean().optional(),
  present_at_all_locations: z.boolean().optional(),
  present_at_location_ids: z.array(z.string()).optional(),
  absent_at_location_ids: z.array(z.string()).optional(),
};
// what one location does differently: its own price, and whether it has run out
const override = z.object({
  location_id: z.string().optional(),
  price_money: money.optional(),
  pricing_type: z.string().optional(),
  sold_out: z.boolean().optional(),
  sold_out_valid_until: z.string().optional(),
});
type Override = z.infer<typeof override>;
const variation = z.object({
  id: z.string(),
  ...presence,
  item_variation_data: z
    .object({
      name: z.string().optional(),
      pricing_type: z.string().optional(),
      price_money: money.optional(),
      sellable: z.boolean().optional(),
      ordinal: z.number().optional(),
      location_overrides: z.array(override).optional(),
    })
    .optional(),
});
const modifier = z.object({
  id: z.string(),
  ...presence,
  modifier_data: z
    .object({
      name: z.string().optional(),
      price_money: money.optional(),
      hidden_online: z.boolean().optional(),
      ordinal: z.number().optional(),
      location_overrides: z.array(override).optional(),
    })
    .optional(),
});
const categoryRef = z.object({ id: z.string().optional() });
const catalogObject = z.object({
  type: z.string(),
  id: z.string(),
  ...presence,
  category_data: z.object({ name: z.string().optional() }).optional(),
  item_data: z
    .object({
      name: z.string().optional(),
      is_archived: z.boolean().optional(),
      is_alcoholic: z.boolean().optional(),
      categories: z.array(categoryRef).optional(),
      reporting_category: categoryRef.optional(),
      category_id: z.string().optional(),
      variations: z.array(variation).optional(),
      modifier_list_info: z
        .array(
          z.object({
            modifier_list_id: z.string(),
            min_selected_modifiers: z.number().optional(),
            max_selected_modifiers: z.number().optional(),
            enabled: z.boolean().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  modifier_list_data: z
    .object({
      name: z.string().optional(),
      modifiers: z.array(modifier).optional(),
      min_selected_modifiers: z.number().optional(),
      max_selected_modifiers: z.number().optional(),
      modifier_type: z.string().optional(),
    })
    .optional(),
});
const page = z.object({ objects: z.array(catalogObject).optional(), cursor: z.string().optional() });

export interface Choice {
  id: string;
  name: string;
  /** cents */
  price: number;
}
export interface OptionList {
  id: string;
  name: string;
  /** how many must be chosen, and how many may be */
  min: number;
  max: number;
  options: Choice[];
}
export interface Orderable {
  name: string;
  /** one or more sizes or kinds; exactly one is ordered */
  variations: Choice[];
  lists: OptionList[];
}

function here(o: z.infer<z.ZodObject<typeof presence>>, locationId: string): boolean {
  if (o.is_deleted) return false;
  if (o.present_at_all_locations === false) return (o.present_at_location_ids ?? []).includes(locationId);
  return !(o.absent_at_location_ids ?? []).includes(locationId);
}

/** A category name that means alcohol. Categories only: a dish called "Beer Cheese" is not read. */
const ALCOHOL =
  /\b(beers?|drafts?|draughts?|cans|ciders?|wines?|cocktails?|spirits?|liquors?|seltzers?|alcohol)\b/i;

/** ORDER_ALCOHOL_ALLOW: Square item ids or item names, comma separated. Empty by default. */
export function alcoholAllowed(raw: string | undefined = process.env.ORDER_ALCOHOL_ALLOW): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .flatMap((s) => [s, squareItemKey(s)]),
  );
}

/** Square's catalog objects → what can be ordered, keyed by the menu's normalised name. */
export function orderables(
  objects: unknown[],
  locationId: string,
  options: { now?: Date; alcohol?: ReadonlySet<string> } = {},
): Map<string, Orderable> {
  const at = (options.now ?? new Date()).getTime();
  const alcohol = options.alcohol ?? new Set<string>();
  const parsed = objects.flatMap((o) => {
    const r = catalogObject.safeParse(o);
    return r.success ? [r.data] : [];
  });
  const lists = new Map(parsed.filter((o) => o.type === "MODIFIER_LIST").map((o) => [o.id, o]));
  const categories = new Map(
    parsed.filter((o) => o.type === "CATEGORY").map((o) => [o.id, o.category_data?.name ?? ""]),
  );
  const mine = (all: Override[] | undefined) => all?.find((x) => x.location_id === locationId);
  // sold out at the taproom, unless Square gave a time it is back and that time has passed
  const soldOut = (x: Override | undefined) => {
    if (!x?.sold_out) return false;
    const until = x.sold_out_valid_until ? Date.parse(x.sold_out_valid_until) : Number.NaN;
    return !(until <= at);
  };
  const out = new Map<string, Orderable>();
  for (const o of parsed) {
    const d = o.item_data;
    if (o.type !== "ITEM" || !d?.name || d.is_archived || !here(o, locationId)) continue;
    const key = squareItemKey(d.name);
    const inCategories = [...(d.categories ?? []), d.reporting_category ?? {}, { id: d.category_id }];
    const alcoholic =
      d.is_alcoholic === true || inCategories.some((c) => ALCOHOL.test(categories.get(c.id ?? "") ?? ""));
    if (alcoholic && !alcohol.has(o.id) && !alcohol.has(key)) continue;
    const variations = (d.variations ?? [])
      .filter((v) => here(v, locationId) && v.item_variation_data?.sellable !== false)
      .flatMap((v): Choice[] => {
        const vd = v.item_variation_data;
        const local = mine(vd?.location_overrides);
        if (soldOut(local)) return [];
        const price = local?.price_money ?? vd?.price_money;
        const pricing = local?.pricing_type ?? vd?.pricing_type;
        // a variable price is typed in at the till; it cannot be ordered ahead
        if (price?.currency !== "USD" || (pricing && pricing !== "FIXED_PRICING")) return [];
        return [{ id: v.id, name: vd?.name ?? "", price: price.amount }];
      });
    if (variations.length === 0) continue;
    let impossible = false;
    const optionLists = (d.modifier_list_info ?? []).flatMap((info): OptionList[] => {
      const list = lists.get(info.modifier_list_id);
      const ld = list?.modifier_list_data;
      // a free-text modifier list has nothing to choose from
      if (!list || !ld || info.enabled === false || list.is_deleted || ld.modifier_type === "TEXT") return [];
      const options = (ld.modifiers ?? []).flatMap((m): Choice[] => {
        const md = m.modifier_data;
        const local = mine(md?.location_overrides);
        if (!here(m, locationId) || md?.hidden_online || soldOut(local) || !md?.name) return [];
        return [{ id: m.id, name: md.name, price: (local?.price_money ?? md.price_money)?.amount ?? 0 }];
      });
      // -1 on the item defers to the list; 0 or less as a maximum means no limit
      const pick = (own: number | undefined, fallback: number | undefined) =>
        own !== undefined && own >= 0 ? own : (fallback ?? -1);
      const min = Math.max(0, pick(info.min_selected_modifiers, ld.min_selected_modifiers));
      if (options.length < min) impossible = true;
      if (options.length === 0) return [];
      const rawMax = pick(info.max_selected_modifiers, ld.max_selected_modifiers);
      const max = rawMax > 0 ? Math.min(rawMax, options.length) : options.length;
      return [{ id: list.id, name: ld.name ?? "", min: Math.min(min, max), max, options }];
    });
    // an item with a required choice nobody can make cannot be ordered
    if (impossible) continue;
    out.set(key, { name: d.name, variations, lists: optionLists });
  }
  return out;
}

async function readAll(env: SquareEnv): Promise<unknown[]> {
  const all: unknown[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 20; i++) {
    const q = new URLSearchParams({ types: "ITEM,MODIFIER_LIST,CATEGORY" });
    if (cursor) q.set("cursor", cursor);
    const p = page.parse(await square(env, `/catalog/list?${q}`));
    all.push(...(p.objects ?? []));
    cursor = p.cursor;
    if (!cursor) break;
  }
  return all;
}

/**
 * The orderable catalog, cached for one minute (and cleared with the menu's tag): the
 * longest an item marked sold out at the till can still be ordered here.
 */
export function readCatalog(env: SquareEnv): Promise<[string, Orderable][]> {
  const allow = alcoholAllowed();
  return unstable_cache(
    async () => [...orderables(await readAll(env), env.locationId, { alcohol: allow })],
    ["square-catalog", env.sandbox ? "sandbox" : "production", env.locationId, [...allow].sort().join(",")],
    { revalidate: 60, tags: ["menu"] },
  )();
}
