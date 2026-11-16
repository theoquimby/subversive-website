// Holiday touches (Max, 2026-11-16: "akin to the google home page changing for specific
// holiday periods"). Pure date rules: given New York's date, which holidays are near. A
// theme opens about two and a half weeks before its day and closes the day after it (the
// short ones are noted). All date arithmetic goes through src/lib/time/ny.ts.
import { addDays, diffDays, type IsoDate, WEEKDAYS, weekdayOf } from "@/lib/time/ny";

export const THEME_IDS = [
  "halloween",
  "thanksgiving",
  "hanukkah",
  "christmas",
  "newyear",
  "stpatricks",
  "july4",
  "oktoberfest",
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export function isThemeId(s: string): s is ThemeId {
  return (THEME_IDS as readonly string[]).includes(s);
}

export interface Occasion {
  id: ThemeId;
  /** the holiday itself, first and last day */
  first: IsoDate;
  last: IsoDate;
  /** the window the theme shows in, inclusive */
  from: IsoDate;
  to: IsoDate;
}

/** How early a theme opens: two and a half weeks. */
export const LEAD_DAYS = 17;

/**
 * Hanukkah moves with the Hebrew calendar, so its dates are written down rather than
 * computed: `first` is the day whose evening the first candle is lit, `last` the eighth
 * day. Source: hebcal.com/holidays/chanukah and /holidays/chanukah-2032 (read 2026-11-16).
 * Outside these years Hanukkah simply has no theme; extend the table before 2032 ends.
 */
export const HANUKKAH: Readonly<Record<number, readonly [string, string]>> = {
  2026: ["2026-12-04", "2026-12-12"],
  2027: ["2027-12-24", "2028-01-01"],
  2028: ["2028-12-12", "2028-12-20"],
  2029: ["2029-12-01", "2029-12-09"],
  2030: ["2030-12-20", "2030-12-28"],
  2031: ["2031-12-09", "2031-12-17"],
  2032: ["2032-11-27", "2032-12-05"],
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}` as IsoDate;
const yearOf = (date: IsoDate) => Number(date.slice(0, 4));

/** The day-of-month of the nth given weekday (1-based n) in a month. */
function nthWeekday(year: number, month: number, weekday: (typeof WEEKDAYS)[number], n: number): IsoDate {
  const firstWd = WEEKDAYS.indexOf(weekdayOf(ymd(year, month, 1)));
  const offset = (WEEKDAYS.indexOf(weekday) - firstWd + 7) % 7;
  return ymd(year, month, 1 + offset + 7 * (n - 1));
}

/** Thanksgiving: the fourth Thursday of November. */
export function thanksgiving(year: number): IsoDate {
  return nthWeekday(year, 11, "thu", 4);
}

/**
 * The Munich Oktoberfest: from the first Saturday after 15 September to the first Sunday
 * of October, or to 3 October (German Unity Day) when that Sunday comes earlier.
 */
export function oktoberfest(year: number): { first: IsoDate; last: IsoDate } {
  const sep15 = ymd(year, 9, 15);
  const toSat = (WEEKDAYS.indexOf("sat") - WEEKDAYS.indexOf(weekdayOf(sep15)) + 7) % 7 || 7;
  const firstSunday = nthWeekday(year, 10, "sun", 1);
  const oct3 = ymd(year, 10, 3);
  return { first: addDays(sep15, toSat), last: diffDays(firstSunday, oct3) > 0 ? oct3 : firstSunday };
}

/** Every occasion whose holiday falls in (or, for New Year, starts in) a given year. */
export function occasions(year: number): Occasion[] {
  const day = (id: ThemeId, first: IsoDate, last = first, lead = LEAD_DAYS, after = 1): Occasion => ({
    id,
    first,
    last,
    from: addDays(first, -lead),
    to: addDays(last, after),
  });
  const out: Occasion[] = [
    day("stpatricks", ymd(year, 3, 17)),
    day("july4", ymd(year, 7, 4)),
    // a week before the tapping, through the last day
    (() => {
      const o = oktoberfest(year);
      return day("oktoberfest", o.first, o.last, 7, 0);
    })(),
    day("halloween", ymd(year, 10, 31)),
    day("thanksgiving", thanksgiving(year)),
    // three weeks of Christmas, through Boxing Day
    day("christmas", ymd(year, 12, 25), ymd(year, 12, 25), 21, 1),
    // New Year is short: the days after Christmas's window, through New Year's Day
    day("newyear", ymd(year, 12, 31), ymd(year + 1, 1, 1), 4, 0),
  ];
  const h = HANUKKAH[year];
  if (h) out.push(day("hanukkah", h[0] as IsoDate, h[1] as IsoDate, LEAD_DAYS, 0));
  return out;
}

/** Days from a date to the holiday itself: 0 while it is on, else how far away. */
function distance(date: IsoDate, o: Occasion): number {
  if (diffDays(date, o.first) > 0) return diffDays(date, o.first);
  if (diffDays(o.last, date) > 0) return diffDays(o.last, date);
  return 0;
}

/**
 * The themes showing on a New York date, nearest holiday first (at most two: Hanukkah
 * and Christmas, or Hanukkah and New Year, overlap; their drawings share the page and
 * the logo wears the nearer one's). A tie goes to the single day, which is the day itself.
 */
export function activeThemes(date: IsoDate): ThemeId[] {
  const y = yearOf(date);
  const on = [...occasions(y - 1), ...occasions(y)]
    .filter((o) => diffDays(o.from, date) >= 0 && diffDays(date, o.to) >= 0)
    .map((o) => ({ o, d: distance(date, o), span: diffDays(o.first, o.last) }))
    .sort((a, b) => a.d - b.d || a.span - b.span);
  return on.slice(0, 2).map((x) => x.o.id);
}

export interface SeasonEnv {
  SEASON?: string | undefined;
  SV_E2E?: string | undefined;
}

/**
 * The switch. SEASON=off: never. SEASON=<theme id>: that theme, whatever the date (for
 * previewing). Otherwise by the date, except in an e2e run (SV_E2E=1), whose frozen clock
 * sits inside Thanksgiving's window and would put the theme into every test.
 */
export function seasonFor(date: IsoDate, env: SeasonEnv): ThemeId[] {
  const forced = env.SEASON?.trim().toLowerCase();
  if (forced === "off") return [];
  if (forced && isThemeId(forced)) return [forced];
  if (env.SV_E2E === "1") return [];
  return activeThemes(date);
}
