// Latitude and longitude → a point on the drawn New York map. The same Albers projection
// and fit that scripts/build-ny-map.ts used for the outline, from the numbers it wrote
// beside it. This is what lets a supplier be added as data (a name and where it is) and
// appear on the map with no drawing work.
import { NY_PROJECTION, NY_VIEWBOX } from "@/components/graphics/ny-map.generated";

const RAD = Math.PI / 180;
const [, , VIEW_W, VIEW_H] = NY_VIEWBOX.split(" ").map(Number) as [number, number, number, number];

export interface MapPoint {
  x: number;
  y: number;
  /** false when the place falls outside the drawing (not in or near New York State) */
  onMap: boolean;
}

export function projectNY(lat: number, lng: number): MapPoint {
  const { n, C, rho0, lam0, minX, minY, k, pad } = NY_PROJECTION;
  const rho = Math.sqrt(C - 2 * n * Math.sin(lat * RAD)) / n;
  const theta = n * (lng * RAD - lam0);
  const x = Math.round((rho * Math.sin(theta) - minX) * k + pad);
  const y = Math.round((-(rho0 - rho * Math.cos(theta)) - minY) * k + pad);
  return { x, y, onMap: x >= 0 && x <= VIEW_W && y >= 0 && y <= VIEW_H };
}
