// Add to calendar (spec §6.3): an .ics file for Apple and Outlook, a URL for Google.
// RFC 5545: CRLF line ends, lines folded at 75 octets, text escaped, times in New York
// with the zone spelled out (VTIMEZONE), so the event lands right in any calendar.
import type { Site } from "@/lib/site/schema";
import { addDays, type IsoDate, toMinutes } from "@/lib/time/ny";
import type { SiteEvent } from "./enrich";

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:America/New_York",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0400",
  "TZNAME:EDT",
  "DTSTART:19700308T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0400",
  "TZOFFSETTO:-0500",
  "TZNAME:EST",
  "DTSTART:19701101T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold a content line at 75 octets (UTF-8), continuation lines starting with a space. */
export function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + n > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

const compactDate = (d: IsoDate) => d.replace(/-/g, "");
const pad = (n: number) => String(n).padStart(2, "0");

function local(date: IsoDate, minutes: number): string {
  const roll = Math.floor(minutes / 1440);
  const m = minutes - roll * 1440;
  return `${compactDate(addDays(date, roll))}T${pad(Math.floor(m / 60))}${pad(m % 60)}00`;
}

function utcStamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function where(site: Site): string {
  return `${site.name}, ${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`;
}

export function buildIcs(e: SiteEvent, site: Site, siteUrl: string, stamp: Date = new Date()): string {
  const url = `${siteUrl.replace(/\/$/, "")}/events/${e.slug}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Subversive//Events//EN",
    "CALSCALE:GREGORIAN",
    ...VTIMEZONE,
  ];
  lines.push("BEGIN:VEVENT", `UID:${e.id}@drinksubversive.com`, `DTSTAMP:${utcStamp(stamp.toISOString())}`);
  if (e.startTime) {
    const start = toMinutes(e.startTime);
    let end = e.endTime ? toMinutes(e.endTime) : start + 120;
    if (end <= start) end += 1440;
    lines.push(`DTSTART;TZID=America/New_York:${local(e.date, start)}`);
    lines.push(`DTEND;TZID=America/New_York:${local(e.date, end)}`);
  } else {
    lines.push(
      `DTSTART;VALUE=DATE:${compactDate(e.date)}`,
      `DTEND;VALUE=DATE:${compactDate(addDays(e.date, 1))}`,
    );
  }
  lines.push(`SUMMARY:${escapeText(e.displayTitle)}`, `LOCATION:${escapeText(where(site))}`, `URL:${url}`);
  if (e.description) lines.push(`DESCRIPTION:${escapeText(e.description)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

export function googleCalendarUrl(e: SiteEvent, site: Site): string {
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.displayTitle, location: where(site) });
  if (e.startsAt) {
    const end = e.endsAt ?? new Date(new Date(e.startsAt).getTime() + 2 * 3600_000).toISOString();
    q.set("dates", `${utcStamp(e.startsAt)}/${utcStamp(end)}`);
  } else {
    q.set("dates", `${compactDate(e.date)}/${compactDate(addDays(e.date, 1))}`);
  }
  if (e.description) q.set("details", e.description);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
