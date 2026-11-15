// content/site.json is external data: validate it at the boundary (plan §5.2, CLAUDE.md).
// Unknown keys are stripped, so _meta, _archived and _note never reach a page.
import { z } from "zod";
import { type HHmm, isHHmm, type Weekday } from "@/lib/time/ny";

const hhmm = z
  .string()
  .refine(isHHmm, "expected HH:mm (24 h)")
  .transform((s) => s as HHmm);

const dayHours = z.object({ open: hhmm, close: hhmm, kitchenClose: hhmm }).nullable();

export const weekly = z.object({
  mon: dayHours,
  tue: dayHours,
  wed: dayHours,
  thu: dayHours,
  fri: dayHours,
  sat: dayHours,
  sun: dayHours,
});

const url = z.url();

export const siteSchema = z.object({
  name: z.string().min(1),
  legalOrLongName: z.string().min(1),
  descriptor: z.string().min(1),
  timezone: z.literal("America/New_York"),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    geo: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  }),
  phone: z.object({ display: z.string(), tel: z.string().regex(/^\+1\d{10}$/), note: z.string() }),
  email: z.email(),
  links: z.object({
    order: url,
    eGiftCard: url,
    map: url,
    instagram: url,
    facebook: url,
    bandBookingForm: url,
  }),
  hours: weekly,
  visit: z.object({
    seating: z.string(),
    tent: z.string(),
    parking: z.string(),
    dogs: z.string(),
    giftCards: z.string(),
  }),
  sourcingLine: z.string(),
  // geo: where the supplier is. With it the map puts a town there and draws the road to
  // the taproom; without it the source counts as statewide and lights the whole state.
  sourcing: z.array(
    z.object({
      what: z.string(),
      who: z.string(),
      where: z.string(),
      geo: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
      // the detail view, all optional: a photo (an id in content/photos.ts), a few
      // sentences in the brewery's words, the supplier's own site
      photo: z.string().optional(),
      about: z.string().optional(),
      url: z.url().optional(),
    }),
  ),
  about: z.object({ founders: z.array(z.string()), paragraphs: z.array(z.string()) }),
  brewery: z.object({ paragraphs: z.array(z.string()) }),
  bands: z.string(),
  privacy: z.array(z.string()).optional(),
});

export type Site = z.infer<typeof siteSchema>;
export type DayHours = NonNullable<Site["hours"][Weekday]>;

export function parseSite(json: unknown): Site {
  return siteSchema.parse(json);
}
