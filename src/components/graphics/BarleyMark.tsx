// Barley mark (spec §3.1): six outlined parallelograms alternating off a centre stem, as
// printed on their glassware. Each kernel is its own path so it can draw in, bottom to
// top, 60 ms apart (the `draw` prop; CSS in graphics.css).

/**
 * Kernel paths, listed bottom to top (draw order). viewBox 0 0 60 170.
 * Proportions measured from the legacy mark (docs/source/legacy/barley-mark-legacy.webp):
 * each kernel is 22 wide with 25.5 tall vertical sides and a 12.5 slant (29.6° from
 * horizontal, i.e. the 61° cut measured from the stem); kernels meet end to end, so their
 * inner edges draw one continuous stem. The spec §3.1 starting redraw was squatter and its
 * kernels overlapped.
 */
export const KERNELS = [
  "M30 142l22-12.5v25.5L30 167.5z", // right, lowest
  "M30 116.5 8 104v25.5l22 12.5z", // left
  "M30 91l22-12.5v25.5L30 116.5z", // right
  "M30 65.5 8 53v25.5l22 12.5z", // left
  "M30 40l22-12.5v25.5L30 65.5z", // right
  "M30 14.5 8 2v25.5l22 12.5z", // left, highest
] as const;

export const BARLEY_VIEWBOX = "0 0 60 170";

interface Props {
  variant?: "stroke" | "solid";
  /** Draw the kernels in on mount (gate, loading). */
  draw?: boolean;
  /** Give a title when the mark carries meaning on its own; otherwise it is decorative. */
  title?: string;
  className?: string;
}

export function BarleyMark({ variant = "stroke", draw = false, title, className }: Props) {
  const solid = variant === "solid";
  return (
    <svg
      viewBox={BARLEY_VIEWBOX}
      className={["barley", draw ? "barley--draw" : "", className ?? ""].filter(Boolean).join(" ")}
      fill={solid ? "currentColor" : "none"}
      stroke={solid ? "none" : "currentColor"}
      strokeWidth={3}
      strokeLinejoin="miter"
      shapeRendering="geometricPrecision"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {KERNELS.map((d, i) => (
        <path key={d} d={d} pathLength={1} style={{ "--i": i } as React.CSSProperties} />
      ))}
    </svg>
  );
}
