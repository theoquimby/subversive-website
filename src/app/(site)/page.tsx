// Home (redesign 2026-11-14; Theo's brief that day: "give someone the basic info they are
// looking for and then give them ways to get to the other stuff", announcements and the
// things Max wants to feature, never overloaded).
// Composed, not listed: each part of the page is led by a pen drawing in the margin, and
// the drawing is the way to that part's own page.
//   first screen (the glass, the tap, the status) · visit (the taproom: today, where, the
//   phone) · coming up (a ticket: three tickets) · on tap (the featured beers) · from the
//   kitchen (a burger: one photo) · where it comes from (barley: the map you can ask)
// Hours in full, the whole menu and every event live on their own pages.
import { homeLabels, microcopy, visitLabels } from "@content/microcopy";
import { type Photo, type PhotoId, photos } from "@content/photos";
import type { Metadata } from "next";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { Hero } from "@/components/home/Hero";
import { SourceMap } from "@/components/home/SourceMap";
import { Drawing } from "@/components/home/Ways";
import { PageWipe } from "@/components/layout/PageWipe";
import { SectionHead } from "@/components/layout/SectionHead";
import { IntroBox } from "@/components/menu/IntroBox";
import { MenuRow, rowPrice } from "@/components/menu/MenuRow";
import { Link } from "@/components/ui/Link";
import { ExternalLink, TextLink } from "@/components/ui/TextLink";
import { hoursEvents } from "@/components/visit/OpenNow";
import { getEvents, tickets, upcoming } from "@/lib/events/source";
import { formatClock, formatRange, formatTime, weekdayLabel } from "@/lib/hours/format";
import { scheduleFor } from "@/lib/hours/schedule";
import { mapFeatures } from "@/lib/map/features";
import { projectNY } from "@/lib/map/project";
import { isBeer } from "@/lib/menu/kinds";
import { applySeasonal } from "@/lib/menu/seasonal";
import { getMenu } from "@/lib/menu/source";
import { buildMenuView, draftBeers, findItem } from "@/lib/menu/view";
import { getLiveSite } from "@/lib/site/ops";
import { now } from "@/lib/time/now";
import { nyParts, weekdayOf } from "@/lib/time/ny";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Subversive · Catskill NY",
  description:
    "Draft beer brewed with New York grain, smash burgers and the beer garden at Subversive, 96 West Bridge Street, Catskill NY.",
};

const KITCHEN = "burger-and-beer-wide";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FEATURED = 4;

