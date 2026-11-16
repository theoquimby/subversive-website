// /events/[slug] (redesign 2026-11-15): a night page like the list. The date and time, the
// title on the ink line (a game night's line carries the Knicks' two colours), the
// description, good to know, one primary action (add to calendar) with directions and
// share beside it, and the tickets before and after. No torn stub, scoreboard or band. A renamed event redirects (308) to its
// canonical slug; a past one that is gone says "This one's over".
import { eventLabels, microcopy } from "@content/microcopy";
import type { Metadata, Viewport } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { AddToCalendar } from "@/components/events/AddToCalendar";
import { EventDescription } from "@/components/events/EventDescription";
import { EventFeature } from "@/components/events/EventFeature";
import { EventMark } from "@/components/events/EventMark";
import { dateParts, detailLine } from "@/components/events/EventTicket";
import { Lights } from "@/components/events/Lights";
import { GameStrokes, TicketLink } from "@/components/events/TicketLink";
import { Sticker } from "@/components/graphics/Sticker";
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
import { raw } from "@/styles/tokens";

export const revalidate = 300;
// the phone's status bar and toolbar take the night skin on these pages
export const viewport: Viewport = { themeColor: raw.night };

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
        <Lights />
        <div className="page event-page">
          <TextLink href="/events">{microcopy.allEvents}</TextLink>
          {/* the head is the ticket that was tapped, large and lit: date on the stub, the
              night's mark, the title, the time */}
          <header className="event-head eticket" data-game={e.kind === "GAME" ? "" : undefined}>
            <div className="eticket__stub">
              <span className="eticket__day tabular">{p.day}</span>
              <span className="eticket__when">
                {p.weekdayLong.slice(0, 3)} · {p.monthLong.slice(0, 3)}
              </span>
            </div>
            <div className="eticket__body">
              <EventMark kind={e.kind} title={e.displayTitle} className="eticket__mark" />
              <h1 className="event-hero__title">{e.displayTitle}</h1>
              {e.kind === "GAME" ? <GameStrokes className="event-head__game" /> : null}
              <p className="event-head__date">
                {p.weekdayLong}, {p.monthLong} {p.day}
                {detailLine(e) ? <span className="tabular"> · {detailLine(e)}</span> : null}
                {past ? <span> · {eventLabels.over}</span> : null}
              </p>
            </div>
          </header>
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
            <div className="event-actions__row">
              <Button href={site.links.map} external variant="quiet">
                {microcopy.directions}
              </Button>
              <ShareButton />
            </div>
          </div>
          {/* a featured night's own page from Ops (event.page); nothing when it has none */}
          <EventFeature page={e.page} title={e.displayTitle} />
          {prev || next ? (
            <nav className="event-prevnext" aria-label={`${eventLabels.previous} / ${eventLabels.next}`}>
              {prev ? (
                <div>
                  <p className="event-prevnext__label">{eventLabels.previous}</p>
                  <TicketLink event={prev} />
                </div>
              ) : null}
              {next ? (
                <div>
                  <p className="event-prevnext__label">{eventLabels.next}</p>
                  <TicketLink event={next} />
                </div>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
    </PageWipe>
  );
}
