// Announcements from Ops (the site feed's optional `announcements` list): short lines Max
// wants every visitor to see, in a band under the header. Each one is checked on its own;
// a bad one is dropped and logged, never allowed to sink the feed or the others. Pure, so
// it is tested without a network (tests/unit/site/announcements.test.ts).
import { z } from "zod";
import { isIsoDate } from "@/lib/time/ny";

/** At most this many are shown at once, in the feed's order. */
export const MAX_ANNOUNCEMENTS = 3;

const date = z.string().refine(isIsoDate, "expected YYYY-MM-DD");

// an address on this site ("/events/oktoberfest") or a full https one; nothing else
const href = z
  .string()
  .min(1)
  .refine(
    (s) => (s.startsWith("/") && !s.startsWith("//")) || /^https:\/\/[^\s]+$/.test(s),
    "expected /path or https URL",
  );

export const announcementSchema = z.object({
  id: z.string().min(1).max(64),
  text: z.string().trim().min(1).max(140),
  link: z.object({ href, label: z.string().trim().min(1).max(40) }).nullish(),
  tone: z.enum(["info", "event", "closure"]).nullish(),
  from: date.nullish(),
  until: date.nullish(),
});

export type AnnouncementTone = "info" | "event" | "closure";
export interface Announcement {
  id: string;
  text: string;
  link: { href: string; label: string } | null;
  tone: AnnouncementTone;
  from: string | null;
  until: string | null;
}

/** Each entry checked on its own; anything that is not a list gives none. */
export function parseAnnouncements(raw: unknown): Announcement[] {
  if (!Array.isArray(raw)) return [];
  const out: Announcement[] = [];
  for (const item of raw) {
    const r = announcementSchema.safeParse(item);
    if (!r.success) {
      console.warn("announcements: dropped a malformed entry", r.error.issues[0]?.message);
      continue;
    }
    const a = r.data;
    out.push({
      id: a.id,
      text: a.text,
      link: a.link ?? null,
      tone: a.tone ?? "info",
      from: a.from ?? null,
      until: a.until ?? null,
    });
  }
  return out;
}

/** The ones that stand on `today` (New York, YYYY-MM-DD): both ends inclusive, ids unique, at most three. */
export function currentAnnouncements(list: readonly Announcement[], today: string): Announcement[] {
  const seen = new Set<string>();
  const out: Announcement[] = [];
  for (const a of list) {
    if (a.from && a.from > today) continue;
    if (a.until && a.until < today) continue;
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
    if (out.length === MAX_ANNOUNCEMENTS) break;
  }
  return out;
}
