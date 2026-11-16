// An order from the site, turned into Square's own terms and checked on the way.
//
// The browser sends menu item ids, option ids and quantities, plus a name and a phone
// number. Nothing it says about names or prices is believed: every line is looked up in
// the catalog read from Square on the server, the options are checked against what that
// item allows, and Square itself works out tax and the total. A payment is taken for
// exactly the total Square returned for the order it just created.
import { z } from "zod";
import { type SquareEnv, SquareError, square } from "../square/api";
import type { Orderable } from "./catalog";

export const PREP_MINUTES = 20;

const line = z.strictObject({
  itemId: z.string().min(1).max(80),
  variationId: z.string().max(80).optional(),
  quantity: z.number().int().min(1).max(20),
  modifiers: z.array(z.string().min(1).max(80)).max(16).default([]),
});
export const quoteRequest = z.strictObject({ lines: z.array(line).min(1).max(30) });
export const orderRequest = z.strictObject({
  lines: z.array(line).min(1).max(30),
  name: z.string().trim().min(1).max(80),
  // digits with the usual punctuation; Square wants a dialable number
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ().-]{7,24}$/),
  /** the card token from Square's form in the browser */
  token: z.string().min(1).max(600),
  /** made once per attempt by the browser, so a retry can never charge twice */
  idempotencyKey: z.string().regex(/^[A-Za-z0-9-]{16,40}$/),
});
export type OrderLine = z.infer<typeof line>;

export class OrderProblem extends Error {
  readonly code: "unknown-item" | "bad-options" | "closed" | "empty";
  readonly itemId?: string;
  constructor(code: OrderProblem["code"], itemId?: string) {
    super(code);
    this.name = "OrderProblem";
    this.code = code;
    this.itemId = itemId;
  }
}

/** The lines as Square's line items; throws OrderProblem when a line cannot be ordered. */
export function lineItems(lines: OrderLine[], items: Record<string, Orderable>) {
  return lines.map((l) => {
    const item = items[l.itemId];
    if (!item) throw new OrderProblem("unknown-item", l.itemId);
    const variation =
      item.variations.length === 1 && !l.variationId
        ? item.variations[0]
        : item.variations.find((v) => v.id === l.variationId);
    if (!variation) throw new OrderProblem("bad-options", l.itemId);
    const chosen = new Set(l.modifiers);
    if (chosen.size !== l.modifiers.length) throw new OrderProblem("bad-options", l.itemId);
    let matched = 0;
    for (const list of item.lists) {
      const n = list.options.filter((o) => chosen.has(o.id)).length;
      if (n < list.min || n > list.max) throw new OrderProblem("bad-options", l.itemId);
      matched += n;
    }
    // an option that belongs to no list of this item
    if (matched !== chosen.size) throw new OrderProblem("bad-options", l.itemId);
    return {
      catalog_object_id: variation.id,
      quantity: String(l.quantity),
      ...(chosen.size ? { modifiers: [...chosen].map((id) => ({ catalog_object_id: id })) } : {}),
    };
  });
}

const moneyOut = z.object({ amount: z.number().int().nonnegative(), currency: z.string() });
const orderOut = z.object({
  order: z.object({
    id: z.string().optional(),
    total_money: moneyOut,
    total_tax_money: moneyOut.optional(),
  }),
});

function orderBody(env: SquareEnv, lines: ReturnType<typeof lineItems>) {
  return {
    location_id: env.locationId,
    line_items: lines,
    // Square applies the taxes and any automatic discounts set on these items in its catalog
    pricing_options: { auto_apply_taxes: true, auto_apply_discounts: true },
  };
}

export interface Quote {
  /** cents */
  total: number;
  tax: number | null;
}

/** What Square says this order costs, tax included. Nothing is created. */
export async function quote(
  env: SquareEnv,
  lines: OrderLine[],
  items: Record<string, Orderable>,
): Promise<Quote> {
  const res = orderOut.parse(
    await square(env, "/orders/calculate", { body: { order: orderBody(env, lineItems(lines, items)) } }),
  );
  return { total: res.order.total_money.amount, tax: res.order.total_tax_money?.amount ?? null };
}

export type Placed =
  | { ok: true; total: number; reference: string }
  | { ok: false; reason: "declined" | "card" | "failed" };

/** Create the pickup order in Square, then take payment for exactly its total. */
export async function place(
  env: SquareEnv,
  req: z.infer<typeof orderRequest>,
  items: Record<string, Orderable>,
): Promise<Placed> {
  const created = orderOut.parse(
    await square(env, "/orders", {
      body: {
        idempotency_key: `o-${req.idempotencyKey}`,
        order: {
          ...orderBody(env, lineItems(req.lines, items)),
          fulfillments: [
            {
              type: "PICKUP",
              state: "PROPOSED",
              pickup_details: {
                recipient: { display_name: req.name, phone_number: req.phone },
                schedule_type: "ASAP",
                prep_time_duration: `PT${PREP_MINUTES}M`,
              },
            },
          ],
        },
      },
    }),
  );
  const { id, total_money } = created.order;
  if (!id || total_money.amount <= 0) return { ok: false, reason: "failed" };
  try {
    await square(env, "/payments", {
      body: {
        source_id: req.token,
        // 45 characters at most: "p-" and the browser's key
        idempotency_key: `p-${req.idempotencyKey}`,
        amount_money: total_money,
        order_id: id,
        location_id: env.locationId,
        autocomplete: true,
      },
    });
  } catch (e) {
    // The order stays unpaid in Square, where unpaid orders are not shown to the kitchen.
    if (e instanceof SquareError) {
      const card = e.issues.some((i) => i.category === "PAYMENT_METHOD_ERROR");
      if (card)
        return {
          ok: false,
          reason: e.has("GENERIC_DECLINE") || e.has("INSUFFICIENT_FUNDS") ? "declined" : "card",
        };
    }
    throw e;
  }
  return { ok: true, total: total_money.amount, reference: id.slice(-6).toUpperCase() };
}
