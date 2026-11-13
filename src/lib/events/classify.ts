// Event categories for the filters and the ticket colours (spec §6.3), and recurring
// series ("+ every other Thursday"), shown only when the dates are in fact regular.
import { diffDays, type Weekday, weekdayOf } from "@/lib/time/ny";
import type { SiteEvent } from "./enrich";
import type { FeedEvent } from "./schema";

export type EventCategory = "games" | "music" | "trivia-movies" | "festivals" | "other" | "notice";

export function classify(e: Pick<FeedEvent, "kind" | "title">): EventCategory {
  switch (e.kind) {
    case "GAME":
      return "games";
    case "MUSIC":
      return "music";
    case "FESTIVAL":
      return "festivals";
    case "HOLIDAY":
    case "CLOSURE":
      return "notice";
    default:
      return /trivia|movie/i.test(e.title) ? "trivia-movies" : "other";
  }
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/(\s+\d+)+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface Series {
  key: string;
  eventIds: string[];
  cadence: "weekly" | "every-other-week" | null;
  weekday: Weekday;
}

export function detectSeries(events: readonly SiteEvent[]): Series[] {
  const groups = new Map<string, SiteEvent[]>();
  for (const e of events) {
    if (e.category === "notice") continue;
    const k = normalizeTitle(e.title);
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }
  const out: Series[] = [];
  for (const [key, list] of groups) {
    if (list.length < 3) continue;
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const gaps = sorted.slice(1).map((e, i) => diffDays((sorted[i] as SiteEvent).date, e.date));
    const cadence = gaps.every((g) => g === 7)
      ? "weekly"
      : gaps.every((g) => g === 14)
        ? "every-other-week"
        : null;
    out.push({
      key,
      eventIds: sorted.map((e) => e.id),
      cadence,
      weekday: weekdayOf((sorted[0] as SiteEvent).date),
    });
  }
  return out;
}

const PLURAL: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function seriesLabel(s: Series): string | null {
  if (s.cadence === "weekly") return `+ every ${PLURAL[s.weekday]}`;
  if (s.cadence === "every-other-week") return `+ every other ${PLURAL[s.weekday]}`;
  return null;
}
