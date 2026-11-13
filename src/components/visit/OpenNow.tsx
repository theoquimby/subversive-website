// Open-now pill (spec §4.2): the most useful element on the site. The server renders the
// status at revalidation time; OpenNowLive takes over in the browser. Only the next 15
// days of events cross to the client, and only the fields the hours logic reads.
import { formatStatus } from "@/lib/hours/format";
import type { HoursEvent } from "@/lib/hours/schedule";
import { seedHoursEvents } from "@/lib/hours/seed-events";
import { statusAt } from "@/lib/hours/status";
import { getSite } from "@/lib/site/site";
import { now } from "@/lib/time/now";
import { addDays, nyParts } from "@/lib/time/ny";
import { OpenNowLive } from "./OpenNowLive";

export function hoursEvents(): HoursEvent[] {
  const today = nyParts(now()).date;
  const until = addDays(today, 15);
  const from = addDays(today, -1); // a night that began yesterday can still be running
  return seedHoursEvents().filter((e) => e.date >= from && e.date <= until);
}

export function OpenNow({ className }: { className?: string }) {
  const { hours } = getSite();
  const events = hoursEvents();
  const initial = formatStatus(statusAt(now(), { hours }, events));
  return <OpenNowLive initial={initial} hours={hours} events={events} className={className} />;
}
