// On-demand refresh for Ops (spec §8.6): POST with x-revalidate-secret, and the events
// cache is marked stale so the next request reads the feed again. 401 otherwise.
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag("events", "max");
  return Response.json({ ok: true });
}
