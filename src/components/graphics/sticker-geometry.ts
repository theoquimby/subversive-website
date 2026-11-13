// Sticker shapes as computed geometry (spec §3.5), so no shape is a hand-typed polygon.
import { type Point, slashBand, toPoints } from "./slash";

/** The menu's price burst: `points` spikes, alternating outer and inner radius, top first. */
export function burstPoints(points = 28, outer = 50, inner = 41, cx = 50, cy = 50): Point[] {
  const n = points * 2;
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = i % 2 === 0 ? outer : inner;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

export const BURST_POINTS = toPoints(burstPoints());

/** The slash sticker: a fat parallelogram at the wordmark angle, in a 0 0 W 100 box. */
const SLASH = slashBand({ height: 100, thickness: 120 });
export const SLASH_STICKER = { points: toPoints(SLASH), width: 120 + (SLASH[3]?.[0] ?? 0) };
