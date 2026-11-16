// What an order would cost, tax included, as Square works it out. Creates nothing.
import { orderConfig } from "@/lib/order/config";
import { OrderProblem, quote, quoteRequest } from "@/lib/order/order";
import { sameOrigin } from "@/lib/order/origin";

export const dynamic = "force-dynamic";
const json = (body: unknown, status: number) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);
  const parsed = quoteRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);
  try {
    const { env, config } = await orderConfig();
    if (!env || !config.enabled) return json({ error: "off" }, 404);
    return json(await quote(env, parsed.data.lines, config.items), 200);
  } catch (e) {
    if (e instanceof OrderProblem) return json({ error: e.code, itemId: e.itemId }, 400);
    console.warn(`order: quote failed (${e instanceof Error ? e.message : "error"})`);
    return json({ error: "failed" }, 502);
  }
}
