// /beer, "Our beer" (redesign 2026-11-15). The brewery's own words about how it brews,
// from the old site (content/site.json → brewery, sourcingLine, about), beside an ear of
// barley in pen; one photograph of the brewhouse; the map of where the ingredients come
// from; and the way on to what is pouring. Nothing here is written for the page.
//
// One of the old site's three brewery paragraphs names a process the brand has dropped
// (spec O10), so it is left out whole rather than edited. TODO(Max): approve a rewording.
import { brewLabels, homeLabels } from "@content/microcopy";
import type { Metadata } from "next";
import { BrewProcess } from "@/components/beer/BrewProcess";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { Drawing } from "@/components/home/Ways";
import { WhereFrom } from "@/components/home/WhereFrom";
import { PageWipe } from "@/components/layout/PageWipe";
import { SectionHead } from "@/components/layout/SectionHead";
import { MenuRow } from "@/components/menu/MenuRow";
import { TextLink } from "@/components/ui/TextLink";
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

          {/* what is pouring now: every tap, as on Home, with the two pour sizes named once */}
          <section className="prose-section" aria-labelledby="tap-title">
            <SectionHead id="tap-title" note={`${view.pourSizes.half} / ${view.pourSizes.full}`}>
              {homeLabels.onTap}
            </SectionHead>
            <ul className="mlist home-tap">
              {taps.map((row, i) => (
                <MenuRow key={row.id} row={row} index={i} />
              ))}
            </ul>
          </section>
        </div>

        {/* how a batch is brewed, as a living drawing */}
        <section className="prose-section brew-section" aria-labelledby="brew-title">
          <SectionHead id="brew-title">{brewLabels.title}</SectionHead>
          <BrewProcess />
        </section>

        <section className="prose-section" aria-labelledby="where-title">
          <SectionHead id="where-title">{homeLabels.whereFrom}</SectionHead>
          <WhereFrom sourcing={site.sourcing} />
          <p className="prose-links">
            <TextLink href="/menu">{homeLabels.fullMenu}</TextLink>
          </p>
        </section>
      </div>
    </PageWipe>
  );
}
