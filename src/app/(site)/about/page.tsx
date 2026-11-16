// /about (redesign 2026-11-15). The brewery's story in its own words from the old site
// (content/site.json → about): what it is, how it began in a barn in Livingston in 2018
// and moved to the garage in Catskill, and who founded it; the taproom in pen beside the
// title; the photograph of the founders; the ways on. Nothing here is written for the page.
import { aboutLabels } from "@content/microcopy";
import type { Metadata } from "next";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { Drawing } from "@/components/home/Ways";
import { PageWipe } from "@/components/layout/PageWipe";
import { TextLink } from "@/components/ui/TextLink";
import { getSite, NAV } from "@/lib/site/site";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "About · Subversive, Catskill NY",
  description: "Subversive, a farmhouse brewery at the foot of the Catskill Mountains, open since 2018.",
};

export default function AboutPage() {
  const site = getSite();
  const [lede, ...rest] = site.about.paragraphs;
  return (
    <PageWipe>
      <div className="page prose-page">
        <header className="prose-head">
          <h1 className="page__title">{aboutLabels.title}</h1>
          <Drawing name="barn" className="prose-head__art" />
        </header>

        <div className="prose-split">
          <div className="prose">
            {lede ? <p className="prose__lede">{lede}</p> : null}
            {rest.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <dl className="prose-facts">
              <dt>{aboutLabels.founders}</dt>
              <dd>{site.about.founders.join(" · ")}</dd>
            </dl>
            <p className="prose-links">
              {NAV.filter((n) => n.href === "/visit" || n.href === "/beer").map((n) => (
                <TextLink key={n.href} href={n.href}>
                  {n.label}
                </TextLink>
              ))}
            </p>
          </div>
          <PhotoFrame
            id="founders-doorway"
            ratio="4/5"
            reveal={false}
            sizes="(min-width: 1024px) 420px, 100vw"
          />
        </div>
        <PhotoFrame
          id="taproom-tables"
          ratio="16/10"
          className="beer-wide"
          sizes="(min-width: 1024px) 832px, 100vw"
        />
      </div>
    </PageWipe>
  );
}
