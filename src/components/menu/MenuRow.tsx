// Menu row (spec §4.4; review pass 2026-11-15): name and badge, meta, the whole
// description, tags, and the price at right in a column that does not shift. One kind of
// row for everything, sauces included. On the menu page the whole row is a link that opens
// the item's detail view (ItemSheet reads the row, so nothing is sent twice); elsewhere it
// is plain. The small glass left the row: the glass is in the detail view.
import { menuLabels } from "@content/microcopy";
import { type PhotoId, photos } from "@content/photos";
import type { CSSProperties } from "react";
import { isBeer } from "@/lib/menu/kinds";
import { formatPair, formatPrice } from "@/lib/menu/price";
import type { ItemView } from "@/lib/menu/view";
import { Badge } from "../graphics/Badge";

export function rowPrice(row: ItemView): string | undefined {
  const { item } = row;
  if (isBeer(item)) return formatPair(item.prices.half, item.prices.full);
  return item.price === undefined ? undefined : formatPrice(item.price);
}

/** The photo's address through the image optimiser, at the detail view's width. */
function photoOf(id: string | undefined) {
  if (!id || !(id in photos)) return undefined;
  const p = photos[id as PhotoId];
  const src = typeof p.src === "string" ? p.src : p.src.src;
  return { src: `/_next/image?url=${encodeURIComponent(src)}&w=828&q=75`, alt: p.alt };
}

export function MenuRow({
  row,
  index,
  detail = false,
}: {
  row: ItemView;
  index: number;
  /** the row opens the item's detail view (the menu page only) */
  detail?: boolean;
}) {
  const { item } = row;
  const beer = isBeer(item);
  const meta = beer
    ? `${item.style} · ${item.abv.toFixed(1)}%`
    : [item.producer, item.origin].filter(Boolean).join(" · ");
  const price = rowPrice(row);
  const photo = detail ? photoOf(item.photo) : undefined;

  const inner = (
    <>
      <span className="mrow__sum">
        <span className="mrow__main">
          <span className="mrow__name">{item.name}</span>
          {meta || row.badge ? (
            <span className="mrow__line">
              {meta ? <span className="mrow__meta">{meta}</span> : null}
              {row.badge ? <Badge>{row.badge}</Badge> : null}
            </span>
          ) : null}
          {item.description ? <span className="mrow__desc">{item.description}</span> : null}
          {item.tags?.length ? (
            <span className="mrow__tags">
              {item.tags.map((t) => (
                <span key={t} className="mtag">
                  {menuLabels.tags[t]}
                </span>
              ))}
            </span>
          ) : null}
        </span>
        {price ? <span className="mrow__price">{price}</span> : null}
      </span>
      {item.modifiers ? <span className="mrow__more">{item.modifiers}</span> : null}
    </>
  );

  return (
    <li
      className="mrow"
      data-row={row.id}
      data-color={detail && beer ? item.color : undefined}
      data-hazy={detail && beer && item.hazy ? "" : undefined}
      data-photo={photo?.src}
      data-photo-alt={photo?.alt}
      style={{ "--i": Math.min(index, 8) } as CSSProperties}
    >
      {detail ? (
        <a id={row.id} className="mrow__box" href={`?item=${encodeURIComponent(row.id)}`} data-item={row.id}>
          {inner}
        </a>
      ) : (
        <div id={row.id} className="mrow__box">
          {inner}
        </div>
      )}
    </li>
  );
}
