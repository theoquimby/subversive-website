// Open-now status (spec §4.2, plan §5.3 and Q12). Pure: the instant is passed in. Order:
// a night that started yesterday and runs past midnight; then today's special closure →
// kitchen closed, bar open → open late (a game night, from opening until the kitchen
// closes) → open → opens later today → closed for the day → the weekly closed day.
import type { Site } from "@/lib/site/schema";
import { addDays, type HHmm, type Minutes, nyParts, type Weekday } from "@/lib/time/ny";
import {
  type DaySchedule,
  type HoursEvent,
  lateLabel,
  type NextOpening,
  nextOpening,
  scheduleFor,
} from "./schedule";

export type OpenStatus =
  | { kind: "open"; closes: Minutes; kitchenCloses: Minutes | null }
  | { kind: "open-late"; closes: Minutes; kitchenCloses: Minutes | null; label: string; starts: HHmm }
  | { kind: "kitchen-closed"; closes: Minutes }
  | { kind: "opens-later"; opens: Minutes }
  | { kind: "closed-for-day"; next: NextOpening | null }
  | { kind: "closed-weekday"; weekday: Weekday; next: NextOpening | null }
  | { kind: "closed-special"; title: string; next: NextOpening | null };

function running(s: DaySchedule, m: Minutes): OpenStatus | null {
  if (s.closed || s.open === null || s.close === null || s.kitchenClose === null) return null;
  if (m < s.open || m >= s.close) return null;
  if (m >= s.kitchenClose) return { kind: "kitchen-closed", closes: s.close };
  const kitchenCloses = s.kitchenClose < s.close ? s.kitchenClose : null;
  const r = s.reason;
  if (r?.type === "late" && r.kind === "GAME" && r.startTime) {
    return { kind: "open-late", closes: s.close, kitchenCloses, label: lateLabel(r), starts: r.startTime };
  }
  return { kind: "open", closes: s.close, kitchenCloses };
}

export function statusAt(
  instant: Date,
  site: Pick<Site, "hours">,
  events: readonly HoursEvent[],
): OpenStatus {
  const now = nyParts(instant);

  // still yesterday's night? (an event that ends after midnight)
  const yesterday = scheduleFor(addDays(now.date, -1), site, events);
  if (yesterday.close !== null && yesterday.close > 1440) {
    const still = running(yesterday, now.minutes + 1440);
    if (still) return still;
  }

  const today = scheduleFor(now.date, site, events);
  const next = () => nextOpening(instant, site, events);
  if (today.reason?.type === "closure")
    return { kind: "closed-special", title: today.reason.title, next: next() };
  if (today.reason?.type === "weekly")
    return { kind: "closed-weekday", weekday: today.weekday, next: next() };

  const live = running(today, now.minutes);
  if (live) return live;
  if (today.open !== null && now.minutes < today.open) return { kind: "opens-later", opens: today.open };
  return { kind: "closed-for-day", next: next() };
}
