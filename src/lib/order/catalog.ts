// What can be ordered, read from Square's catalog (the till's own list of items).
//
// An item on the site's menu can be ordered when Square has an item of the same name (the
// same matching the live prices use: square-prices.ts) that is not archived, is sold at
// the taproom's location, and has at least one fixed-price variation. Its options are the
// modifier lists Square attaches to it. Everything an order needs is taken from here on the
// server; the browser only ever sends ids and quantities.
//
// Checked against Square's reference on 2026-11-15: the object fields used below. Not
// confirmable from the docs that day, and so to be confirmed in the sandbox before this is
// switched on: the ListCatalog request shape (GET /v2/catalog/list with `types` and
// `cursor`) and the `pricing_type` value "FIXED_PRICING".
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
    })
    .optional(),
});
const catalogObject = z.object({
  type: z.string(),
  id: z.string(),
  ...presence,
  item_data: z
    .object({
      name: z.string().optional(),
      is_archived: z.boolean().optional(),
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

/** Square's catalog objects → what can be ordered, keyed by the menu's normalised name. */
export function orderables(objects: unknown[], locationId: string): Map<string, Orderable> {
  const parsed = objects.flatMap((o) => {
    const r = catalogObject.safeParse(o);
    return r.success ? [r.data] : [];
  });
  const lists = new Map(parsed.filter((o) => o.type === "MODIFIER_LIST").map((o) => [o.id, o]));
  const out = new Map<string, Orderable>();
  for (const o of parsed) {
    const d = o.item_data;
    if (o.type !== "ITEM" || !d?.name || d.is_archived || !here(o, locationId)) continue;
    const variations = (d.variations ?? [])
      .filter((v) => here(v, locationId) && v.item_variation_data?.sellable !== false)
      .flatMap((v): Choice[] => {
        const vd = v.item_variation_data;
        const price = vd?.price_money;
        // a variable price is typed in at the till; it cannot be ordered ahead
        if (!price || price.currency !== "USD" || (vd?.pricing_type && vd.pricing_type !== "FIXED_PRICING"))
          return [];
        return [{ id: v.id, name: vd?.name ?? "", price: price.amount }];
      });
    if (variations.length === 0) continue;
    const optionLists = (d.modifier_list_info ?? []).flatMap((info): OptionList[] => {
      const list = lists.get(info.modifier_list_id);
      const ld = list?.modifier_list_data;
      // a free-text modifier list has nothing to choose from
      if (!list || !ld || info.enabled === false || list.is_deleted || ld.modifier_type === "TEXT") return [];
      const options = (ld.modifiers ?? [])
        .filter((m) => here(m, locationId) && !m.modifier_data?.hidden_online)
        .map((m) => ({
          id: m.id,
          name: m.modifier_data?.name ?? "",
          price: m.modifier_data?.price_money?.amount ?? 0,
        }))
        .filter((m) => m.name);
      if (options.length === 0) return [];
      // -1 on the item defers to the list; 0 or less as a maximum means no limit
      const pick = (own: number | undefined, fallback: number | undefined) =>
        own !== undefined && own >= 0 ? own : (fallback ?? -1);
      const min = Math.max(0, pick(info.min_selected_modifiers, ld.min_selected_modifiers));
      const rawMax = pick(info.max_selected_modifiers, ld.max_selected_modifiers);
      const max = rawMax > 0 ? Math.min(rawMax, options.length) : options.length;
      return [{ id: list.id, name: ld.name ?? "", min: Math.min(min, max), max, options }];
    });
    // an item with a required choice nobody can make cannot be ordered
    out.set(squareItemKey(d.name), { name: d.name, variations, lists: optionLists });
  }
  return out;
}

async function readAll(env: SquareEnv): Promise<unknown[]> {
  const all: unknown[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 20; i++) {
    const q = new URLSearchParams({ types: "ITEM,MODIFIER_LIST" });
    if (cursor) q.set("cursor", cursor);
    const p = page.parse(await square(env, `/catalog/list?${q}`));
    all.push(...(p.objects ?? []));
    cursor = p.cursor;
    if (!cursor) break;
  }
  return all;
}

/** The orderable catalog, cached for five minutes (and cleared with the menu's tag). */
export function readCatalog(env: SquareEnv): Promise<[string, Orderable][]> {
  return unstable_cache(
    async () => [...orderables(await readAll(env), env.locationId)],
    ["square-catalog", env.sandbox ? "sandbox" : "production", env.locationId],
    { revalidate: 300, tags: ["menu"] },
  )();
}
