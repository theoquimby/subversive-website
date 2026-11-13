// Menu row (spec §4.4): glass · name and badge · meta · description · tags, price at right
// in a column that does not shift. A row with more to say (a long description or
// modifiers) is a <details> (plan Q20): it opens with no JavaScript, and nothing of the
// browser's look remains. Short rows are plain, so no tap opens nothing.
import { menuLabels } from "@content/microcopy";
import type { CSSProperties } from "react";
import { isBeer } from "@/lib/menu/kinds";
import { formatPair, formatPrice } from "@/lib/menu/price";
import type { ItemView } from "@/lib/menu/view";
import { Badge } from "../graphics/Badge";
import { GlassGlyph } from "../graphics/GlassGlyph";

/** Above this a description can run past two lines on a phone; the client refines it. */
const LONG = 80;

export function rowPrice(row: ItemView): string | undefined {
  const { item } = row;
  if (isBeer(item)) return formatPair(item.prices.half, item.prices.full);
  return item.price === undefined ? undefined : formatPrice(item.price);
}

export function MenuRow({
  row,
  index,
  disclosure = true,
}: {
  row: ItemView;
  index: number;
  disclosure?: boolean;
}) {
  const { item } = row;
  const beer = isBeer(item);
  const meta = beer
    ? `${item.style} · ${item.abv.toFixed(1)}%`
    : [item.producer, item.origin].filter(Boolean).join(" · ");
  const price = rowPrice(row);
  const opens = disclosure && (!!item.modifiers || (item.description?.length ?? 0) > LONG);

  const body = (
    <>
      {beer ? (
        <span className="mrow__glass">
          <GlassGlyph color={item.color} fill={0.78} hazy={item.hazy} />
        </span>
      ) : null}
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
    </>
  );

  return (
    <li
      className="mrow"
      data-row={row.id}
      data-pour={beer ? "" : undefined}
      style={{ "--i": Math.min(index, 8) } as CSSProperties}
    >
      {opens ? (
        <details id={row.id} className="mrow__box">
          <summary className="mrow__sum">
            {body}
            <span className="mrow__toggle" aria-hidden="true" />
          </summary>
          {item.modifiers ? <p className="mrow__more">{item.modifiers}</p> : null}
        </details>
      ) : (
        <div id={row.id} className="mrow__box">
          <div className="mrow__sum">{body}</div>
          {item.modifiers ? <p className="mrow__more">{item.modifiers}</p> : null}
        </div>
      )}
    </li>
  );
}
