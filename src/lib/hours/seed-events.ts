// The seed as hours events, through the same parse and enrich as the live feed. Used by
// tests; the site reads getEvents() (lib/events/source), which falls back to this seed.
import raw from "@content/events.seed.json";
import { enrich } from "@/lib/events/enrich";
import { parseFeed } from "@/lib/events/schema";
import type { HoursEvent } from "./schedule";

export function seedHoursEvents(): HoursEvent[] {
  return parseFeed(raw).events.map(enrich);
}
