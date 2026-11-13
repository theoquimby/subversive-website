// The events timeline (spec §6.3): grouped by month under a sticky month label; tickets
// one column on a phone, two on a tablet, three on desktop. Closures and holidays are slim
// notice rows, not tickets. A regular series shows its next date with "+ every …".
import { eventLabels } from "@content/microcopy";
import { detectSeries, seriesLabel } from "@/lib/events/classify";
import type { SiteEvent } from "@/lib/events/enrich";
import { formatDateShort } from "@/lib/hours/format";
import { dateParts, EventTicket } from "./EventTicket";

export function EventList({ events, today }: { events: SiteEvent[]; today: string }) {
  // a regular series lists only its next date, labelled
  const helper = new Map<string, string>();
  const hide = new Set<string>();
  for (const s of detectSeries(events)) {
    const label = seriesLabel(s);
    if (!label) continue;
    const [first, ...rest] = s.eventIds;
    if (first) helper.set(first, label);
    for (const id of rest) hide.add(id);
  }

  const months = new Map<string, SiteEvent[]>();
  for (const e of events) {
    if (hide.has(e.id)) continue;
    const key = e.date.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), e]);
  }

  return (
    <div className="event-list" data-event-list="">
      {[...months].map(([key, list]) => {
        const first = list[0] as SiteEvent;
        const { monthLong } = dateParts(first.date);
        return (
          <section key={key} className="event-month" data-month={key} aria-labelledby={`m-${key}`}>
            <h2 id={`m-${key}`} className="event-month__label">
              {monthLong}
            </h2>
            <ul className="event-grid">
              {list.map((e) =>
                e.category === "notice" ? (
                  <li key={e.id} className="notice-row" data-category="notice">
                    {eventLabels.closedOn(formatDateShort(e.date), e.displayTitle)}
                  </li>
                ) : (
                  <li key={e.id} data-category={e.category}>
                    <EventTicket event={e} tonight={e.date === today} series={helper.get(e.id)} />
                  </li>
                ),
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
