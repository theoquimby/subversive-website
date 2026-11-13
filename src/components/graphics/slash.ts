// The slash (spec §3.1): the wordmark's V, cut at about 61° from horizontal. It is the
// divider in "5 / 8", the wipe angle in page transitions and the cut on ticket stubs.
// One angle, computed here; every slash on the site takes its geometry from this file.

export const SLASH_DEG = 61;
const RAD = (SLASH_DEG * Math.PI) / 180;

export type Point = [number, number];

/** Horizontal run of a slash that rises `height`. */
export function slashRun(height: number): number {
  return height / Math.tan(RAD);
}

/**
 * A right-leaning parallelogram ("/") with horizontal ends, as drawn in an SVG whose
 * y axis points down. Corners: bottom-left, bottom-right, top-right, top-left.
 * The box it occupies is (thickness + run) wide and `height` tall.
 */
export function slashBand({ height, thickness }: { height: number; thickness: number }): Point[] {
  const run = slashRun(height);
  return [
    [0, height],
    [thickness, height],
    [thickness + run, 0],
    [run, 0],
  ];
}

export function toPoints(points: readonly Point[]): string {
  const r = (n: number) => String(Math.round(n * 100) / 100);
  return points.map(([x, y]) => `${r(x)},${r(y)}`).join(" ");
}
