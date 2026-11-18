// /beer, "Our beer" (redesign 2026-11-15). The brewery's own words about how it brews,
// from the old site (content/site.json → brewery, sourcingLine, about), beside an ear of
// barley in pen; one photograph of the brewhouse; the map of where the ingredients come
// from; and the way on to what is pouring. Nothing here is written for the page.
//
// One of the old site's three brewery paragraphs names a process the brand has dropped
// (spec O10), so it is left out whole rather than edited. TODO(Max): approve a rewording.
import { labels, offMenu } from "@content/labels";
import { brewLabels, homeLabels, libraryLabels } from "@content/microcopy";
import type { Metadata } from "next";
import { BrewProcess } from "@/components/beer/BrewProcess";
import { Can } from "@/components/beer/Can";
import { CanLink } from "@/components/beer/CanLink";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { PhotoStrip } from "@/components/home/PhotoStrip";
import { Drawing } from "@/components/home/Ways";
import { WhereFrom } from "@/components/home/WhereFrom";
import { PageWipe } from "@/components/layout/PageWipe";
import { SectionHead } from "@/components/layout/SectionHead";
import { ItemSheet } from "@/components/menu/ItemSheet";
import { MenuRow } from "@/components/menu/MenuRow";
import { TextLink } from "@/components/ui/TextLink";
import { isBeer } from "@/lib/menu/kinds";
import { applySeasonal } from "@/lib/menu/seasonal";
import { getMenu } from "@/lib/menu/source";
import { buildMenuView, draftBeers } from "@/lib/menu/view";
import { getSite, NAV } from "@/lib/site/site";
import { now } from "@/lib/time/now";
import { nyParts } from "@/lib/time/ny";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Our beer · Subversive, Catskill NY",
  description: "How Subversive brews: beer from 100% New York grain, and where the ingredients come from.",
};

const DROPPED = /malt/i;

export default async function BeerPage() {
  const site = getSite();
  const view = buildMenuView(applySeasonal(await getMenu(), nyParts(now()).date));
  const taps = draftBeers(view);
  // the beers the brewing drawing can brew: what is on tap, in the menu's own words
  const brews = taps.flatMap((t) =>
    isBeer(t.item)
      ? [
          {
            id: t.id,
            name: t.item.name,
            style: t.item.style,
            description: t.item.description ?? "",
            color: t.item.color,
            ...(t.item.hazy ? { hazy: true } : {}),
            ...(t.badge ? { badge: t.badge } : {}),
          },
        ]
      : [],
  );
  const title = NAV.find((n) => n.href === "/beer")?.label ?? "";
  const paragraphs = site.brewery.paragraphs.filter((p) => !DROPPED.test(p));
  return (
    <PageWipe>
      <div className="page prose-page">
        <header className="prose-head">
          <h1 className="page__title">{title}</h1>
          <Drawing name="beer" className="prose-head__art" />
        </header>

        <div className="prose-split beer-top">
          <div className="prose">
            <p className="prose__lede">{site.sourcingLine}</p>
            {paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {/* where it is brewed: the copper brewhouse and the tanks */}
          <div className="photo-pair beer-top__photos">
            <PhotoFrame
              id="brewhouse-copper"
              ratio="4/5"
              reveal={false}
              sizes="(min-width: 1024px) 260px, 50vw"
            />
            <PhotoFrame id="tanks" ratio="4/5" reveal={false} sizes="(min-width: 1024px) 260px, 50vw" />
          </div>

          {/* The beer library (Theo, 2026-11-18): each beer with its can beside it, in
              Max's label where he has sent one. Not all of these are pouring today, so the
              ones on the menu say "On tap now". A tap on a can or a row opens the beer's
              view, with its can pouring the glass, as on the menu (the same ItemSheet
              reads these rows, hence the menu's data attributes; data-show is set so the
              sheet's list switch has nothing to do). Beers with a label but not on the
              menu are listed with only what their label says. */}
          <div className="beer-top__wide" data-menu="" data-show="drinks">
            <section
              className="prose-section"
              aria-labelledby="tap-title"
              data-list="drinks"
              data-section="library"
            >
              <SectionHead id="tap-title" note={`${view.pourSizes.half} / ${view.pourSizes.full}`}>
                {libraryLabels.title}
              </SectionHead>
              <ul className="mlist library">
                {taps.map((row, i) => (
                  <MenuRow
                    key={row.id}
                    row={row}
                    index={i}
                    detail
                    note={libraryLabels.onTap}
                    lead={
                      <CanLink id={row.id}>
                        <Can
                          label={labels[row.id]}
                          name={row.item.name}
                          color={isBeer(row.item) ? row.item.color : undefined}
                        />
                      </CanLink>
                    }
                  />
                ))}
                {offMenu.map((b) => (
                  <li key={b.id} className="mrow mrow--lead">
                    <Can label={labels[b.id]} name={b.name} />
                    <div className="mrow__box">
                      <span className="mrow__sum">
                        <span className="mrow__main">
                          <span className="mrow__name">{b.name}</span>
                          <span className="mrow__line">
                            <span className="mrow__meta">{b.style}</span>
                          </span>
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Max's photographs of the beers (2026-11-18); each opens large */}
          <div className="beer-top__wide">
            <PhotoStrip
              ids={[
                "pro-forbidden-fruit",
                "pro-pour",
                "pro-camp-comet-window",
                "pro-dark-harvest",
                "pro-camp-comet-smores",
                "pro-goblin-glass",
              ]}
            />
          </div>
        </div>

        {/* where the grain and the rest come from, then how it becomes beer (Theo,
            2026-11-16: "How it's made" after "Where it comes from") */}
        <section className="prose-section" aria-labelledby="where-title">
          <SectionHead id="where-title">{homeLabels.whereFrom}</SectionHead>
          <WhereFrom sourcing={site.sourcing} />
        </section>

        {/* how a batch is brewed, as a living drawing */}
        <section id="brew" className="prose-section brew-section" aria-labelledby="brew-title">
          <SectionHead id="brew-title">{brewLabels.title}</SectionHead>
          <BrewProcess beers={brews} />
          <p className="prose-links">
            <TextLink href="/menu">{homeLabels.fullMenu}</TextLink>
          </p>
        </section>
      </div>
      <ItemSheet />
    </PageWipe>
  );
}
