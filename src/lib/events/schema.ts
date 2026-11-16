// The Ops feed (spec §8.6, plan §5.4): GET /api/public/events → { timezone, events }.
// The envelope must be right or the whole feed is rejected; a single bad event is dropped
// and logged, never allowed to sink the list. Unknown kinds become OTHER (raw kept).
import { z } from "zod";
import { type HHmm, type IsoDate, isHHmm, isIsoDate } from "@/lib/time/ny";
import { type EventKind, toEventKind } from "./kind";

export type { EventKind };

const time = z
  .union([z.string(), z.null()])
  .optional()
  .transform((s) => (s && isHHmm(s) ? (s as HHmm) : null));

const optionalText = z.string().min(1).optional();

// A featured event's own page (Ops → event.page; requested in docs/ops-feed-requests.md):
// a photograph, an intro, Max's sections, the running order and links. Every part is
// optional; a page that does not fit is dropped (the event itself is kept, as today).
const line = (max: number) => z.string().trim().min(1).max(max);
export const eventPageSchema = z.object({
  hero: z.url({ protocol: /^https$/ }).nullish(),
  heroAlt: line(200).nullish(),
  intro: line(600).nullish(),
  sections: z
    .array(z.object({ title: line(80), body: line(4000) }))
    .max(8)
    .nullish(),
  schedule: z
    .array(z.object({ time: line(20), what: line(140) }))
    .max(24)
    .nullish(),
  links: z
    .array(
      z.object({
        label: line(60),
        href: z.url({ protocol: /^https$/ }),
      }),
    )
    .max(6)
    .nullish(),
});
export type EventPage = z.infer<typeof eventPageSchema>;

const eventSchema = z.object({
  id: z.string().min(1),
  date: z
    .string()
    .refine(isIsoDate, "expected YYYY-MM-DD")
    .transform((s) => s as IsoDate),
  title: z.string().min(1),
  kind: z.string().default("OTHER"),
  closed: z.boolean().default(false),
  startTime: time,
  endTime: time,
  description: z
    .string()
    .nullish()
    .transform((s) => s ?? ""),
  // tolerated if present (spec §6.3 request list)
  slug: optionalText,
  imageUrl: z.url().optional(),
  imageAlt: optionalText,
  ticketUrl: z.url().optional(),
  rsvpUrl: z.url().optional(),
  priceLabel: optionalText,
  kitchenCloseOverride: z
    .string()
    .refine(isHHmm)
    .transform((s) => s as HHmm)
    .optional(),
  barCloseOverride: z
    .string()
    .refine(isHHmm)
    .transform((s) => s as HHmm)
    .optional(),
  featured: z.boolean().optional(),
  page: z
    .unknown()
    .transform((raw): EventPage | undefined => {
      if (raw === undefined || raw === null) return undefined;
      const r = eventPageSchema.safeParse(raw);
      if (!r.success) console.warn("events: dropped a malformed event page", r.error.issues[0]?.message);
      return r.success ? r.data : undefined;
    })
    .optional(),
  updatedAt: optionalText,
});

export type FeedEvent = Omit<z.infer<typeof eventSchema>, "kind"> & { kind: EventKind; kindRaw: string };

export interface Feed {
  timezone: "America/New_York";
  events: FeedEvent[];
}

const envelope = z.object({
  timezone: z.literal("America/New_York"),
  events: z.array(z.unknown()),
});

export function parseFeed(json: unknown): Feed {
  const env = envelope.parse(json);
  const events: FeedEvent[] = [];
  for (const raw of env.events) {
    const r = eventSchema.safeParse(raw);
    if (!r.success) {
      console.warn("events: dropped a malformed event", r.error.issues[0]?.message);
      continue;
    }
    const { kind, ...rest } = r.data;
    events.push({ ...rest, kind: toEventKind(kind), kindRaw: kind });
  }
  return { timezone: env.timezone, events };
}
