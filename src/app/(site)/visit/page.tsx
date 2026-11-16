// /visit (redesign 2026-11-15): "Find us", in the order a visitor needs it. The taproom
// drawn in pen beside the title and the open-now line; the address with Directions (the
// page's one primary action) and Call; the week's hours with the special dates beneath;
// what to know before coming, in the site's own words; one photograph; the gift-card
// line. Contact lives in the footer on every page, so it is not repeated here.
import { visitLabels } from "@content/microcopy";
import type { PhotoId } from "@content/photos";
import type { Metadata } from "next";
import { Doodle, type DoodleName } from "@/components/graphics/Doodle";
import { PhotoFrame } from "@/components/graphics/PhotoFrame";
import { Drawing } from "@/components/home/Ways";
import { PageWipe } from "@/components/layout/PageWipe";
import { SectionHead } from "@/components/layout/SectionHead";
import { ExternalLink } from "@/components/ui/TextLink";
import { AddressBlock } from "@/components/visit/AddressBlock";
import { HoursCard } from "@/components/visit/HoursCard";
import { hoursEvents, OpenNow } from "@/components/visit/OpenNow";
import { getLiveSite } from "@/lib/site/ops";
import { now } from "@/lib/time/now";
import { nyParts } from "@/lib/time/ny";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Visit · Subversive, Catskill NY",
  description: "Hours, directions and parking for Subversive, 96 West Bridge Street, Catskill NY.",
};

export default async function VisitPage() {
  const today = nyParts(now()).date;
  const site = await getLiveSite(today);
  const stops: {
    id?: string;
    art: DoodleName;
    label: string;
    text: string;
    tag?: string;
    /** the stop itself, seen two ways (by day and by night; outside and inside) */
    photos?: [PhotoId, PhotoId];
    link?: React.ReactNode;
  }[] = [
    {
      art: "table",
      label: visitLabels.seating,
      text: site.visit.seating,
      photos: ["garden-day", "beer-garden-night"],
    },
    { art: "tent", label: visitLabels.tent, text: site.visit.tent, photos: ["heated-tent", "tent-inside"] },
    { art: "car", label: visitLabels.parking, text: site.visit.parking },
    {
      art: "dog",
      label: visitLabels.dogs,
      text: site.visit.dogs,
      tag: visitLabels.dogsTag,
    },
    {
      id: "gift-cards",
      art: "gift",
      label: visitLabels.giftCards,
      text: site.visit.giftCards,
      link: <ExternalLink href={site.links.eGiftCard}>{visitLabels.eGiftCards}</ExternalLink>,
    },
  ];
  return (
    <PageWipe>
      <div className="page page--visit">
        <header className="visit-head">
          <div className="visit-head__text">
            <h1 className="page__title">{visitLabels.title}</h1>
            <OpenNow />
          </div>
          <Drawing name="street" className="visit-head__art" />
        </header>

        <div className="visit-grid">
          <div className="visit-left">
            <AddressBlock site={site} />
            {/* the front door, so the place is recognised from the street, and the room behind it */}
            <div className="photo-pair visit-doors">
              <PhotoFrame
                id="exterior-dusk"
                ratio="4/5"
                reveal={false}
                sizes="(min-width: 1024px) 280px, 50vw"
              />
              <PhotoFrame
                id="taproom-inside"
                ratio="4/5"
                reveal={false}
                sizes="(min-width: 1024px) 280px, 50vw"
              />
            </div>
          </div>
          <section id="hours" className="visit-hours" aria-labelledby="hours-title">
            <SectionHead id="hours-title">{visitLabels.hours}</SectionHead>
            <HoursCard hours={site.hours} events={await hoursEvents()} today={today} />
          </section>
        </div>

        {/* a walk through the place: each thing worth knowing is a stop with its own
            drawing, the site's own sentence, and a photograph where there is one */}
        <section className="walk" aria-labelledby="know-title">
          <SectionHead id="know-title">{visitLabels.goodToKnow}</SectionHead>
          <ol className="walk__stops">
            {stops.map((stop, i) => (
              <li key={stop.label} id={stop.id} className="stop" data-photo={stop.photos ? "" : undefined}>
                <Doodle name={stop.art} className="stop__art" />
                <div className="stop__text">
                  <h3 className="stop__title">{stop.label}</h3>
                  {stop.tag ? <span className="tag-sky">{stop.tag}</span> : null}
                  <p>{stop.text}</p>
                  {stop.link}
                </div>
                {stop.photos ? (
                  <div className="photo-pair stop__photo">
                    {stop.photos.map((id) => (
                      <PhotoFrame key={id} id={id} ratio="4/5" sizes="(min-width: 1024px) 230px, 50vw" />
                    ))}
                  </div>
                ) : null}
                {i < stops.length - 1 ? <Doodle name="trail" className="stop__trail" /> : null}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </PageWipe>
  );
}
