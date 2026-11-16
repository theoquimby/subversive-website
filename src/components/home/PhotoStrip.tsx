// A row of photographs of the place (owner's request, 2026-11-16): on a phone a row pushed
// along with a finger, each photo about 70% of the screen with the next one peeking; on a
// wide screen all of them in one row, the first larger. Each is a button that opens it
// large (Lightbox). The thumbnails are rendered here, on the server; the client part only
// listens for the press and draws the large view.
import { galleryLabels } from "@content/microcopy";
import { type PhotoId, photos } from "@content/photos";
import Image from "next/image";
import { Lightbox } from "./Lightbox";

export function PhotoStrip({ ids }: { ids: readonly PhotoId[] }) {
  const items = ids.map((id) => ({ id, src: photos[id].src, alt: photos[id].alt }));
  return (
    <Lightbox items={items}>
      <ul className="gallery" aria-label={galleryLabels.group}>
        {ids.map((id, i) => {
          const p = photos[id];
          return (
            <li key={id} className="gallery__item">
              <button
                type="button"
                className="gallery__thumb photo"
                data-photo={i}
                aria-label={galleryLabels.open(p.alt)}
                aria-haspopup="dialog"
              >
                <Image
                  src={p.src}
                  alt=""
                  sizes={i === 0 ? "(min-width: 64rem) 360px, 70vw" : "(min-width: 64rem) 180px, 70vw"}
                  fill
                  placeholder="blur"
                  loading="eager"
                  style={{ objectFit: "cover", objectPosition: `${p.focal[0]}% ${p.focal[1]}%` }}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </Lightbox>
  );
}
