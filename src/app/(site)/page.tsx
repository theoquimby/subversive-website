// Home (redesign 2026-11-14; plan in .impeccable/critique/2026-11-14-full-site.md).
// One page on cream paper with the ink line as its spine: the first screen (ground,
// hills, glass, tap), then each section headed by a title on the line:
//   on tap (rows, two aligned columns) · from the kitchen (one photo, the menu's line) ·
//   coming up (rows) · where it comes from (the delivery run) · visit (hours, address)
import { homeLabels, microcopy, visitLabels } from "@content/microcopy";
import { type Photo, photos } from "@content/photos";
import type { Metadata } from "next";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { DeliveryRun } from "@/components/home/DeliveryRun";
import { Hero } from "@/components/home/Hero";
import { PageWipe } from "@/components/layout/PageWipe";
import { SectionHead } from "@/components/layout/SectionHead";
import { IntroBox } from "@/components/menu/IntroBox";
import { MenuRow, rowPrice } from "@/components/menu/MenuRow";
import { Link } from "@/components/ui/Link";
import { ExternalLink, TextLink } from "@/components/ui/TextLink";
import { AddressBlock } from "@/components/visit/AddressBlock";
import { HoursCard } from "@/components/visit/HoursCard";
import { hoursEvents } from "@/components/visit/OpenNow";
import { getEvents, tickets, upcoming } from "@/lib/events/source";
import { formatClock, weekdayLabel } from "@/lib/hours/format";
import { isBeer } from "@/lib/menu/kinds";
import { applySeasonal } from "@/lib/menu/seasonal";
import { getMenu } from "@/lib/menu/source";
import { buildMenuView, draftBeers, findItem, type ItemView } from "@/lib/menu/view";
import { getSite } from "@/lib/site/site";
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

interface Group {
  family: string;
  rows: ItemView[];
}

function groupByFamily(rows: ItemView[]) {
  const groups: Group[] = [];
  for (const r of rows) {
    const f = r.family ?? "";
    const g = groups.at(-1);
    if (g && g.family === f) g.rows.push(r);
    else groups.push({ family: f, rows: [r] });
  }
  return groups;
}

/** Two columns of whole groups, as even as whole groups allow; each starts at the top. */
function twoColumns(groups: Group[]): [Group[], Group[]] {
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  const left: Group[] = [];
  let count = 0;
  for (const g of groups) {
    if (left.length > 0 && count + g.rows.length / 2 > total / 2) break;
    left.push(g);
    count += g.rows.length;
  }
  return [left, groups.slice(left.length)];
}

export default async function Home() {
  const site = getSite();
  const today = nyParts(now()).date;
  const view = buildMenuView(applySeasonal(await getMenu(), today));
  const { events } = await getEvents();
  const coming = tickets(upcoming(events, today)).slice(0, 4);
  const taps = draftBeers(view);
  const columns = twoColumns(groupByFamily(taps.slice(0, 8)));
  const burgers = view.food.find((s) => s.id === "smash-burgers");
  const kitchenPhoto = photos[KITCHEN] as Photo;
  const dish = kitchenPhoto.menuItemId ? findItem(view, kitchenPhoto.menuItemId) : undefined;

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
      <Hero site={site} beers={tapBeers} />

      <div className="page home" data-skin="paper">
        <section className="home-section" aria-labelledby="tap-title">
          <SectionHead id="tap-title" note={`${view.pourSizes.half} / ${view.pourSizes.full}`}>
            {homeLabels.onTap}
          </SectionHead>
          <div className="home-tap">
            {columns.map((col) => (
              <div key={col[0]?.family ?? "empty"} className="home-tap__col">
                {col.map((g) => (
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
            ))}
          </div>
          <TextLink href="/menu">{homeLabels.fullMenu}</TextLink>
        </section>

        <section className="home-section" aria-labelledby="kitchen-title">
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

        {coming.length > 0 ? (
          <section className="home-section" aria-labelledby="coming-title">
            <SectionHead id="coming-title">{homeLabels.comingUp}</SectionHead>
            <ul className="rows">
              {coming.map((e) => {
                const [, m, d] = e.date.split("-");
                return (
                  <li key={e.id}>
                    <Link href={`/events/${e.slug}`} className="rows__row">
                      <span className="rows__date">
                        <span className="rows__day tabular">{Number(d)}</span>
                        <span className="rows__when">
                          {weekdayLabel(weekdayOf(e.date), "short")} · {MONTHS[Number(m) - 1]}
                        </span>
                      </span>
                      <span className="rows__title">{e.displayTitle}</span>
                      {e.startTime ? (
                        <span className="rows__time tabular">{formatClock(e.startTime)}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <TextLink href="/events">{microcopy.allEvents}</TextLink>
          </section>
        ) : null}

        <section className="home-section" aria-labelledby="where-title">
          <SectionHead id="where-title">{homeLabels.whereFrom}</SectionHead>
          <p className="home-lede">{site.sourcingLine}</p>
          <DeliveryRun site={site} />
        </section>

        {/* not a named landmark: the footer already has a region called "Visit" */}
        <section className="home-section home-visit">
          <SectionHead id="visit-title">{homeLabels.visit}</SectionHead>
          <div className="home-visit__grid">
            <HoursCard hours={site.hours} events={await hoursEvents()} today={today} />
            <div className="home-visit__side">
              <AddressBlock site={site} />
              <p className="home-visit__note">
                {site.visit.giftCards}{" "}
                <ExternalLink href={site.links.eGiftCard}>{visitLabels.eGiftCards}</ExternalLink>
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageWipe>
  );
}
