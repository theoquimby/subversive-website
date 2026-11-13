// The only file that touches Intl time zones (spec §8.5, plan §5.1).

export const NY_TZ = "America/New_York";

export type IsoDate = string & { __brand: "IsoDate" };
export type HHmm = string & { __brand: "HHmm" };
/** Minutes after 00:00 New York wall time on a given date; may exceed 1440. */
export type Minutes = number;
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEKDAYS: readonly Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export interface NyParts {
  date: IsoDate;
  weekday: Weekday;
  minutes: Minutes;
  offsetMinutes: -300 | -240;
}

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isIsoDate(s: string): s is IsoDate {
  const m = ISO_DATE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === mo - 1 && probe.getUTCDate() === d;
}

export function isHHmm(s: string): s is HHmm {
  return HH_MM.test(s);
}

function dateToUtcMs(date: IsoDate): number {
  const m = ISO_DATE.exec(date);
  if (!m) throw new Error(`Not an ISO date: ${date}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function utcMsToDate(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10) as IsoDate;
}

const pad = (n: number) => String(n).padStart(2, "0");

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: NY_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function nyParts(instant: Date): NyParts {
  const parts: Record<string, string> = {};
  for (const p of formatter.formatToParts(instant)) parts[p.type] = p.value;
  const date = `${parts.year}-${parts.month}-${parts.day}` as IsoDate;
  const hour = Number(parts.hour);
  const minute = Number(parts.minute);
  const second = Number(parts.second);
  const wallMs = dateToUtcMs(date) + ((hour * 60 + minute) * 60 + second) * 1000;
  const instantMs = Math.floor(instant.getTime() / 1000) * 1000;
  const offset = Math.round((wallMs - instantMs) / 60_000);
  if (offset !== -300 && offset !== -240) {
    throw new Error(`Unexpected New York offset ${offset} at ${instant.toISOString()}`);
  }
  return { date, weekday: weekdayOf(date), minutes: hour * 60 + minute, offsetMinutes: offset };
}

export function weekdayOf(date: IsoDate): Weekday {
  // 1970-01-01 was a Thursday (index 3 in a Monday-first week).
  const days = Math.round(dateToUtcMs(date) / DAY_MS);
  const index = (((days + 3) % 7) + 7) % 7;
  return WEEKDAYS[index] as Weekday;
}

export function addDays(date: IsoDate, n: number): IsoDate {
  return utcMsToDate(dateToUtcMs(date) + n * DAY_MS);
}

/** b − a, in whole days. */
export function diffDays(a: IsoDate, b: IsoDate): number {
  return Math.round((dateToUtcMs(b) - dateToUtcMs(a)) / DAY_MS);
}

export function toMinutes(t: HHmm): Minutes {
  const m = HH_MM.exec(t);
  if (!m) throw new Error(`Not an HH:mm time: ${t}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

export function fromMinutes(m: Minutes): HHmm {
  const wrapped = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}` as HHmm;
}

/**
 * New York wall time to an instant. Minutes ≥ 1440 roll onto the following dates.
 * A wall time that does not exist (spring forward) resolves one hour later;
 * a wall time that occurs twice (fall back) resolves to the first occurrence.
 */
export function nyInstant(date: IsoDate, at: Minutes): Date {
  const rollDays = Math.floor(at / 1440);
  const day = addDays(date, rollDays);
  const wall = at - rollDays * 1440;
  const wallMs = dateToUtcMs(day) + wall * 60_000;

  const matches = ([-240, -300] as const)
    .map((offset) => wallMs - offset * 60_000)
    .filter((ms) => {
      const p = nyParts(new Date(ms));
      return p.date === day && p.minutes === wall;
    })
    .sort((a, b) => a - b);

  const first = matches[0];
  if (first !== undefined) return new Date(first);
  // In the spring-forward gap: read the wall time with the standard (pre-change) offset.
  return new Date(wallMs + 300 * 60_000);
}

/**
 * The same weekday as nyParts(new Date()).weekday, as a JavaScript expression for inline
 * scripts that run before React (the menu's today box). Kept here so every time-zone
 * rule lives in this one file.
 */
export const NY_WEEKDAY_JS = `new Intl.DateTimeFormat("en-US",{timeZone:"${NY_TZ}",weekday:"short"}).format(new Date()).slice(0,3).toLowerCase()`;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** "2026-10-23" → "October 23" (a calendar date; no time zone involved). */
export function formatMonthDay(date: IsoDate): string {
  const m = ISO_DATE.exec(date);
  if (!m) throw new Error(`Not an ISO date: ${date}`);
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
}

export function isoWithOffset(date: IsoDate, at: Minutes): string {
  const instant = nyInstant(date, at);
  const p = nyParts(instant);
  const sign = p.offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(p.offsetMinutes);
  return `${p.date}T${fromMinutes(p.minutes)}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}
