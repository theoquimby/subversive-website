// The parts of the site that Max can change in Ops: this week's hours, a notice, the
// contact details and links (contract §1). Read from the Ops feed and laid over
// content/site.json; on any failure the file stands alone, as before.
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { fetchOps, opsBase } from "../ops/fetch";
import { type Announcement, currentAnnouncements, parseAnnouncements } from "./announcements";
import { type Site, weekly } from "./schema";
import { getSite } from "./site";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const opsSiteSchema = z.object({
  // the same week shape, with the same checks, as site.json
  hours: weekly,
  notice: z.object({ text: z.string().min(1).max(280), until: date.nullable() }).nullable(),
  name: z.string().min(1).nullable().optional(),
  address: z
    .object({ street: z.string(), city: z.string(), state: z.string(), zip: z.string() })
    .nullable()
    .optional(),
  phone: z
    .object({ display: z.string(), tel: z.string(), note: z.string().optional() })
    .nullable()
    .optional(),
  email: z.email().nullable().optional(),
  links: z.record(z.string(), z.url()).optional(),
  // optional, newer than the contract: each entry checked on its own (announcements.ts),
  // so a bad one never sinks the hours
  announcements: z.unknown().optional().transform(parseAnnouncements),
});
export type OpsSite = z.infer<typeof opsSiteSchema>;

export interface LiveSite extends Site {
  /** one line from Max, or null; already dropped once its last day has passed */
  notice: { text: string; until: string | null } | null;
  /** the band under the header: those that stand today, at most three; usually none */
  announcements: Announcement[];
}

const LINK_KEYS = ["order", "eGiftCard", "map", "instagram", "facebook", "bandBookingForm"] as const;

/** Lay the Ops answer over site.json. Pure, so it can be tested without a network. */
export function mergeSite(file: Site, ops: OpsSite, today: string): LiveSite {
  const links = { ...file.links };
  for (const k of LINK_KEYS) {
    const v = ops.links?.[k];
    if (v) links[k] = v;
  }
  return {
    ...file,
    hours: ops.hours,
    name: ops.name ?? file.name,
    address: ops.address ? { ...file.address, ...ops.address } : file.address,
    phone: ops.phone ? { ...file.phone, ...ops.phone, note: ops.phone.note ?? file.phone.note } : file.phone,
    email: ops.email ?? file.email,
    links,
    // the feed stops sending a notice after its last day; an old cache might not
    notice: ops.notice && (ops.notice.until === null || ops.notice.until >= today) ? ops.notice : null,
    announcements: currentAnnouncements(ops.announcements, today),
  };
}

const read = unstable_cache(
  async (): Promise<OpsSite> => opsSiteSchema.parse(await fetchOps("/api/public/site")),
  ["ops-site"],
  { revalidate: 300, tags: ["site"] },
);

/** The site as it stands now: site.json, with Ops laid over it when the feed is on and well. */
export async function getLiveSite(today: string): Promise<LiveSite> {
  const file = getSite();
  if (!opsBase()) return { ...file, notice: null, announcements: [] };
  try {
    return mergeSite(file, await read(), today);
  } catch (e) {
    console.warn(`site: Ops feed not used (${e instanceof Error ? e.message : "error"}); using site.json`);
    return { ...file, notice: null, announcements: [] };
  }
}
