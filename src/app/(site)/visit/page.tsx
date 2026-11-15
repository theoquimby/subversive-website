// /visit (redesign 2026-11-15): "Find us", in the order a visitor needs it. The taproom
// drawn in pen beside the title and the open-now line; the address with Directions (the
// page's one primary action) and Call; the week's hours with the special dates beneath;
// what to know before coming, in the site's own words; one photograph; the gift-card
// line. Contact lives in the footer on every page, so it is not repeated here.
import { visitLabels } from "@content/microcopy";
import type { Metadata } from "next";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { Drawing } from "@/components/home/Ways";
import { PageWipe } from "@/components/layout/PageWipe";
import { SectionHead } from "@/components/layout/SectionHead";
import { ExternalLink } from "@/components/ui/TextLink";
import { AddressBlock } from "@/components/visit/AddressBlock";
import { GoodToKnow } from "@/components/visit/GoodToKnow";
import { HoursCard } from "@/components/visit/HoursCard";
import { hoursEvents, OpenNow } from "@/components/visit/OpenNow";
import { getSite } from "@/lib/site/site";
import { now } from "@/lib/time/now";
import { nyParts } from "@/lib/time/ny";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Visit · Subversive, Catskill NY",
  description: "Hours, directions and parking for Subversive, 96 West Bridge Street, Catskill NY.",
};

export default async function VisitPage() {
  const site = getSite();
  const today = nyParts(now()).date;
  return (
    <PageWipe>
      <div className="page page--visit">
        <header className="visit-head">
          <div className="visit-head__text">
            <h1 className="page__title">{visitLabels.title}</h1>
            <OpenNow />
          </div>
          <Drawing name="visit" className="visit-head__art" />
        </header>

        <div className="visit-grid">
          <AddressBlock site={site} />
          <section id="hours" className="visit-hours" aria-labelledby="hours-title">
            <SectionHead id="hours-title">{visitLabels.hours}</SectionHead>
            <HoursCard hours={site.hours} events={await hoursEvents()} today={today} />
          </section>
        </div>

        <section className="visit-section" aria-labelledby="know-title">
          <SectionHead id="know-title">{visitLabels.goodToKnow}</SectionHead>
          <div className="visit-know">
            <GoodToKnow visit={site.visit} />
            <PhotoFrame id="firepit-beers" ratio="4/5" sizes="(min-width: 1024px) 420px, 100vw" />
          </div>
        </section>

        <p id="gift-cards" className="visit-note">
          {site.visit.giftCards}{" "}
          <ExternalLink href={site.links.eGiftCard}>{visitLabels.eGiftCards}</ExternalLink>
        </p>
      </div>
    </PageWipe>
  );
}
