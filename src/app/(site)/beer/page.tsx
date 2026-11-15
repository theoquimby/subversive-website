// /beer, "Our beer" (redesign 2026-11-15). The brewery's own words about how it brews,
// from the old site (content/site.json → brewery, sourcingLine, about), beside an ear of
// barley in pen; one photograph of the brewhouse; the map of where the ingredients come
// from; and the way on to what is pouring. Nothing here is written for the page.
//
// One of the old site's three brewery paragraphs names a process the brand has dropped
// (spec O10), so it is left out whole rather than edited. TODO(Max): approve a rewording.
import { homeLabels } from "@content/microcopy";
import type { Metadata } from "next";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { Drawing } from "@/components/home/Ways";
import { WhereFrom } from "@/components/home/WhereFrom";
import { PageWipe } from "@/components/layout/PageWipe";
import { SectionHead } from "@/components/layout/SectionHead";
import { TextLink } from "@/components/ui/TextLink";
import { getSite, NAV } from "@/lib/site/site";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Our beer · Subversive, Catskill NY",
  description: "How Subversive brews: beer from 100% New York grain, and where the ingredients come from.",
};

const DROPPED = /malt/i;

export default function BeerPage() {
  const site = getSite();
  const title = NAV.find((n) => n.href === "/beer")?.label ?? "";
  const paragraphs = site.brewery.paragraphs.filter((p) => !DROPPED.test(p));
  return (
    <PageWipe>
      <div className="page prose-page">
        <header className="prose-head">
          <h1 className="page__title">{title}</h1>
          <Drawing name="beer" className="prose-head__art" />
        </header>

        <div className="prose-split">
          <div className="prose">
            <p className="prose__lede">{site.sourcingLine}</p>
            {paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <TextLink href="/menu">{homeLabels.fullMenu}</TextLink>
          </div>
          <PhotoFrame id="kettle-dark" ratio="4/5" sizes="(min-width: 1024px) 420px, 100vw" />
        </div>

        <section className="prose-section" aria-labelledby="where-title">
          <SectionHead id="where-title">{homeLabels.whereFrom}</SectionHead>
          <WhereFrom sourcing={site.sourcing} />
        </section>
      </div>
    </PageWipe>
  );
}
