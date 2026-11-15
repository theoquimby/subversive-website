"use client";

// "Where it comes from": New York State in one ink line, and the things on the menu that
// come from it. Pick a source (tap it in the list, tap its town on the map, or hover) and
// the map answers: the town lights up, a line runs from it to the taproom in Catskill, and
// its name is set beside it. The two statewide sources (grain, spirits) light the whole
// state. Only one town is ever labelled at a time, so the map never becomes a tangle.
//
// Every word comes from site.json. The list alone carries all the information; the map
// is hidden from assistive tech.
import { useState } from "react";
import type { Site } from "@/lib/site/schema";
import { BARLEY_VIEWBOX, KERNELS } from "../graphics/BarleyMark";
import { NY_PATH, NY_PLACES, NY_VIEWBOX } from "../graphics/ny-map.generated";

type Place = (typeof NY_PLACES)[number];

// where each town's name sits, by hand (anchor, dx, dy in map units)
const LABEL: Record<string, { anchor: "start" | "end"; dx: number; dy: number }> = {
  "hudson-falls": { anchor: "end", dx: -28, dy: 12 },
  cairo: { anchor: "end", dx: -28, dy: 12 },
  altamont: { anchor: "end", dx: -28, dy: 12 },
  hammondsport: { anchor: "start", dx: 28, dy: 12 },
};

const catskill = NY_PLACES.find((p) => p.id === "catskill") as Place;

/** A gentle arc from a town to Catskill, bowing to one side. */
function arc(p: Place): string {
  const mx = (p.x + catskill.x) / 2;
  const my = (p.y + catskill.y) / 2;
  const dx = catskill.x - p.x;
  const dy = catskill.y - p.y;
  return `M${p.x} ${p.y}Q${Math.round(mx - dy * 0.2)} ${Math.round(my + dx * 0.2)} ${catskill.x} ${catskill.y}`;
}

// Only the sourcing list crosses to the browser. Passing the whole site object put every
// field of site.json into the page's data, including unpublished text (the no-malting
// test caught it).
export function SourceMap({ sourcing }: { sourcing: Site["sourcing"] }) {
  const items = sourcing.map((s) => ({
    ...s,
    // "Hudson Falls, NY" → the town on the map; "New York State" → the whole state
    place: NY_PLACES.find((p) => p.kind === "source" && s.where.startsWith(p.label)) ?? null,
  }));
  // start on the first source that has a town, so the map opens with a line on it
  const [at, setAt] = useState(() =>
    Math.max(
      0,
      items.findIndex((i) => i.place),
    ),
  );
  const sel = items[at];
  if (!sel) return null;
  const label = sel.place ? LABEL[sel.place.id] : undefined;

  return (
    <div className="smap">
      <div className="smap__map">
        <svg viewBox={NY_VIEWBOX} className="smap__svg" aria-hidden="true" focusable="false">
          <path d={NY_PATH} className="smap__state" data-all={sel.place ? undefined : ""} />
          {sel.place ? (
            <path key={sel.what} d={arc(sel.place)} className="smap__route" pathLength={1} />
          ) : null}
          {items.map((it, i) =>
            it.place ? (
              <g key={it.what} className="smap__town" data-on={i === at ? "" : undefined}>
                <circle cx={it.place.x} cy={it.place.y} r="11" className="smap__dot" />
                {/* a generous target for a thumb */}
                {/* biome-ignore lint/a11y/noStaticElementInteractions: a pointer shortcut; the list's buttons do the same for everyone */}
                <circle
                  cx={it.place.x}
                  cy={it.place.y}
                  r="44"
                  className="smap__hit"
                  onClick={() => setAt(i)}
                  onPointerEnter={() => setAt(i)}
                />
              </g>
            ) : null,
          )}
          {sel.place && label ? (
            <text
              key={`l-${sel.what}`}
              x={sel.place.x + label.dx}
              y={sel.place.y + label.dy}
              textAnchor={label.anchor}
              className="smap__label"
            >
              {sel.place.label}
            </text>
          ) : null}
          {/* the taproom: the barley mark, always named */}
          <svg
            x={catskill.x - 13}
            y={catskill.y - 38}
            width="26"
            height="74"
            viewBox={BARLEY_VIEWBOX}
            className="smap__mark"
          >
            {KERNELS.map((d) => (
              <path key={d} d={d} />
            ))}
          </svg>
          <text x={catskill.x + 30} y={catskill.y + 12} className="smap__label smap__label--home">
            {catskill.label}
          </text>
        </svg>
      </div>

      <ul className="smap__list">
        {items.map((it, i) => (
          <li key={it.what}>
            <button
              type="button"
              className="smap__row"
              aria-pressed={i === at}
              onClick={() => setAt(i)}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setAt(i);
              }}
              onFocus={() => setAt(i)}
            >
              <span className="run__text">
                <span className="run__what">{it.what}</span>
                <span className="run__who">{it.who}</span>
                <span className="run__where">{it.where}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
