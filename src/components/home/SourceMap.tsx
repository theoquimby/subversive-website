"use client";

// "Where it comes from": New York State in one ink line, and the things on the menu that
// come from it. Pick a source (tap it in the list, tap its town on the map, or hover) and
// the map goes there: it zooms in on the town and the taproom, and a wandering pen line
// draws the road between them. The two statewide sources (grain, spirits) pull back to
// the whole state and light it. Only one town is ever labelled at a time.
//
// The zoom is a transform on one group (the "camera"); everything drawn in map units is
// scaled back down by the same factor, so dots, names and the road keep their size on
// screen however far in the map is.
//
// Every word comes from site.json. The list alone carries all the information; the map
// is hidden from assistive tech.
import { type CSSProperties, type ReactNode, useState } from "react";
import type { MapFeatures } from "@/lib/map/features";
import { BARLEY_VIEWBOX, KERNELS } from "../graphics/BarleyMark";
import { NY_PATH, NY_PLACES, NY_VIEWBOX } from "../graphics/ny-map.generated";

/** A source as the page hands it over: already placed on the map, or statewide (null). */
export interface Stop {
  what: string;
  who: string;
  where: string;
  place: { label: string; x: number; y: number } | null;
  /** the detail view (a photograph, a few sentences, a link), rendered by the page */
  detail?: ReactNode;
}
type Place = { x: number; y: number };

// The little drawings, each on its own small sheet centred on 0,0 (map units).
const DECOR: Record<string, string[]> = {
  peaks: ["M-34 14L-18 -10L-10 2L4 -20L18 4L24 -6L36 14", "M-2 -12L4 -6L9 -12", "M-22 -3L-18 2L-14 -3"],
  waves: ["M-26 -4C-20 -11 -14 -11 -8 -4S4 3 10 -4S22 -11 28 -4", "M-16 8C-10 1 -4 1 2 8S14 15 20 8"],
  boat: ["M-11 4H11L7 10H-7Z", "M0 4V-13L10 2Z", "M-16 15C-11 11 -6 11 -1 15S9 19 14 15"],
  trees: [
    "M-14 12V2M-14 2L-21 4L-14 -12L-7 4Z",
    "M8 12V4M8 4L0 6L8 -10L16 6Z",
    "M-3 12V7M-3 7L-8 8L-3 -3L2 8Z",
  ],
};

const W = 1000;
const H = 774;
// far enough in to separate the Hudson Valley towns, not so far that the state is lost
const MAX_ZOOM = 2.7;

const catskill = NY_PLACES.find((p) => p.id === "catskill") as (typeof NY_PLACES)[number];

/** The camera for a town: frame it and the taproom with room around them. */
function camera(p: Place | null) {
  if (!p) return { s: 1, x: 0, y: 0 };
  const w = Math.abs(p.x - catskill.x);
  const h = Math.abs(p.y - catskill.y);
  const pad = Math.max(70, Math.max(w, h) * 0.55);
  const s = Math.min(MAX_ZOOM, W / (w + pad * 2), H / (h + pad * 2));
  const cx = (p.x + catskill.x) / 2;
  const cy = (p.y + catskill.y) / 2;
  return { s, x: W / 2 - s * cx, y: H / 2 - s * cy };
}

/** The road from a town to the taproom, drawn by hand: it wanders a little either side
    of the straight line and stops just short of the mark. `k` is the on-screen unit. */
function road(p: Place, k: number): string {
  const dx = catskill.x - p.x;
  const dy = catskill.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const stop = 1 - Math.min(0.4, (26 * k) / len);
  const at = (t: number, off: number) =>
    `${(p.x + dx * t * stop + nx * off * len).toFixed(1)} ${(p.y + dy * t * stop + ny * off * len).toFixed(1)}`;
  return `M${at(0, 0)}Q${at(0.12, 0.1)} ${at(0.28, 0.07)}T${at(0.55, -0.05)}T${at(0.8, 0.045)}T${at(1, 0)}`;
}

