// The map's landmarks: the Hudson River and the main roads, so the towns sit somewhere a
// visitor recognises. Traced by hand as a few points each (latitude, longitude) through
// well-known places, then projected and smoothed into one pen line. Illustrative, like the
// rest of the drawing: good for "which side of the river", not for navigation.
import { projectNY } from "./project";

type LatLng = readonly [number, number];

const HUDSON: LatLng[] = [
  [40.7, -74.02], // the harbour
  [40.94, -73.9],
  [41.29, -73.95],
  [41.5, -74.0], // Newburgh
  [41.7, -73.94], // Poughkeepsie
  [41.93, -73.96], // Kingston
  [42.22, -73.85], // Catskill
  [42.65, -73.75], // Albany
  [42.78, -73.68],
  [43.1, -73.58],
  [43.3, -73.6], // Hudson Falls
  [43.25, -73.83],
  [43.7, -73.99],
  [44.05, -73.95],
];

const ROADS: { name: string; points: LatLng[] }[] = [
  {
    // the Thruway up the valley, then the Northway
    name: "I-87",
    points: [
      [40.88, -73.9],
      [41.11, -74.15],
      [41.52, -74.07],
      [41.93, -74.02],
      [42.21, -73.89],
      [42.65, -73.8],
      [43.08, -73.78],
      [43.31, -73.67],
      [43.85, -73.76],
      [44.7, -73.45],
    ],
  },
  {
    // the Thruway west to Buffalo
    name: "I-90",
    points: [
      [42.65, -73.8],
      [42.8, -73.95],
      [43.1, -75.23],
      [43.05, -76.15],
      [43.0, -77.45],
      [42.95, -78.2],
      [42.89, -78.85],
    ],
  },
  {
    name: "I-88",
    points: [
      [42.8, -73.95],
      [42.45, -75.06],
      [42.1, -75.91],
    ],
  },
  {
    // the Southern Tier
    name: "I-86",
    points: [
      [41.45, -74.42],
      [41.93, -75.0],
      [42.1, -75.91],
      [42.09, -76.81],
      [42.34, -77.32],
      [42.1, -79.24],
    ],
  },
];

/** A smooth pen line through the projected points (quadratic curves through midpoints). */
function line(points: LatLng[]): string {
  const p = points.map(([lat, lng]) => projectNY(lat, lng));
  const first = p[0];
  const last = p[p.length - 1];
  if (!first || !last) return "";
  let d = `M${first.x} ${first.y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i];
    const b = p[i + 1];
    if (!a || !b) continue;
    d += `Q${a.x} ${a.y} ${Math.round((a.x + b.x) / 2)} ${Math.round((a.y + b.y) / 2)}`;
  }
  return `${d}L${last.x} ${last.y}`;
}

export interface MapFeatures {
  river: string;
  roads: string[];
}

export function mapFeatures(): MapFeatures {
  return { river: line(HUDSON), roads: ROADS.map((r) => line(r.points)) };
}
