// Until M5 builds lib/events, the hours logic reads content/events.seed.json through this
// minimal typed read (plan M4 item 1). M5 swaps in getEvents() with no change to lib/hours.
import raw from "@content/events.seed.json";
import { z } from "zod";
import { displayTitleOf, toEventKind } from "@/lib/events/kind";
import { type HHmm, type IsoDate, isHHmm, isIsoDate } from "@/lib/time/ny";
import type { HoursEvent } from "./schedule";

const time = z
  .string()
  .refine(isHHmm)
  .transform((s) => s as HHmm)
  .nullable();

const seedSchema = z.object({
  timezone: z.literal("America/New_York"),
  events: z.array(
    z.object({
      id: z.string().min(1),
      date: z
        .string()
        .refine(isIsoDate)
        .transform((s) => s as IsoDate),
      title: z.string().min(1),
      kind: z.string(),
      closed: z.boolean(),
      startTime: time,
      endTime: time,
    }),
  ),
});

let cached: HoursEvent[] | null = null;

export function seedHoursEvents(): HoursEvent[] {
  cached ??= seedSchema.parse(raw).events.map((e) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    displayTitle: displayTitleOf(e.title),
    kind: toEventKind(e.kind),
    closed: e.closed,
    startTime: e.startTime,
    endTime: e.endTime,
  }));
  return cached;
}
