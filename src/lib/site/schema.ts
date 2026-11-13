// content/site.json is external data: validate it at the boundary (plan §5.2, CLAUDE.md).
// Unknown keys are stripped, so _meta, _archived and _note never reach a page.
import { z } from "zod";
import { type HHmm, isHHmm, type Weekday } from "@/lib/time/ny";

const hhmm = z
  .string()
  .refine(isHHmm, "expected HH:mm (24 h)")
  .transform((s) => s as HHmm);

const dayHours = z.object({ open: hhmm, close: hhmm, kitchenClose: hhmm }).nullable();

const weekly = z.object({
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
  sourcing: z.array(z.object({ what: z.string(), who: z.string(), where: z.string() })),
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
