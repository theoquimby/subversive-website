// Home hero (spec §6.1.2, §5.3, §5.6). Stack on a phone, a 7/5 split on desktop: the
// open-now pill, "Beer. / Burgers. / Catskill." (the last in ember), the subline, See the
// menu and Order pickup; the photo in its frame with up to two stickers. A game night
// does not take over the first screen (Theo, 11/13): the open-now pill carries it in one
// line, "Open late tonight · Knicks at 7:00".
//
// The pour (§5.3), once per session: the photo is revealed by a rising edge with a band
// of foam riding it. Only clip-path and transform move, so the photo is painted in the
// first frame and LCP is not held back (plan §2 item 8). A pre-paint script marks a
// session that has already seen it, so it never replays on the way back to Home.
import { homeLabels, microcopy } from "@content/microcopy";
import type { SiteEvent } from "@/lib/events/enrich";
import { formatDateShort, weekdayLabel } from "@/lib/hours/format";
import type { Site } from "@/lib/site/schema";
import { weekdayOf } from "@/lib/time/ny";
import { PhotoFrame } from "../graphics/PhotoFrame";
import { Button } from "../ui/Button";
import { OpenNow } from "../visit/OpenNow";
import { HeroStickers } from "./HeroStickers";
import { PourMark } from "./PourMark";

export const POUR_KEY = "sv.poured";
const POURED_SCRIPT = `try{if(sessionStorage.getItem("${POUR_KEY}"))document.documentElement.dataset.poured=""}catch(e){}`;

export function Hero({ site, next, today }: { site: Site; next: SiteEvent | null; today: string }) {
  const [a, b, c] = homeLabels.headline;
  const sticker = next
    ? {
        href: `/events/${next.slug}`,
        // "Tonight" on the day; otherwise the day it falls on (the label carries the rest)
        text: next.date === today ? microcopy.tonight : weekdayLabel(weekdayOf(next.date), "long"),
        label: `${formatDateShort(next.date)} · ${next.displayTitle}`,
      }
    : null;
  return (
    <section className="hero" data-hero="" data-skin="paper" aria-labelledby="hero-title">
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: our own pre-paint flag for the once-per-session pour */}
      <script dangerouslySetInnerHTML={{ __html: POURED_SCRIPT }} />
      <div className="hero__inner">
        <div className="hero__text">
          <OpenNow className="hero__open" />
          <h1 id="hero-title" className="hero__title">
            <span>{a}</span>
            <span>{b}</span>
            <span className="hero__accent">{c}</span>
          </h1>
          <p className="hero__sub">{homeLabels.subline(site.address.street)}</p>
          <div className="hero__actions">
            <Button href="/menu">{microcopy.seeTheMenu}</Button>
            <Button href={site.links.order} external variant="secondary">
              {microcopy.orderPickup}
            </Button>
          </div>
        </div>
        <div className="hero__art">
          <div className="hero__frame hero__frame--day">
            <PhotoFrame
              id="burger-and-beer"
              ratio="4/5"
              priority
              sizes="(min-width: 1024px) 40vw, (min-width: 768px) 60vw, 92vw"
            />
            <span className="hero__foam" aria-hidden="true" />
            <HeroStickers next={sticker} />
          </div>
        </div>
      </div>
      <PourMark />
    </section>
  );
}
