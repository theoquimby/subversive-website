// Event URLs (spec §6.3, plan Q14): /events/{date}-{kebab-title}. The feed's own slug wins
// when it sends one. A title edit is followed by a redirect when that date has exactly one
// event; a well-formed past slug that is gone shows "This one's over".
import { type IsoDate, isIsoDate } from "@/lib/time/ny";
import type { SiteEvent } from "./enrich";
import type { FeedEvent } from "./schema";

export function kebab(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’'‘]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function eventSlug(e: Pick<FeedEvent, "slug" | "date" | "title">): string {
  return e.slug ?? `${e.date}-${kebab(e.title)}`;
}

export function parseSlug(slug: string): { date: IsoDate; rest: string } | null {
  const m = /^(\d{4}-\d{2}-\d{2})-([a-z0-9-]+)$/.exec(slug);
  if (!m?.[1] || !m[2] || !isIsoDate(m[1])) return null;
  return { date: m[1], rest: m[2] };
}

export type SlugResolution =
  | { type: "found"; event: SiteEvent }
  | { type: "redirect"; slug: string }
  | { type: "over"; date: IsoDate }
  | { type: "missing" };

export function resolveSlug(slug: string, events: readonly SiteEvent[], today: IsoDate): SlugResolution {
  const exact = events.find((e) => e.slug === slug);
  if (exact) return { type: "found", event: exact };
  const parsed = parseSlug(slug);
  if (!parsed) return { type: "missing" };
  const sameDay = events.filter((e) => e.date === parsed.date && e.category !== "notice");
  if (sameDay.length === 1 && sameDay[0]) return { type: "redirect", slug: sameDay[0].slug };
  if (sameDay.length === 0 && parsed.date < today) return { type: "over", date: parsed.date };
  return { type: "missing" };
}
