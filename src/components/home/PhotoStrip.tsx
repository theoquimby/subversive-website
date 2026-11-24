// A row of photographs of the place (owner's request, 2026-11-16): on a phone a row pushed
// along with a finger, each photo about 70% of the screen with the next one peeking; on a
// wide screen all of them in one row, the first larger. Each is a button that opens it
// large (Lightbox). The thumbnails are rendered here, on the server; the client part only
// listens for the press and draws the large view.
import { galleryLabels } from "@content/microcopy";
import { type PhotoId, photos } from "@content/photos";
import Image from "next/image";
import { Lightbox } from "./Lightbox";

export function PhotoStrip({
  ids,
  many = false,
  show,
}: {
  ids: readonly PhotoId[];
  /** more than a handful: on a wide screen an even grid, not one large and four small */
  many?: boolean;
  /** show only the first so many on the page; the rest are in the large view, reached by
   *  the arrows or by the "All n photos" link under the row */
  show?: number;
}) {
  const shown = show ? ids.slice(0, show) : ids;
  const items = ids.map((id) => ({ id, src: photos[id].src, alt: photos[id].alt }));
  return (
    <Lightbox items={items}>
      <ul className={many ? "gallery gallery--many" : "gallery"} aria-label={galleryLabels.group}>
        {shown.map((id, i) => {
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
      {shown.length < ids.length ? (
        <p className="gallery__all">
          <button type="button" className="text-link" data-photo={shown.length} aria-haspopup="dialog">
            {galleryLabels.all(ids.length)}
          </button>
        </p>
      ) : null}
    </Lightbox>
  );
}
