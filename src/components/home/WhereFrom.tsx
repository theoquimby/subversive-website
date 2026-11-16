// The "where it comes from" map with its data, on Our beer. Each source in the site's
// sourcing list is placed on the drawn map from its latitude and longitude, so a supplier
// added as data (later, from Ops) appears with no drawing work. A source with no location,
// or one outside the drawing, counts as statewide. Choosing a source only moves the map:
// the detail view with a photograph was removed on 2026-11-15 (Theo).
import { mapFeatures } from "@/lib/map/features";
import { projectNY } from "@/lib/map/project";
import type { Site } from "@/lib/site/schema";
import { SourceMap } from "./SourceMap";

export function WhereFrom({ sourcing }: { sourcing: Site["sourcing"] }) {
  const stops = sourcing.map(({ what, who, where, geo }) => {
    const at = geo ? projectNY(geo.lat, geo.lng) : null;
    return {
      what,
      who,
      where,
      place: at?.onMap ? { label: where.split(",")[0]?.trim() ?? where, x: at.x, y: at.y } : null,
    };
  });
  return <SourceMap stops={stops} features={mapFeatures()} />;
}
