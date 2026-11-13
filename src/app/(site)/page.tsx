// Home (spec §6.1). Sections in the spec's order, each named by its one arrangement (§3A):
//   hero (split) · ticker (rail) · on tap (ledger of rows) · kitchen (strip) ·
//   coming up (row of tickets) · where it comes from (split: ledger + map) ·
//   visit (split: hours + address) · gift cards (band)
import { homeLabels, microcopy, visitLabels } from "@content/microcopy";
import { type Photo, photos } from "@content/photos";
import type { Metadata } from "next";
import { EventTicket } from "@/components/events/EventTicket";
import { Ticker } from "@/components/events/Ticker";
import { Chevrons } from "@/components/graphics/Chevrons";
import { NyMap } from "@/components/graphics/NyMap";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { Hero } from "@/components/home/Hero";
import { PageWipe } from "@/components/layout/PageWipe";
import { Pill } from "@/components/layout/Pill";
import { IntroBox } from "@/components/menu/IntroBox";
import { MenuRow, rowPrice } from "@/components/menu/MenuRow";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";
import { AddressBlock } from "@/components/visit/AddressBlock";
import { HoursCard } from "@/components/visit/HoursCard";
import { hoursEvents } from "@/components/visit/OpenNow";
import { SourcingLedger } from "@/components/visit/SourcingLedger";
import { getEvents, tickets, upcoming } from "@/lib/events/source";
import { formatDateShort } from "@/lib/hours/format";
import { applySeasonal } from "@/lib/menu/seasonal";
import { getMenu } from "@/lib/menu/source";
import { buildMenuView, draftBeers, findItem, type ItemView } from "@/lib/menu/view";
import { getSite } from "@/lib/site/site";
import { now } from "@/lib/time/now";
import { nyParts } from "@/lib/time/ny";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Subversive · Catskill NY",
  description:
    "Draft beer brewed with New York grain, smash burgers and the beer garden at Subversive, 96 West Bridge Street, Catskill NY.",
};

const KITCHEN = ["burger-and-beer-wide", "giant-pretzel", "patio-plate"] as const;

function groupByFamily(rows: ItemView[]) {
  const groups: { family: string; rows: ItemView[] }[] = [];
  for (const r of rows) {
    const f = r.family ?? "";
    const g = groups.at(-1);
    if (g && g.family === f) g.rows.push(r);
    else groups.push({ family: f, rows: [r] });
  }
  return groups;
}

export default async function Home() {
  const site = getSite();
  const today = nyParts(now()).date;
  const view = buildMenuView(applySeasonal(await getMenu(), today));
  const { events } = await getEvents();
  const coming = tickets(upcoming(events, today));
  const onTap = groupByFamily(draftBeers(view).slice(0, 8));
  const burgers = view.food.find((s) => s.id === "smash-burgers");
  const ticker = coming
    .slice(0, 3)
    .map((e) => ({ href: `/events/${e.slug}`, label: `${formatDateShort(e.date)} · ${e.displayTitle}` }));

  return (
    <PageWipe>
      <Hero site={site} next={coming[0] ?? null} today={today} />
      <Ticker items={ticker} label={homeLabels.comingUp} />

      <div className="page home">
        <section className="home-section" aria-labelledby="tap-title">
          <Pill id="tap-title">{homeLabels.onTap}</Pill>
          <div className="home-tap">
            {onTap.map((g) => (
              <div key={g.family} className="mgroup">
                <h3 className="mgroup__head">
                  <span className="mgroup__title">{g.family}</span>
                </h3>
                <ul className="mlist">
                  {g.rows.map((row, i) => (
                    <MenuRow key={row.id} row={row} index={i} disclosure={false} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <TextLink href="/menu">{homeLabels.fullMenu}</TextLink>
        </section>

        <section className="home-section" aria-labelledby="kitchen-title">
          <Pill id="kitchen-title">{homeLabels.kitchen}</Pill>
          {/* scrolls sideways on phones, so it takes keyboard focus (axe: scrollable-region-focusable) */}
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard */}
          <ul className="kitchen-strip" tabIndex={0} aria-label={homeLabels.kitchen}>
            {KITCHEN.map((id) => {
              // a caption prints only when the photo's dish is on today's menu (plan Q19)
              const photo = photos[id] as Photo;
              const item = photo.menuItemId ? findItem(view, photo.menuItemId) : undefined;
              return (
                <li key={id}>
                  <PhotoFrame id={id} ratio="4/5" sizes="(min-width: 1024px) 30vw, 78vw" />
                  {item ? (
                    <p className="kitchen-strip__caption">
                      <span>{item.item.name}</span>
                      <span className="tabular">{rowPrice(item)}</span>
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {burgers?.intro ? (
            <IntroBox intro={burgers.intro} producers={site.sourcing.flatMap((s) => s.who.split(" · "))} />
          ) : null}
          <Button href="/menu?show=food" variant="quiet">
            {homeLabels.seeFood}
          </Button>
        </section>

        {coming.length > 0 ? (
          <section className="home-section" aria-labelledby="coming-title">
            <Pill id="coming-title">{homeLabels.comingUp}</Pill>
            <ul className="event-grid home-coming">
              {coming.slice(0, 3).map((e) => (
                <li key={e.id}>
                  <EventTicket event={e} />
                </li>
              ))}
            </ul>
            <TextLink href="/events">{microcopy.allEvents}</TextLink>
          </section>
        ) : null}
      </div>

      <section className="where-from" data-skin="overtime" aria-labelledby="where-title">
        <Chevrons tone="fg" className="where-from__band" />
        <div className="page where-from__inner">
          <div className="where-from__text">
            <Pill id="where-title">{homeLabels.whereFrom}</Pill>
            <p className="where-from__line">{site.sourcingLine}</p>
            <SourcingLedger sourcing={site.sourcing} />
            <TextLink href="/beer">{homeLabels.ourBeer}</TextLink>
          </div>
          <NyMap className="where-from__map" />
        </div>
      </section>

      <div className="page home">
        <section className="home-section home-visit">
          <Pill id="visit-title">{homeLabels.visit}</Pill>
          <div className="home-visit__grid">
            <HoursCard hours={site.hours} events={await hoursEvents()} today={today} />
            <div>
              <AddressBlock site={site} />
              <ul className="fact-chips">
                {homeLabels.facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
          <PhotoFrame id="heated-tent" ratio="16/10" sizes="(min-width: 1024px) 1100px, 100vw" />
        </section>

        <section className="home-section gift-band" aria-labelledby="gift-title">
          <h2 id="gift-title" className="gift-band__title">
            {visitLabels.giftCards}
          </h2>
          <p>{site.visit.giftCards}</p>
          <Button href={site.links.eGiftCard} external variant="secondary">
            {visitLabels.eGiftCards}
          </Button>
        </section>
      </div>
    </PageWipe>
  );
}
