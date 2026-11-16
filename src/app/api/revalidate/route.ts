// On-demand refresh for Ops (spec §8.6; contract §6): POST with x-revalidate-secret and
// an optional JSON body {"tags": ["events", "menu", "site"]}. Each named cache is marked
// stale so the next request reads its feed again; with no body, all three. 401 otherwise.
// "instagram" (the Instagram feed, otherwise hourly) is refreshed only when named.
import { revalidateTag } from "next/cache";

const TAGS = ["events", "menu", "site"] as const;
const NAMED_ONLY = ["instagram"] as const;

export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }
  let asked: unknown;
  try {
    asked = ((await req.json()) as { tags?: unknown } | null)?.tags;
  } catch {
    asked = undefined; // no body, or not JSON: refresh everything
  }
  const named: string[] = Array.isArray(asked)
    ? [...TAGS, ...NAMED_ONLY].filter((t) => asked.includes(t))
    : [];
  const tags = named.length > 0 ? named : [...TAGS];
  for (const t of tags) revalidateTag(t, "max");
  return Response.json({ ok: true, tags });
}
