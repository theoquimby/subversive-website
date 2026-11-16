// The map's landmarks: the Hudson River and the main roads, so the towns sit somewhere a
// visitor recognises. Traced by hand as a few points each (latitude, longitude) through
// well-known places, then projected and smoothed into one pen line. Illustrative, like the
// rest of the drawing: good for "which side of the river", not for navigation.
import { projectNY } from "./project";
import { nudge } from "./wobble";

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
  // each point takes the same small nudge as the state's outline (wobble.ts), so the lines
  // agree with it and nothing needs a live filter
  const p = points.map(([lat, lng]) => {
    const at = projectNY(lat, lng);
    const [x, y] = nudge(at.x, at.y, 3.2);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });
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

// Small pen drawings that sit where the real things are: the two mountain ranges, open
// water, a boat on the river. Each is a kind and a place; SourceMap owns the drawings.
const DECOR: { kind: "peaks" | "waves" | "boat" | "trees"; at: LatLng }[] = [
  { kind: "peaks", at: [42.05, -74.5] }, // the Catskills
  { kind: "peaks", at: [44.1, -74.35] }, // the Adirondacks
  { kind: "trees", at: [42.5, -76.6] }, // the Finger Lakes hills
  { kind: "waves", at: [43.62, -77.2] }, // Lake Ontario
  { kind: "waves", at: [40.6, -72.9] }, // the Atlantic, off Long Island
  { kind: "boat", at: [41.62, -73.96] }, // on the Hudson, by Poughkeepsie
];

// Names written on the map, as a hand-drawn map has them: the country in small capitals,
// three cities as small rings. `anchor` is the side of the point the name is written on.
const LABELS: {
  text: string;
  at: LatLng;
  kind: "land" | "water" | "city";
  anchor: "start" | "middle" | "end";
}[] = [
  { text: "Adirondacks", at: [43.72, -74.35], kind: "land", anchor: "middle" },
  { text: "Catskills", at: [41.78, -74.5], kind: "land", anchor: "middle" },
  { text: "Finger Lakes", at: [42.2, -76.6], kind: "land", anchor: "middle" },
  { text: "Lake Ontario", at: [43.42, -77.2], kind: "water", anchor: "middle" },
  { text: "Hudson River", at: [41.3, -74.1], kind: "water", anchor: "end" },
  { text: "Long Island", at: [40.92, -72.9], kind: "land", anchor: "middle" },
  { text: "Albany", at: [42.65, -73.76], kind: "city", anchor: "start" },
  { text: "Buffalo", at: [42.89, -78.86], kind: "city", anchor: "start" },
  { text: "New York City", at: [40.72, -74.0], kind: "city", anchor: "end" },
];

export interface MapFeatures {
  river: string;
  roads: string[];
  decor: { kind: "peaks" | "waves" | "boat" | "trees"; x: number; y: number }[];
  labels: {
    text: string;
    kind: "land" | "water" | "city";
    anchor: "start" | "middle" | "end";
    x: number;
    y: number;
  }[];
}

export function mapFeatures(): MapFeatures {
  return {
    river: line(HUDSON),
    roads: ROADS.map((r) => line(r.points)),
    decor: DECOR.map(({ kind, at }) => {
      const { x, y } = projectNY(at[0], at[1]);
      return { kind, x, y };
    }),
    labels: LABELS.map(({ text, kind, anchor, at }) => {
      const { x, y } = projectNY(at[0], at[1]);
      return { text, kind, anchor, x, y };
    }),
  };
}
