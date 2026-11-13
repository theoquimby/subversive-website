// Where it comes from (spec §6.1.7): New York State drawn as one monoline, the way Max's
// New York Nectar label draws it, the sources as small rings, Catskill marked with the
// barley mark, the 2018 barn in Livingston as a hollow ring. Lines draw from each source
// toward Catskill when the map comes into view (StampIn sets data-draw). One image to
// assistive tech, its title naming every place.
import { homeLabels } from "@content/microcopy";
import { BARLEY_VIEWBOX, KERNELS } from "./BarleyMark";
import { NY_PATH, NY_PLACES, NY_VIEWBOX } from "./ny-map.generated";

type PlaceId = (typeof NY_PLACES)[number]["id"];

// label placement, by hand, so the Catskill cluster reads (anchor, dx, dy in map units)
const LABEL: Record<PlaceId, { anchor: "start" | "end"; dx: number; dy: number }> = {
  catskill: { anchor: "start", dx: 30, dy: 2 },
  "hudson-falls": { anchor: "start", dx: 16, dy: 7 },
  cairo: { anchor: "end", dx: -16, dy: -6 },
  altamont: { anchor: "end", dx: -16, dy: 7 },
  hammondsport: { anchor: "start", dx: 0, dy: 34 },
  livingston: { anchor: "start", dx: 18, dy: 40 },
};

const catskill = NY_PLACES.find((p) => p.id === "catskill") as (typeof NY_PLACES)[number];

/** A gentle arc from a source to Catskill, bowing to one side. */
function arc(x: number, y: number): string {
  const mx = (x + catskill.x) / 2;
  const my = (y + catskill.y) / 2;
  const dx = catskill.x - x;
  const dy = catskill.y - y;
  const bow = 0.18;
  return `M${x} ${y}Q${Math.round(mx - dy * bow)} ${Math.round(my + dx * bow)} ${catskill.x} ${catskill.y}`;
}

export function NyMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox={NY_VIEWBOX}
      className={["ny-map", className ?? ""].filter(Boolean).join(" ")}
      role="img"
      data-draw=""
    >
      <title>{homeLabels.mapTitle}</title>
      <path d={NY_PATH} className="ny-map__state" />
      {NY_PLACES.filter((p) => p.kind === "source").map((p, i) => (
        <path
          key={`line-${p.id}`}
          d={arc(p.x, p.y)}
          className="ny-map__line"
          pathLength={1}
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      {NY_PLACES.map((p) => {
        const l = LABEL[p.id];
        return (
          <g key={p.id} className="ny-map__place" data-kind={p.kind}>
            {p.kind === "taproom" ? (
              <svg
                x={p.x - 9}
                y={p.y - 26}
                width="18"
                height="51"
                viewBox={BARLEY_VIEWBOX}
                className="ny-map__mark"
              >
                {KERNELS.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
            ) : (
              <circle cx={p.x} cy={p.y} r={p.kind === "origin" ? 8 : 6} className="ny-map__dot" />
            )}
            <text x={p.x + l.dx} y={p.y + l.dy} textAnchor={l.anchor} className="ny-map__label">
              {p.label}
              {p.kind === "origin" ? <tspan className="ny-map__year"> {homeLabels.since}</tspan> : null}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
