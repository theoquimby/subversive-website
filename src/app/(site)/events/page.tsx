// /events (redesign 2026-11-15): the night page; the lights dim on the way in (Curtain).
// Calm: "What's on" beside a ticket drawn in pen, tonight's ticket large if there is one,
// then the months, each a short run of tickets under its name on the line. No photograph,
// ticker, scoreboard, starburst or filters. Events come read-only from the Ops feed.
import { eventLabels, inquiryLabels, visitLabels } from "@content/microcopy";
import type { Metadata, Viewport } from "next";
import { Lights } from "@/components/events/Lights";
import { TicketLink } from "@/components/events/TicketLink";
import { Doodle } from "@/components/graphics/Doodle";
import { Drawing } from "@/components/home/Ways";
import { PageWipe } from "@/components/layout/PageWipe";
import { SectionHead } from "@/components/layout/SectionHead";
import { ExternalLink, TextLink } from "@/components/ui/TextLink";
import type { SiteEvent } from "@/lib/events/enrich";
import { getEvents, tickets, upcoming } from "@/lib/events/source";
import { getSite } from "@/lib/site/site";
import { now } from "@/lib/time/now";
import { nyParts } from "@/lib/time/ny";
import { raw } from "@/styles/tokens";

export const revalidate = 300;
// the phone's status bar and toolbar take the night skin on these pages
export const viewport: Viewport = { themeColor: raw.night };
export const metadata: Metadata = {
  title: "Events · Subversive, Catskill NY",
  description:
    "Knicks nights, trivia, music and what's next at Subversive, 96 West Bridge Street, Catskill NY.",
};

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
];

function byMonth(events: SiteEvent[]) {
  const groups: { key: string; name: string; events: SiteEvent[] }[] = [];
  for (const e of events) {
    const key = e.date.slice(0, 7);
    const g = groups.at(-1);
    if (g && g.key === key) g.events.push(e);
    else groups.push({ key, name: MONTHS[Number(key.slice(5)) - 1] ?? key, events: [e] });
  }
  return groups;
}

export default async function EventsPage() {
  const site = getSite();
  const today = nyParts(now()).date;
  const { events } = await getEvents();
  const coming = tickets(upcoming(events, today));
  const tonight = coming.filter((e) => e.date === today);
  const later = coming.filter((e) => e.date !== today);

  return (
    <PageWipe>
      <div className="events-page" data-page-skin="overtime">
        <Lights />
        <div className="page events-body">
          <header className="events-head">
            <h1 className="page__title">{eventLabels.title}</h1>
            <Drawing name="events" className="events-head__art" />
          </header>

          {tonight.length > 0 ? (
            <ul className="tix tix--tonight" data-tonight="">
              {tonight.map((e) => (
                <li key={e.id}>
                  <TicketLink event={e} tonight />
                </li>
              ))}
            </ul>
          ) : null}

          {byMonth(later).map((g, gi) => (
            <section key={g.key} className="events-month" aria-labelledby={`m-${g.key}`}>
              <SectionHead id={`m-${g.key}`}>{g.name}</SectionHead>
              <ul className="tix">
                {g.events.map((e, i) => (
                  <li key={e.id}>
                    <TicketLink event={e} lit={tonight.length === 0 && gi === 0 && i === 0} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {coming.length === 0 ? (
            <p className="events-empty">
              {eventLabels.empty}{" "}
              <a className="text-link" href={site.links.instagram} target="_blank" rel="noopener">
                Instagram
              </a>
            </p>
          ) : null}

          <Doodle name="night" className="events-scene" />
          <div className="events-close">
            <p className="events-private">
              <TextLink href="/private-events">{inquiryLabels.link}</TextLink>
            </p>
            <p className="events-bands">
              {site.bands}{" "}
              <ExternalLink href={site.links.bandBookingForm}>{visitLabels.bookYourBand}</ExternalLink>
            </p>
          </div>
        </div>
      </div>
    </PageWipe>
  );
}