export default async function Home() {
  const today = nyParts(now()).date;
  const site = await getLiveSite(today);
  const view = buildMenuView(applySeasonal(await getMenu(), today));
  const { events } = await getEvents();
  const coming = tickets(upcoming(events, today)).slice(0, 3);
  const taps = draftBeers(view);
  // what Max is featuring: the beers that carry a badge on the menu (flagship, seasonal,
  // the fundraiser), then the first taps to make up the number
  const featured = [...taps.filter((t) => t.badge), ...taps.filter((t) => !t.badge)].slice(0, FEATURED);
  const burgers = view.food.find((s) => s.id === "smash-burgers");
  const kitchenPhoto = photos[KITCHEN] as Photo;
  const dish = kitchenPhoto.menuItemId ? findItem(view, kitchenPhoto.menuItemId) : undefined;
  const tonight = scheduleFor(today, { hours: site.hours }, await hoursEvents());

  // where each source sits on the drawn map: placed from its latitude and longitude, so
  // a supplier added as data (later, from Ops) appears with no drawing work. A source with
  // no location, or one outside the drawing, counts as statewide.
  // Each source may also carry a detail view: a photograph, a few sentences, a link. It
  // opens under the source when it is chosen. TODO(Max): the sentences and photographs for
  // each supplier; only the grain photograph is on hand, so only Grain opens today.
  const stops = site.sourcing.map(({ what, who, where, geo, photo, about, url }) => {
    const at = geo ? projectNY(geo.lat, geo.lng) : null;
    const hasPhoto = photo !== undefined && photo in photos;
    return {
      what,
      who,
      where,
      place: at?.onMap ? { label: where.split(",")[0]?.trim() ?? where, x: at.x, y: at.y } : null,
      detail:
        hasPhoto || about || url ? (
          <>
            {hasPhoto ? (
              <PhotoFrame
                id={photo as PhotoId}
                ratio="16/10"
                sizes="(min-width: 1024px) 420px, 100vw"
                // no scroll reveal: this photo is added on a click, after the page's
                // reveal observer has run, and would stay hidden waiting for it
                reveal={false}
              />
            ) : null}
            {about ? <p className="smap__about">{about}</p> : null}
            {url ? <ExternalLink href={url}>{homeLabels.supplierSite}</ExternalLink> : null}
          </>
        ) : null,
    };
  });

  // the first screen's glass: the flagship first, then the taps in menu order
  const flagship = Math.max(
    0,
    taps.findIndex((b) => b.badge === "Flagship"),
  );
  const tapBeers = [...taps.slice(flagship), ...taps.slice(0, flagship)].flatMap(({ id, item }) =>
    isBeer(item)
      ? [
          {
            id,
            name: item.name,
            style: item.style,
            abv: item.abv,
            color: item.color,
            ...(item.hazy ? { hazy: true } : {}),
            ...(item.description ? { description: item.description } : {}),
          },
        ]
      : [],
  );

  return (
    <PageWipe>
      <Hero site={site} beers={tapBeers} notice={site.notice?.text} />

      <div className="page home" data-skin="paper">
        {/* Each part of the page is led by a pen drawing in the margin, and the drawing is
            the way to that part's own page. First, what a visitor came for: when, where,
            the phone. (Not a named landmark: the footer has a region called "Visit".) */}
        <section className="home-section band">
          <Link href="/visit" className="band__art" aria-hidden="true" tabIndex={-1}>
            <Drawing name="visit" />
          </Link>
          <SectionHead>{homeLabels.visit}</SectionHead>
          <dl className="facts">
            <div className="facts__cell">
              <dt>{homeLabels.facts.today}</dt>
              <dd>
                {tonight.open !== null && tonight.close !== null ? (
                  <>
                    <span className="facts__big tabular">{formatRange(tonight.open, tonight.close)}</span>
                    {tonight.kitchenClose !== null && tonight.kitchenClose !== tonight.close ? (
                      <span className="facts__small">
                        {visitLabels.kitchenTil(formatTime(tonight.kitchenClose))}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="facts__big">{visitLabels.closed}</span>
                )}
                <TextLink href="/visit#hours">{homeLabels.facts.allHours}</TextLink>
              </dd>
            </div>
            <div className="facts__cell">
              <dt>{homeLabels.facts.findUs}</dt>
              <dd>
                <span className="facts__big">{site.address.street}</span>
                <span className="facts__small">
                  {site.address.city}, {site.address.state} {site.address.zip}
                </span>
                <ExternalLink href={site.links.map}>{microcopy.directions}</ExternalLink>
              </dd>
            </div>
            <div className="facts__cell">
              <dt>{homeLabels.facts.call}</dt>
              <dd>
                <a className="facts__big facts__phone tabular" href={`tel:${site.phone.tel}`}>
                  {site.phone.display}
                </a>
                <span className="facts__small">{site.phone.note}</span>
              </dd>
            </div>
          </dl>
        </section>

        {coming.length > 0 ? (
          <section className="home-section band" aria-labelledby="coming-title">
            <Link href="/events" className="band__art" aria-hidden="true" tabIndex={-1}>
              <Drawing name="events" />
            </Link>
            <SectionHead id="coming-title">{homeLabels.comingUp}</SectionHead>
            <ul className="tix">
              {coming.map((e) => {
                const [, m, d] = e.date.split("-");
                return (
                  <li key={e.id}>
                    <Link
                      href={`/events/${e.slug}`}
                      className="tix__t"
                      data-game={e.kind === "GAME" ? "" : undefined}
                    >
                      <span className="tix__stub">
                        <span className="tix__day tabular">{Number(d)}</span>
                        <span className="tix__when">
                          {weekdayLabel(weekdayOf(e.date), "short")} · {MONTHS[Number(m) - 1]}
                        </span>
                      </span>
                      <span className="tix__body">
                        <span className="tix__title">{e.displayTitle}</span>
                        {e.startTime ? (
                          <span className="tix__time tabular">{formatClock(e.startTime)}</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <TextLink href="/events">{microcopy.allEvents}</TextLink>
          </section>
        ) : null}

        <section className="home-section band band--plain" aria-labelledby="tap-title">
          <SectionHead id="tap-title" note={`${view.pourSizes.half} / ${view.pourSizes.full}`}>
            {homeLabels.onTap}
          </SectionHead>
          <ul className="mlist home-tap">
            {featured.map((row, i) => (
              <MenuRow key={row.id} row={row} index={i} disclosure={false} />
            ))}
          </ul>
          <TextLink href="/menu">{homeLabels.fullMenu}</TextLink>
        </section>

        <section className="home-section band" aria-labelledby="kitchen-title">
          <Link href="/menu?show=food" className="band__art" aria-hidden="true" tabIndex={-1}>
            <Drawing name="menu" />
          </Link>
          <SectionHead id="kitchen-title">{homeLabels.kitchen}</SectionHead>
          <div className="home-kitchen">
            <figure className="home-kitchen__photo">
              <PhotoFrame id={KITCHEN} ratio="16/10" sizes="(min-width: 1024px) 640px, 100vw" />
              {/* a caption prints only when the photo's dish is on today's menu (plan Q19) */}
              {dish ? (
                <figcaption className="home-kitchen__caption">
                  <span>{dish.item.name}</span>
                  <span className="tabular">{rowPrice(dish)}</span>
                </figcaption>
              ) : null}
            </figure>
            <div className="home-kitchen__text">
              {burgers?.intro ? (
                <IntroBox
                  intro={burgers.intro}
                  producers={site.sourcing.flatMap((s) => s.who.split(" · "))}
                />
              ) : null}
              <TextLink href="/menu?show=food">{homeLabels.seeFood}</TextLink>
            </div>
          </div>
        </section>

        <section className="home-section band" aria-labelledby="where-title">
          <Link href="/beer" className="band__art" aria-hidden="true" tabIndex={-1}>
            <Drawing name="beer" />
          </Link>
          <SectionHead id="where-title">{homeLabels.whereFrom}</SectionHead>
          <p className="home-lede">{site.sourcingLine}</p>
          <SourceMap stops={stops} features={mapFeatures()} />
          <TextLink href="/beer">{homeLabels.ourBeer}</TextLink>
        </section>
      </div>
    </PageWipe>
  );
}
