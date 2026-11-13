// Home's first screen (direction contract in .impeccable/surfaces: "The label, poured").
// Spruce edge to edge, header included (data-page-skin="label"). The status pill; the
// tap list as one glass the visitor pours (TapHero); the glass standing on a full-width
// gold rule with the Catskill ridge drawn beside it; under the rule the brewery's line
// and the two actions. No photograph here, so the screen paints with the page; no
// game-night takeover (the pill carries it in one line).
import { homeLabels, microcopy } from "@content/microcopy";
import type { Site } from "@/lib/site/schema";
import { Button } from "../ui/Button";
import { OpenNow } from "../visit/OpenNow";
import { type TapBeer, TapHero } from "./TapHero";

export function Hero({ site, beers }: { site: Site; beers: TapBeer[] }) {
  return (
    <section className="hero" data-hero="" data-page-skin="label" aria-labelledby="hero-title">
      <div className="hero__inner">
        <OpenNow className="hero__open" />
        <div className="hero__scene">
          {/* the Catskill ridge, as on the label: one line along the horizon, drawn once */}
          <svg viewBox="0 0 400 90" className="hero__ridge" aria-hidden="true" focusable="false">
            <path d="M0 90L38 70L62 78L118 34L140 50L176 18L214 52L236 44L292 74L318 66L400 90" />
          </svg>
          <TapHero beers={beers} />
        </div>
        <div className="hero__foot">
          <h1 id="hero-title" className="hero__line">
            {homeLabels.subline(site.address.street)}
          </h1>
          <div className="hero__actions">
            <Button href="/menu">{microcopy.seeTheMenu}</Button>
            <Button href={site.links.map} external variant="quiet">
              {microcopy.directions}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
