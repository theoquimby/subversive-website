// Where events come from (spec §8.6, plan §5.4). The Ops feed first; on any failure (a
// login redirect, HTML, a 500, a bad body, no network) the seed, from today on. The fetch
// and the parse are cached together, so a redirect is never cached as a good answer.
// getEvents never throws: the page never shows an error for this.
import { unstable_cache } from "next/cache";
import { now } from "@/lib/time/now";
import { type IsoDate, nyParts } from "@/lib/time/ny";
import { byDateThenTime, enrich, type SiteEvent } from "./enrich";
import { opsEventsSource } from "./ops";
import type { Feed } from "./schema";
import { seedEventsSource } from "./seed";

export interface EventsSource {
  fetch(): Promise<Feed>;
}
export type EventsOrigin = "ops" | "seed";
export interface EventsResult {
  events: SiteEvent[];
  origin: EventsOrigin;
}

const cachedOps = unstable_cache(() => opsEventsSource.fetch(), ["ops-events"], {
  revalidate: 300,
  tags: ["events"],
});

// TEMPORARY (Theo, 2026-11-13): the Ops feed is public but empty until Max enters events
// there, so a working feed with nothing upcoming also falls back to the seed. Set this to
// false (and drop its test) once Ops holds the calendar; then an empty feed is the truth.
const EMPTY_FEED_USES_SEED = true;

export async function getEvents(): Promise<EventsResult> {
  const today = nyParts(now()).date;
  try {
    const feed = await cachedOps();
    const events = feed.events.map(enrich).sort(byDateThenTime);
    if (!(EMPTY_FEED_USES_SEED && upcoming(events, today).length === 0)) return { events, origin: "ops" };
  } catch {
    // any failure: the seed below
  }
  const feed = await seedEventsSource.fetch();
  return { events: upcoming(feed.events.map(enrich), today).sort(byDateThenTime), origin: "seed" };
}

export function upcoming(events: readonly SiteEvent[], today: IsoDate): SiteEvent[] {
  return events.filter((e) => e.date >= today);
}

export function tickets(events: readonly SiteEvent[]): SiteEvent[] {
  return events.filter((e) => e.category !== "notice");
}
