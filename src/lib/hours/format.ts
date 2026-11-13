// Hours copy (spec §4.2, plan §5.3, Q11). Opening hours drop ":00" ("til 8", "at 12");
// event starts keep it ("7:00"). "AM" is added only before noon; nothing prints "PM".
import { type HHmm, type IsoDate, type Minutes, toMinutes, type Weekday, weekdayOf } from "@/lib/time/ny";
import type { OpenStatus } from "./status";

const LONG: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const mins = (t: HHmm | Minutes) => (typeof t === "number" ? t : toMinutes(t));

function parts(t: HHmm | Minutes) {
  const m = ((mins(t) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h, min, am: h24 < 12 };
}

export function formatTime(t: HHmm | Minutes): string {
  const { h, min, am } = parts(t);
  const base = min === 0 ? String(h) : `${h}:${String(min).padStart(2, "0")}`;
  return am ? `${base} AM` : base;
}

export function formatClock(t: HHmm | Minutes): string {
  const { h, min, am } = parts(t);
  const base = `${h}:${String(min).padStart(2, "0")}`;
  return am ? `${base} AM` : base;
}

export function formatRange(open: Minutes, close: Minutes): string {
  return `${formatTime(open)}–${formatTime(close)}`;
}

export function weekdayLabel(w: Weekday, form: "short" | "long" | "plural"): string {
  const long = LONG[w];
  if (form === "long") return long;
  if (form === "plural") return `${long}s`;
  return long.slice(0, 3);
}

export function formatDateShort(d: IsoDate): string {
  const [, m, day] = d.split("-");
  return `${weekdayLabel(weekdayOf(d), "short")} ${MONTHS[Number(m) - 1]} ${Number(day)}`;
}

export interface StatusLine {
  dot: "go" | "hollow" | "amber";
  text: string;
  muted?: string;
}

export function formatStatus(s: OpenStatus): StatusLine {
  switch (s.kind) {
    case "open":
      return {
        dot: "go",
        text: `Open now · til ${formatTime(s.closes)}`,
        ...(s.kitchenCloses !== null ? { muted: `· kitchen til ${formatTime(s.kitchenCloses)}` } : {}),
      };
    case "open-late":
      return { dot: "go", text: `Open late tonight · ${s.label} at ${formatClock(s.starts)}` };
    case "kitchen-closed":
      return { dot: "amber", text: `Bar open til ${formatTime(s.closes)} · kitchen closed` };
    case "opens-later":
      return { dot: "hollow", text: `Opens today at ${formatTime(s.opens)}` };
    case "closed-for-day":
      return {
        dot: "hollow",
        text: s.next
          ? `Closed now · opens ${weekdayLabel(s.next.weekday, "short")} at ${formatTime(s.next.open)}`
          : "Closed now",
      };
    case "closed-weekday":
      return {
        dot: "hollow",
        text: s.next
          ? `Closed ${weekdayLabel(s.weekday, "plural")} · back ${weekdayLabel(s.next.weekday, "short")} at ${formatTime(s.next.open)}`
          : `Closed ${weekdayLabel(s.weekday, "plural")}`,
      };
    case "closed-special":
      return { dot: "hollow", text: `Closed today · ${s.title}` };
  }
}
