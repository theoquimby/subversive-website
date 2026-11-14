// Home's first screen. On the menu's cream paper, in its ink and its fat serif (Theo,
// 2026-11-13: the all-green label look read too high-brow; green is now only the ridge).
// The status pill; the
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
    <section className="hero" data-hero="" data-skin="paper" aria-labelledby="hero-title">
      <div className="hero__inner">
        <OpenNow className="hero__open" />
        <div className="hero__scene">
          <TapHero beers={beers} />
        </div>
        <div className="hero__foot">
          <h1 id="hero-title" className="hero__line">
            {homeLabels.subline(site.address.street)}
          </h1>
          <div className="hero__actions">
            <Button href="/menu">{microcopy.seeTheMenu}</Button>
            <Button href={site.links.map} external variant="secondary">
              {microcopy.directions}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
