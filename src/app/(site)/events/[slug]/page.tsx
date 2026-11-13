// /events/[slug] (spec §6.3, plan Q14–Q15): the torn hero ticket; the matchup for games or
// the kind's colour as a band with the seal; the description; good to know; add to
// calendar, share, directions; previous and next. A renamed event redirects (308) to its
// canonical slug; a past one that is gone says "This one's over".
import { eventLabels, microcopy } from "@content/microcopy";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { AddToCalendar } from "@/components/events/AddToCalendar";
import { Countdown } from "@/components/events/Countdown";
import { EventDescription } from "@/components/events/EventDescription";
import { DateStub, dateParts, detailLine, EventTicket, TICKET_KIND } from "@/components/events/EventTicket";
import { Matchup } from "@/components/events/Matchup";
import { Seal } from "@/components/graphics/Seal";
import { Sticker } from "@/components/graphics/Sticker";
import { Ticket } from "@/components/graphics/Ticket";
import { PageWipe } from "@/components/layout/PageWipe";
import { ShareButton } from "@/components/menu/ShareButton";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { googleCalendarUrl } from "@/lib/events/calendar";
import { goodToKnow } from "@/lib/events/facts";
import { resolveSlug } from "@/lib/events/slug";
import { getEvents, tickets, upcoming } from "@/lib/events/source";
import { formatDateShort } from "@/lib/hours/format";
import { scheduleFor } from "@/lib/hours/schedule";
import { getSite } from "@/lib/site/site";
import { now } from "@/lib/time/now";
import { diffDays, type IsoDate, nyParts } from "@/lib/time/ny";

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const { events } = await getEvents();
  return upcoming(tickets(events), nyParts(now()).date).map((e) => ({ slug: e.slug }));
}

async function resolve(slug: string) {
  const { events } = await getEvents();
  const today = nyParts(now()).date;
  return { r: resolveSlug(slug, events, today), events, today };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { r, today } = await resolve(slug);
  if (r.type === "over") {
    return { title: `${eventLabels.over} · Subversive, Catskill NY`, robots: { index: false } };
  }
  if (r.type !== "found") return {};
  const e = r.event;
  const old = diffDays(e.date, today) > 30;
  return {
    title: `${e.title} · Subversive, Catskill NY`,
    description: `${formatDateShort(e.date)}${e.startTime ? `, ${detailLine(e)}` : ""} at Subversive, 96 West Bridge Street, Catskill NY.`,
    ...(old ? { robots: { index: false } } : {}),
  };
}

function OverPage({ date }: { date: IsoDate }) {
  return (
    <PageWipe>
      <div className="events-page" data-page-skin="overtime">
        <div className="page event-over">
          <h1 className="event-over__date">{formatDateShort(date)}</h1>
          <Sticker
            shape="round"
            color="ember"
            rotate="a"
            label={eventLabels.over}
            className="event-over__stamp"
          >
            {eventLabels.over}
          </Sticker>
          <Button href="/events">{eventLabels.upcoming}</Button>
        </div>
      </div>
    </PageWipe>
  );
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const { r, events, today } = await resolve(slug);
  if (r.type === "redirect") permanentRedirect(`/events/${r.slug}`);
  if (r.type === "over") return <OverPage date={r.date} />;
  if (r.type === "missing") notFound();

  const e = r.event;
  const site = getSite();
  const p = dateParts(e.date);
  const facts = goodToKnow(e, scheduleFor(e.date, site, events));
  const list = tickets(events);
  const i = list.findIndex((x) => x.id === e.id);
  const prev = i > 0 ? list[i - 1] : undefined;
  const next = i >= 0 && i < list.length - 1 ? list[i + 1] : undefined;
  const past = e.date < today;

  return (
    <PageWipe>
      <div className="events-page" data-page-skin="overtime">
        <div className="page event-page">
          <TextLink href="/events">{microcopy.allEvents}</TextLink>
          <div className="event-hero">
            <Ticket kind={TICKET_KIND[e.category]} stub={<DateStub date={e.date} />} torn>
              <span className="event-hero__date">
                {p.weekdayLong}, {p.monthLong} {p.day}
                {detailLine(e) ? <span className="tabular"> · {detailLine(e)}</span> : null}
              </span>
              <h1 className="event-hero__title">{e.displayTitle}</h1>
            </Ticket>
            {past ? (
              <Sticker
                shape="round"
                color="ember"
                rotate="b"
                label={eventLabels.over}
                className="event-hero__over"
              >
                {eventLabels.over}
              </Sticker>
            ) : null}
          </div>
        </div>

        {e.matchup ? (
          <div className="page event-game">
            <Matchup event={e} />
            {!past ? <Countdown event={e} /> : null}
          </div>
        ) : (
          <div className="event-band" data-kind={TICKET_KIND[e.category]}>
            <Seal className="event-band__seal" />
          </div>
        )}

        <div className="page event-page event-page--body">
          <EventDescription text={e.description} />
          {facts.length > 0 ? (
            <section className="event-facts" aria-labelledby="facts-title">
              <h2 id="facts-title" className="event-facts__title">
                {eventLabels.goodToKnow}
              </h2>
              <ul>
                {facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <div className="event-actions">
            {!past ? (
              <AddToCalendar
                icsHref={`/api/events/${encodeURIComponent(e.id)}/ics`}
                googleHref={googleCalendarUrl(e, site)}
              />
            ) : null}
            <Button href={site.links.map} external variant="quiet">
              {microcopy.directions}
            </Button>
            <ShareButton />
          </div>
          {prev || next ? (
            <nav className="event-prevnext" aria-label={`${eventLabels.previous} / ${eventLabels.next}`}>
              {prev ? (
                <div>
                  <p className="event-prevnext__label">{eventLabels.previous}</p>
                  <EventTicket event={prev} />
                </div>
              ) : (
                <span />
              )}
              {next ? (
                <div>
                  <p className="event-prevnext__label">{eventLabels.next}</p>
                  <EventTicket event={next} />
                </div>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
    </PageWipe>
  );
}
