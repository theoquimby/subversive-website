// A day's hours (spec §8.5, plan §5.3). Pure: dates in, schedule out. Rules:
//   1. site.hours[weekday]; null → closed, weekly.
//   2. Any event that date with closed: true → closed, closure. This beats everything.
//   3. Otherwise the non-closure event with the latest end; an end before its start runs
//      past midnight (+1440). If it ends after closing, closing moves to it ("late").
//      Opening and kitchen close never move; a weekly-closed day stays closed.
import type { EventKind } from "@/lib/events/kind";
import type { Site } from "@/lib/site/schema";
import {
  addDays,
  type HHmm,
  type IsoDate,
  type Minutes,
  nyParts,
  toMinutes,
  type Weekday,
  weekdayOf,
} from "@/lib/time/ny";
import { formatDateShort } from "./format";

/** The slice of an event the hours logic needs; the M5 SiteEvent satisfies it. */
export interface HoursEvent {
  id: string;
  date: IsoDate;
  title: string;
  displayTitle: string;
  kind: EventKind;
  closed: boolean;
  startTime: HHmm | null;
  endTime: HHmm | null;
}

export type ScheduleReason =
  | { type: "weekly" }
  | { type: "closure"; title: string }
  | { type: "late"; title: string; eventId: string; kind: EventKind; startTime: HHmm | null };

export interface DaySchedule {
  date: IsoDate;
  weekday: Weekday;
  closed: boolean;
  open: Minutes | null;
  close: Minutes | null;
  kitchenClose: Minutes | null;
  reason?: ScheduleReason;
}

type Hours = Pick<Site, "hours">;

function endOf(e: HoursEvent): Minutes | null {
  if (!e.endTime) return null;
  const end = toMinutes(e.endTime);
  return e.startTime && end < toMinutes(e.startTime) ? end + 1440 : end;
}

export function scheduleFor(date: IsoDate, site: Hours, events: readonly HoursEvent[]): DaySchedule {
  const weekday = weekdayOf(date);
  const shut = { date, weekday, closed: true, open: null, close: null, kitchenClose: null };
  const today = events.filter((e) => e.date === date);

  const closure = today.find((e) => e.closed);
  if (closure) return { ...shut, reason: { type: "closure", title: closure.displayTitle } };

  const hours = site.hours[weekday];
  if (!hours) return { ...shut, reason: { type: "weekly" } };

  const open = toMinutes(hours.open);
  let close = toMinutes(hours.close);
  const kitchenClose = toMinutes(hours.kitchenClose);

  let latest: { e: HoursEvent; end: Minutes } | null = null;
  for (const e of today) {
    const end = endOf(e);
    if (end !== null && (!latest || end > latest.end)) latest = { e, end };
  }
  if (latest && latest.end > close) {
    close = latest.end;
    const { e } = latest;
    return {
      date,
      weekday,
      closed: false,
      open,
      close,
      kitchenClose,
      reason: { type: "late", title: e.displayTitle, eventId: e.id, kind: e.kind, startTime: e.startTime },
    };
  }
  return { date, weekday, closed: false, open, close, kitchenClose };
}

/** Who the late night is for: a game's first word ("Knicks"), else the event's title. */
export function lateLabel(r: Extract<ScheduleReason, { type: "late" }>): string {
  return r.kind === "GAME" ? (r.title.split(/\s+/)[0] ?? r.title) : r.title;
}

export interface SpecialRow {
  date: IsoDate;
  /** "Wed Nov 25" */
  day: string;
  /** "open late for Knicks" · "closed for Thanksgiving" */
  label: string;
  schedule: DaySchedule;
}

export function specialHours(
  from: IsoDate,
  days: number,
  site: Hours,
  events: readonly HoursEvent[],
): SpecialRow[] {
  const rows: SpecialRow[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    const s = scheduleFor(date, site, events);
    const r = s.reason;
    if (r?.type === "late")
      rows.push({ date, day: formatDateShort(date), label: `open late for ${lateLabel(r)}`, schedule: s });
    else if (r?.type === "closure")
      rows.push({ date, day: formatDateShort(date), label: `closed for ${r.title}`, schedule: s });
  }
  return rows;
}

export interface NextOpening {
  date: IsoDate;
  weekday: Weekday;
  open: Minutes;
}

/** The first opening after `after` (today counts if it has not opened yet), up to 14 days on. */
export function nextOpening(
  instant: Date,
  site: Hours,
  events: readonly HoursEvent[],
  maxDays = 14,
): NextOpening | null {
  const after = nyParts(instant);
  for (let i = 0; i <= maxDays; i++) {
    const date = addDays(after.date, i);
    const s = scheduleFor(date, site, events);
    if (s.closed || s.open === null) continue;
    if (i === 0 && after.minutes >= s.open) continue;
    return { date, weekday: s.weekday, open: s.open };
  }
  return null;
}
