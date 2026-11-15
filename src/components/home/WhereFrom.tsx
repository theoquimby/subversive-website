// The "where it comes from" map with its data: used on Home and on Our beer. Each source
// in the site's sourcing list is placed on the drawn map from its latitude and longitude,
// so a supplier added as data (later, from Ops) appears with no drawing work. A source
// with no location, or one outside the drawing, counts as statewide.
//
// Each source may also carry a detail view: a photograph, a few sentences, a link. It opens
// under the source when it is chosen. TODO(Max): the sentences and photographs for each
// supplier; only the grain photograph is on hand, so only Grain opens today.
import { homeLabels } from "@content/microcopy";
import { type PhotoId, photos } from "@content/photos";
import { mapFeatures } from "@/lib/map/features";
import { projectNY } from "@/lib/map/project";
import type { Site } from "@/lib/site/schema";
import { PhotoFrame } from "../graphics/PhotoFrame";
import { ExternalLink } from "../ui/TextLink";
import { SourceMap } from "./SourceMap";

export function WhereFrom({ sourcing }: { sourcing: Site["sourcing"] }) {
  const stops = sourcing.map(({ what, who, where, geo, photo, about, url }) => {
    const at = geo ? projectNY(geo.lat, geo.lng) : null;
    const hasPhoto = photo !== undefined && photo in photos;
    return {
      what,
      who,
      where,
      place: at?.onMap ? { label: where.split(",")[0]?.trim() ?? where, x: at.x, y: at.y } : null,
      detail:
        hasPhoto || about || url ? (
          <>
            {hasPhoto ? (
              <PhotoFrame
                id={photo as PhotoId}
                ratio="16/10"
                sizes="(min-width: 1024px) 420px, 100vw"
                // no scroll reveal: this photo is added on a click, after the page's
                // reveal observer has run, and would stay hidden waiting for it
                reveal={false}
              />
            ) : null}
            {about ? <p className="smap__about">{about}</p> : null}
            {url ? <ExternalLink href={url}>{homeLabels.supplierSite}</ExternalLink> : null}
          </>
        ) : null,
    };
  });
  return <SourceMap stops={stops} features={mapFeatures()} />;
}
