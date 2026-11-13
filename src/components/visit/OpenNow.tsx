// Open-now pill (spec §4.2): the most useful element on the site. The server renders the
// status at revalidation time; OpenNowLive takes over in the browser. Only the next 15
// days of events cross to the client, and only the fields the hours logic reads.

import { getEvents } from "@/lib/events/source";
import { formatStatus } from "@/lib/hours/format";
import type { HoursEvent } from "@/lib/hours/schedule";
import { statusAt } from "@/lib/hours/status";
import { getSite } from "@/lib/site/site";
import { now } from "@/lib/time/now";
import { addDays, nyParts } from "@/lib/time/ny";
import { OpenNowLive } from "./OpenNowLive";

/** The next 15 days of events, cut to the fields the hours logic reads (they cross to the client). */
export async function hoursEvents(): Promise<HoursEvent[]> {
  const today = nyParts(now()).date;
  const until = addDays(today, 15);
  const from = addDays(today, -1); // a night that began yesterday can still be running
  const { events } = await getEvents();
  return events
    .filter((e) => e.date >= from && e.date <= until)
    .map(({ id, date, title, displayTitle, kind, closed, startTime, endTime }) => ({
      id,
      date,
      title,
      displayTitle,
      kind,
      closed,
      startTime,
      endTime,
    }));
}

export async function OpenNow({ className }: { className?: string }) {
  const { hours } = getSite();
  const events = await hoursEvents();
  const initial = formatStatus(statusAt(now(), { hours }, events));
  return <OpenNowLive initial={initial} hours={hours} events={events} className={className} />;
}