// Data-driven: the page gives a list of stops, each placed from its latitude and longitude
// (src/lib/map/project.ts) or marked statewide. Nothing here knows any town by name, so a
// new supplier needs no change to this file. Only this short list crosses to the browser,
// never the whole site object (the no-malting test once caught that).
export function SourceMap({ stops, features }: { stops: Stop[]; features: MapFeatures }) {
  const items = stops;
  // start on the first source that has a town, so the map opens with a road on it
  const [at, setAt] = useState(() =>
    Math.max(
      0,
      items.findIndex((i) => i.place),
    ),
  );
  // Which source's detail view is open. Hovering or tabbing through the list only moves
  // the map; a detail opens on a click or tap, so the list never jumps under a pointer.
  const [open, setOpen] = useState<number | null>(null);
  const sel = items[at];
  if (!sel) return null;
  const cam = camera(sel.place);
  const k = 1 / cam.s;
  // the town's name sits on the side away from the taproom
  const left = sel.place ? sel.place.x <= catskill.x : false;

  return (
    <div className="smap">
      <div className="smap__map">
        <svg viewBox={NY_VIEWBOX} className="smap__svg" aria-hidden="true" focusable="false">
          <g
            className="smap__cam"
            style={
              {
                transform: `translate(${cam.x.toFixed(1)}px, ${cam.y.toFixed(1)}px) scale(${cam.s.toFixed(3)})`,
                "--k": k.toFixed(4),
              } as CSSProperties
            }
          >
            {/* the pen's wobble: one small displacement over everything drawn as geography,
                so the accurate outline reads as drawn by hand */}
            <filter id="smap-wobble" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="9" />
            </filter>
            <g className="smap__land">
              <path d={NY_PATH} className="smap__state" data-all={sel.place ? undefined : ""} />
              {/* landmarks, kept inside the state's outline: the main roads, thin and dashed,
                and the Hudson */}
              <clipPath id="smap-ny">
                <path d={NY_PATH} />
              </clipPath>
              <g clipPath="url(#smap-ny)">
                {features.roads.map((d) => (
                  <path key={d} d={d} className="smap__road" />
                ))}
                <path d={features.river} className="smap__river" />
              </g>
              {/* mountains, water, a boat: drawn where the real ones are */}
              {features.decor.map((d) => (
                <g
                  key={`${d.kind}-${d.x}-${d.y}`}
                  className="smap__decor"
                  transform={`translate(${d.x} ${d.y})`}
                >
                  {(DECOR[d.kind] ?? []).map((path) => (
                    <path key={path} d={path} />
                  ))}
                </g>
              ))}
            </g>
            {sel.place ? (
              <path key={sel.what} d={road(sel.place, k)} className="smap__route" pathLength={1} />
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
                    r={44 * k}
                    className="smap__hit"
                    onClick={() => setAt(i)}
                    onPointerEnter={() => setAt(i)}
                  />
                </g>
              ) : null,
            )}
            {sel.place ? (
              <text
                key={`l-${sel.what}`}
                x={sel.place.x + (left ? -26 : 26) * k}
                y={sel.place.y + 12 * k}
                textAnchor={left ? "end" : "start"}
                className="smap__label"
              >
                {sel.place.label}
              </text>
            ) : null}
            {/* the taproom: the barley mark, small, always named */}
            <svg
              x={catskill.x - 8 * k}
              y={catskill.y - 23 * k}
              width={16 * k}
              height={46 * k}
              viewBox={BARLEY_VIEWBOX}
              className="smap__mark"
            >
              {KERNELS.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>
            <text x={catskill.x + 20 * k} y={catskill.y + 12 * k} className="smap__label smap__label--home">
              {catskill.label}
            </text>
          </g>
        </svg>
      </div>

      <ul className="smap__list">
        {items.map((it, i) => (
          <li key={it.what}>
            <button
              type="button"
              className="smap__row"
              aria-pressed={i === at}
              aria-expanded={it.detail ? i === open : undefined}
              onClick={() => {
                setAt(i);
                setOpen(open === i ? null : i);
              }}
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
            {/* the detail view: opens under the chosen source, when it has one */}
            {it.detail && i === open ? <div className="smap__detail">{it.detail}</div> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
