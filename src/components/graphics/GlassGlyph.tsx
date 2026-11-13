// Glass glyph (spec §4.4, §2.2): a pint drawn in the icon stroke, filled to `fill` with the
// beer's own colour under a card-coloured head. Hazy beers get a 12% card veil. The hero size
// carries a small barley mark printed on the glass and draws its stroke with the drawing;
// the glyph size keeps a 2 px stroke at any scale. `rise` pours it in from the bottom.
// Decorative: style and ABV are always in text next to it (spec §9.2).
import { BARLEY_VIEWBOX, KERNELS } from "./BarleyMark";

// A tapered pint on a 24 × 32 grid: rim 3–21 at y 2, base 5–19 at y 30.
const OUTLINE = "M3 2 5 30h14l2-28";
const INSIDE = "M4.1 2.5 5.95 29h12.1L19.9 2.5z";
const BOTTOM = 29;
const TOP = 5; // a full pour's liquid line; the head sits above it

export function GlassGlyph({
  color,
  fill = 1,
  hazy = false,
  size = "glyph",
  rise = false,
  className,
}: {
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
  const clipId = `glass-${size}`;
  return (
    <svg
      viewBox="0 0 24 32"
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
          <rect x="0" y={level} width="24" height={BOTTOM - level + 1} fill={color} />
          {hazy ? (
            <rect x="0" y={level} width="24" height={BOTTOM - level + 1} className="glass__haze" />
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
      {size === "hero" ? (
        <svg x="9.9" y="11" width="4.2" height="11.9" viewBox={BARLEY_VIEWBOX} className="glass__mark">
          {KERNELS.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      ) : null}
      <path d={OUTLINE} className="glass__outline" />
    </svg>
  );
}
