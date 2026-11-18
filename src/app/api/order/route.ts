// Place an order: create it in Square as a pickup order and pay for it with the card token
// from Square's own form. The card's details never reach this server.
import { orderConfig } from "@/lib/order/config";
import { OrderProblem, orderRequest, place } from "@/lib/order/order";
import { sameOrigin } from "@/lib/order/origin";

export const dynamic = "force-dynamic";
const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  const parsed = orderRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  try {
    const { env, config } = await orderConfig();
    if (!env || !config.enabled) return json({ error: "off" }, 404);
    // the kitchen may have closed while the cart was open
    if (!config.open) return json({ error: "closed" }, 409);
    const placed = await place(env, parsed.data, config.items);
    // the total moved since the visitor saw it: nothing charged, here is the new one
    if (!placed.ok && placed.reason === "changed")
      return json({ error: "changed", total: placed.total, tax: placed.tax }, 409);
    if (!placed.ok) return json({ error: placed.reason }, 402);
    return json(
      { ok: true, total: placed.total, reference: placed.reference, prepMinutes: config.prepMinutes },
      200,
    );
  } catch (e) {
    if (e instanceof OrderProblem) return json({ error: e.code, itemId: e.itemId }, 400);
    console.error(`order: could not be placed (${e instanceof Error ? e.message : "error"})`);
    return json({ error: "failed" }, 502);
  }
}
