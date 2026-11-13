// The hero glass (direction contract: "one glass drawn in the label's gold line, filled
// with a real beer in its real colour"). Their own stemmed glass, as in the photographs:
// a tall tapered bowl, a short stem with a knop, a round foot, the barley mark printed on
// the bowl. One thin gold line, nothing shaded.
//
// The pour: what was in the glass drains, a thin stream falls from the rim inside the
// bowl, and the new beer rises with its head riding on it. On arrival the glass is empty
// and fills the same way. The moving pieces are keyed by `pour`, so each change replays
// the CSS animation. All motion is transform and opacity inside one small SVG.
import type { CSSProperties } from "react";
import { BARLEY_VIEWBOX, KERNELS } from "../graphics/BarleyMark";

// Drawn on x 38–162, y 0–321; the foot touches the bottom edge, so the glass stands on a
// rule. The bowl's inside edge (the liquid's clip) sits a few units in.
const BOWL =
  "M43.4 14C45.7 96 52.8 176 59.9 212C64.6 236 81.1 248 100 248C118.9 248 135.4 236 140.1 212C147.2 176 154.3 96 156.6 14";
const INSIDE =
  "M49.3 16C51.6 96 58.7 176 65.8 210C69.3 231 83.5 243 100 243C116.5 243 130.7 231 134.2 210C141.3 176 148.4 96 150.7 16Z";
const LEVEL = 48; // a full pour's liquid line
const FLOOR = 246;
// the head: a band whose top edge is five soft crowns
const FOAM = `M30 ${LEVEL + 2}V${LEVEL - 14}q14 -10 28 -1q13 -11 27 -1q15 -11 30 0q13 -10 27 0q14 -9 28 2V${LEVEL + 2}z`;

export interface GlassBeer {
  color: string;
  hazy?: boolean;
}

function Beer({ beer }: { beer: GlassBeer }) {
  return (
    <>
      <path d={FOAM} className="lglass__foam" />
      <rect x="30" y={LEVEL} width="140" height={FLOOR - LEVEL + 40} fill={beer.color} />
      {beer.hazy ? (
        <rect x="30" y={LEVEL} width="140" height={FLOOR - LEVEL + 40} className="lglass__haze" />
      ) : null}
    </>
  );
}

export function LabelGlass({
  beer,
  under,
  pour,
  className,
}: {
  beer: GlassBeer;
  /** what was in the glass before this pour; absent on the first one */
  under?: GlassBeer;
  /** changes with every pour, so the moving pieces remount and their animations replay */
  pour: number | string;
  className?: string;
}) {
  // how far the liquid travels: from below the bowl's floor to a full pour
  const rise = { "--rise": `${FLOOR - LEVEL + 22}px` } as CSSProperties;
  return (
    <svg
      viewBox="38 0 124 321"
      className={className ? `lglass ${className}` : "lglass"}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="lglass-inside">
          <path d={INSIDE} />
        </clipPath>
      </defs>

      <g clipPath="url(#lglass-inside)">
        {under ? (
          <g key={`u-${pour}`} className="lglass__drain" style={rise}>
            <Beer beer={under} />
          </g>
        ) : null}
        {/* the stream: falls from the rim to the surface while the pour runs */}
        <rect
          key={`s-${pour}`}
          x="97.5"
          y="16"
          width="5"
          height={FLOOR - 16}
          fill={beer.color}
          className={under ? "lglass__stream lglass__stream--after" : "lglass__stream"}
        />
        <g
          key={`p-${pour}`}
          className={under ? "lglass__pour lglass__pour--after" : "lglass__pour"}
          style={rise}
        >
          <Beer beer={beer} />
          <g className="lglass__bubbles">
            <circle cx="82" cy="226" r="1.8" />
            <circle cx="110" cy="232" r="1.4" />
            <circle cx="96" cy="218" r="1.2" />
            <circle cx="122" cy="222" r="1.7" />
            <circle cx="72" cy="206" r="1.3" />
          </g>
        </g>
      </g>

      {/* the barley mark, printed on the bowl as on their glassware */}
      <svg x="85" y="92" width="30" height="85" viewBox={BARLEY_VIEWBOX} className="lglass__mark">
        {KERNELS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>

      <g className="lglass__line">
        <path d={BOWL} />
        <ellipse cx="100" cy="14" rx="56.6" ry="4.5" />
        <path d="M100 248V300" />
        <ellipse cx="100" cy="264" rx="7" ry="4.5" />
        <path d="M100 298C100 306 82 309 56 312" />
        <path d="M100 298C100 306 118 309 144 312" />
        <ellipse cx="100" cy="314" rx="46" ry="6" />
      </g>
      {/* one highlight down the bowl's left side */}
      <path d="M58.7 44C59.9 96 65.8 160 71.7 196" className="lglass__shine" />
    </svg>
  );
}
