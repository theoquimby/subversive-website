// /visit (spec §6.4): "Find us". Hours with the next 14 days' special hours, the address
// with Directions (the page's one primary action) and Call, the four facts in the site's
// own words, the photo pair and the tent, then gift cards and contact.
import { microcopy, visitLabels } from "@content/microcopy";
import type { Metadata } from "next";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { PageWipe } from "@/components/layout/PageWipe";
import { Pill } from "@/components/layout/Pill";
import { Button } from "@/components/ui/Button";
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
          <h1 className="page__title">{visitLabels.title}</h1>
          <OpenNow />
        </header>

        <div className="visit-grid">
          <section id="hours" className="visit-hours" aria-labelledby="hours-title">
            <Pill id="hours-title">{visitLabels.hours}</Pill>
            <HoursCard hours={site.hours} events={await hoursEvents()} today={today} />
          </section>
          <AddressBlock site={site} />
        </div>

        <div className="visit-pair">
          <PhotoFrame id="exterior-dusk" ratio="4/5" sizes="(min-width: 768px) 40vw, 50vw" />
          <PhotoFrame id="beer-garden-night" ratio="4/5" sizes="(min-width: 768px) 40vw, 50vw" />
        </div>

        <section className="visit-section" aria-labelledby="know-title">
          <Pill id="know-title">{visitLabels.goodToKnow}</Pill>
          <GoodToKnow visit={site.visit} />
        </section>
      </div>

      <PhotoFrame id="heated-tent" ratio="16/10" bleed sizes="100vw" className="visit-tent" />

      <div className="page page--visit page--visit-end">
        <div className="visit-end">
          <section id="gift-cards" className="visit-section" aria-labelledby="gift-title">
            <Pill id="gift-title">{visitLabels.giftCards}</Pill>
            <p className="visit-prose">{site.visit.giftCards}</p>
            <Button href={site.links.eGiftCard} external variant="secondary">
              {visitLabels.eGiftCards}
            </Button>
          </section>
          <section id="contact" className="visit-section" aria-labelledby="contact-title">
            <Pill id="contact-title">{visitLabels.contact}</Pill>
            <ul className="contact-list">
              <li>
                <a href={`mailto:${site.email}`}>{microcopy.emailUs}</a>
              </li>
              <li>
                <a href={`tel:${site.phone.tel}`} className="tabular">
                  {site.phone.display}
                </a>
              </li>
              <li>
                <a href={site.links.instagram} target="_blank" rel="noopener">
                  Instagram
                </a>
              </li>
              <li>
                <a href={site.links.facebook} target="_blank" rel="noopener">
                  Facebook
                </a>
              </li>
              <li>
                <a href={site.links.bandBookingForm} target="_blank" rel="noopener">
                  {visitLabels.bookYourBand}
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </PageWipe>
  );
}
