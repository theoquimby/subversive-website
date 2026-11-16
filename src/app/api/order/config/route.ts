// What the browser needs to offer ordering: whether it is on, whether the kitchen is open,
// and which items can be ordered with which options. Never cached: "open" is about now.
import { ORDERING_OFF, orderConfig } from "@/lib/order/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { config } = await orderConfig();
    return Response.json(config, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    // Square unreachable or the catalog unreadable: ordering is simply not offered
    console.warn(`order: config unavailable (${e instanceof Error ? e.message : "error"})`);
    return Response.json(ORDERING_OFF, { headers: { "cache-control": "no-store" } });
  }
}
