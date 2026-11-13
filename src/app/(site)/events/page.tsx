// /events (spec §6.3): the night skin. The firepit photo at 40svh with "What's on" over
// its scrim, the ticker, filters, today pinned large with its countdown, the month
// timeline, and the band booking band. Seed until O1 is fixed; no code change after.
import { eventLabels, visitLabels } from "@content/microcopy";
import type { Metadata, Viewport } from "next";
import { Countdown } from "@/components/events/Countdown";
import { EventFilters, type FilterKey } from "@/components/events/EventFilters";
import { EventList } from "@/components/events/EventList";
import { EventTicket } from "@/components/events/EventTicket";
import { Matchup } from "@/components/events/Matchup";
import { Ticker } from "@/components/events/Ticker";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { Ticket } from "@/components/graphics/Ticket";
import { PageWipe } from "@/components/layout/PageWipe";
import { Button } from "@/components/ui/Button";
import { getEvents, tickets, upcoming } from "@/lib/events/source";
import { formatDateShort } from "@/lib/hours/format";
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

export default async function EventsPage() {
  const site = getSite();
  const today = nyParts(now()).date;
  const { events } = await getEvents();
  const coming = upcoming(events, today);
  const pinned = tickets(coming).filter((e) => e.date === today);
  const list = coming.filter((e) => !pinned.includes(e));
  const present = [...new Set(tickets(list).map((e) => e.category))].filter(
    (c) => c !== "other" && c !== "notice",
  ) as FilterKey[];
  const ticker = tickets(coming)
    .slice(0, 3)
    .map((e) => ({ href: `/events/${e.slug}`, label: `${formatDateShort(e.date)} · ${e.displayTitle}` }));

  return (
    <PageWipe>
      <div className="events-page" data-page-skin="overtime">
        <header className="events-hero">
          <PhotoFrame id="firepit-beers" bleed priority sizes="100vw" className="events-hero__photo" />
          <h1 className="page__title events-hero__title">{eventLabels.title}</h1>
        </header>
        <Ticker items={ticker} label={eventLabels.ticker} />

        <div className="page events-body">
          {pinned.length > 0 ? (
            <div className="events-today">
              {pinned.map((e) => (
                <div key={e.id} className="events-today__item">
                  <EventTicket event={e} tonight size="pinned" />
                  {e.matchup ? (
                    <div className="events-today__game">
                      <Matchup event={e} size="pinned" />
                      <Countdown event={e} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {tickets(list).length > 0 ? (
            <>
              <EventFilters present={present} />
              <EventList events={list} today={today} />
            </>
          ) : pinned.length === 0 ? (
            <Ticket kind="other" stub={<span className="ticket-date__day">–</span>} className="empty-ticket">
              <span className="event-ticket__title">{eventLabels.empty}</span>
              <a href={site.links.instagram} target="_blank" rel="noopener" className="event-ticket__detail">
                Instagram
              </a>
            </Ticket>
          ) : null}

          <section className="band-band">
            <p>{site.bands}</p>
            {/* /bands arrives in M8; until then the button opens the booking form itself */}
            <Button href={site.links.bandBookingForm} external variant="secondary">
              {visitLabels.bookYourBand}
            </Button>
          </section>
        </div>
      </div>
    </PageWipe>
  );
}
