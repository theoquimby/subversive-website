// Glass glyph (spec §4.4, §2.2): their own stemmed glass, as in the photographs, drawn in
// the icon stroke and filled to `fill` with the beer's colour under a card-coloured head.
// Hazy beers get a 12% card veil. The hero size carries the barley printed on the bowl and
// scales its stroke with the drawing; the glyph keeps a 2 px stroke at any size. `rise`
// pours it from the bottom. Decorative: style and ABV are always in text beside it (§9.2).
import { BARLEY_VIEWBOX, KERNELS } from "./BarleyMark";

// On a 24 × 38 grid: a tall bowl (rim 6–18 at y 2) narrowing to a rounded base at y 29.5,
// a short stem and a flat foot. The spec says "pint"; the photographs show this stemmed
// glass with the barley on the bowl, so the glyph draws what they actually pour into.
// The stem carries a small knop (as on their glassware) and the foot is drawn twice for weight.
const OUTLINE = "M6 2l1.6 23.4Q8 29.5 12 29.5t4.4-4.1L18 2M12 29.5V36M10.7 32.6h2.6M7 36h10M8 37h8";
const INSIDE = "M7.1 2.5 8.6 25.3Q9 28.4 12 28.4t3.4-3.1L16.9 2.5z";
const BOTTOM = 28.5;
const TOP = 6; // a full pour's liquid line; the head sits above it

export function GlassGlyph({
  color,
  fill = 1,
  hazy = false,
  size = "glyph",
  rise = false,
  mark = true,
  className,
}: {
  /** Hero size only: print the barley on the bowl. */
  mark?: boolean;
  color: string;
  fill?: number;
  hazy?: boolean;
  size?: "glyph" | "hero";
  rise?: boolean;
  className?: string;
}) {
  const f = Math.max(0, Math.min(1, fill));
  const level = BOTTOM - f * (BOTTOM - TOP);
  const head = Math.min(2.6, f * 2.6);
  const clipId = `glass-${size}-${color.replace(/\W/g, "")}-${Math.round(f * 100)}${hazy ? "h" : ""}`;
  return (
    <svg
      viewBox="0 0 24 38"
      className={["glass", `glass--${size}`, rise ? "glass--rise" : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={INSIDE} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <g className="glass__pour" style={{ "--level": `${BOTTOM - level}px` } as React.CSSProperties}>
          <rect x="0" y={level} width="24" height={BOTTOM - level + 4} fill={color} />
          {hazy ? (
            <rect x="0" y={level} width="24" height={BOTTOM - level + 4} className="glass__haze" />
          ) : null}
          {head > 0 ? (
            // the head: a band of foam whose top domes slightly between the walls
            <path
              className="glass__head"
              d={`M0 ${level + 0.6}V${level - head + 0.9}Q12 ${level - head - 0.5} 24 ${level - head + 0.9}V${level + 0.6}z`}
            />
          ) : null}
        </g>
      </g>
      {size === "hero" && mark ? (
        // the print spans about 60% of the bowl, as on the real glass (M1 review)
        <svg x="9.15" y="7.5" width="5.7" height="16.2" viewBox={BARLEY_VIEWBOX} className="glass__mark">
          {KERNELS.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      ) : null}
      <path d={OUTLINE} className="glass__outline" />
    </svg>
  );
}
