// /visit (redesign 2026-11-15): "Find us", in the order a visitor needs it. The taproom
// drawn in pen beside the title and the open-now line; the address with Directions (the
// page's one primary action) and Call; the week's hours with the special dates beneath;
// a walk through what to know before coming, in the site's own words, with a picture at
// every stop. Contact lives in the footer on every page, so it is not repeated here.
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
import { Fetch } from "@/components/visit/Fetch";
import { Firepit } from "@/components/visit/Firepit";
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
  // Every stop has one picture, all of a size (2026-11-16, Max: the stops without photos
  // "looked weird"): the place seen two ways, one wide photograph, or the fetch strip in a
  // frame of its own. Each photograph once on the page. Not here: building-dusk and
  // bar-stools, which show the old "Malting" name (spec O10).
  const stops: {
    id?: string;
    /** the stop's drawing; the tent is heated, so its drawing is the fire */
    art: DoodleName | "firepit";
    label: string;
    text: string;
    link?: React.ReactNode;
    pic: { pair: [PhotoId, PhotoId] } | { wide: PhotoId } | { play: React.ReactNode };
  }[] = [
    {
      art: "table",
      label: visitLabels.seating,
      text: site.visit.seating,
      // the garden full at dusk, and after dark
      pic: { pair: ["garden-dusk", "beer-garden-night"] },
    },
    {
      art: "firepit",
      label: visitLabels.tent,
      text: site.visit.tent,
      pic: { pair: ["heated-tent", "tent-inside"] },
    },
    {
      art: "car",
      label: visitLabels.parking,
      text: site.visit.parking,
      // the open gravel, cars along the street beyond; the front you walk up to
      pic: { pair: ["garden-day", "front-day"] },
    },
    {
      art: "dog",
      label: visitLabels.dogs,
      text: site.visit.dogs,
      pic: { play: <Fetch /> },
    },
    {
      id: "gift-cards",
      art: "gift",
      label: visitLabels.giftCards,
      text: site.visit.giftCards,
      link: <ExternalLink href={site.links.eGiftCard}>{visitLabels.eGiftCards}</ExternalLink>,
      // the taproom, where the cards are sold
      pic: { wide: "taproom-tables" },
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
            drawing, the site's own sentence, and its picture */}
        <section className="walk" aria-labelledby="know-title">
          <SectionHead id="know-title">{visitLabels.goodToKnow}</SectionHead>
          <ol className="walk__stops">
            {stops.map((stop, i) => (
              <li key={stop.label} id={stop.id} className="stop">
                <div className="stop__words">
                  {stop.art === "firepit" ? (
                    <Firepit className="stop__art" />
                  ) : (
                    <Doodle name={stop.art} className="stop__art" />
                  )}
                  <h3 className="stop__title">{stop.label}</h3>
                  <p className="stop__text">{stop.text}</p>
                  {stop.link}
                </div>
                {"pair" in stop.pic ? (
                  <div className="photo-pair stop__pic">
                    {stop.pic.pair.map((id) => (
                      <PhotoFrame key={id} id={id} ratio="4/5" sizes="(min-width: 1024px) 230px, 45vw" />
                    ))}
                  </div>
                ) : "wide" in stop.pic ? (
                  <PhotoFrame
                    id={stop.pic.wide}
                    ratio="16/10"
                    className="stop__pic stop__pic--wide"
                    sizes="(min-width: 1024px) 480px, 90vw"
                  />
                ) : (
                  <div className="stop__pic stop__pic--play">{stop.pic.play}</div>
                )}
                {i < stops.length - 1 ? <Doodle name="trail" className="stop__trail" /> : null}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </PageWipe>
  );
}
