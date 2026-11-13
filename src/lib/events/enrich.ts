// A feed event plus everything the site derives from it (plan §5.4).
import { isoWithOffset, toMinutes } from "@/lib/time/ny";
import { classify, type EventCategory } from "./classify";
import { displayTitleOf } from "./kind";
import { type Matchup, parseMatchup } from "./matchup";
import type { FeedEvent } from "./schema";
import { eventSlug } from "./slug";

export interface SiteEvent extends FeedEvent {
  category: EventCategory;
  slug: string;
  matchup: Matchup | null;
  /** matchup?.label ?? the title without the "Subversive Overtime:" prefix */
  displayTitle: string;
  startsAt: string | null;
  endsAt: string | null;
}

export function enrich(e: FeedEvent): SiteEvent {
  const matchup = e.kind === "GAME" ? parseMatchup(e.title) : null;
  const start = e.startTime ? toMinutes(e.startTime) : null;
  let end = e.endTime ? toMinutes(e.endTime) : null;
  if (start !== null && end !== null && end < start) end += 1440;
  return {
    ...e,
    category: classify(e),
    slug: eventSlug(e),
    matchup,
    displayTitle: matchup?.label ?? displayTitleOf(e.title),
    startsAt: start === null ? null : isoWithOffset(e.date, start),
    endsAt: end === null ? null : isoWithOffset(e.date, end),
  };
}

export function byDateThenTime(a: SiteEvent, b: SiteEvent): number {
  return a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? "");
}
