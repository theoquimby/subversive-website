// The footer's ground line (Footer.tsx), as data: the path it draws and the height of the
// line at any x, so a drawing can stand on it exactly. Units are the footer SVG's viewBox
// (1200 × 60, y down).

type Pt = readonly [number, number];
/** cubic segments: start, control 1, control 2, end (the S commands written out) */
const SEGMENTS: readonly (readonly [Pt, Pt, Pt, Pt])[] = [
  [
    [0, 44],
    [80, 40],
    [130, 20],
    [200, 24],
  ],
  [
    [200, 24],
    [270, 28],
    [300, 46],
    [380, 40],
  ],
  [
    [380, 40],
    [460, 34],
    [520, 14],
    [600, 22],
  ],
  [
    [600, 22],
    [680, 30],
    [720, 46],
    [800, 38],
  ],
  [
    [800, 38],
    [880, 30],
    [930, 18],
    [1010, 26],
  ],
  [
    [1010, 26],
    [1090, 34],
    [1130, 44],
    [1200, 40],
  ],
];

export const GROUND_PATH =
  "M0 44C80 40 130 20 200 24S300 46 380 40S520 14 600 22S720 46 800 38S930 18 1010 26S1130 44 1200 40";

function at(a: number, b: number, c: number, d: number, t: number): number {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

/** The ground line's y at x (0–1200). Each segment's x rises with t, so bisect on t. */
export function groundY(x: number): number {
  const seg = SEGMENTS.find((s) => x <= s[3][0]) ?? SEGMENTS[SEGMENTS.length - 1];
  if (!seg) return 40;
  const [p0, p1, p2, p3] = seg;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (at(p0[0], p1[0], p2[0], p3[0], mid) < x) lo = mid;
    else hi = mid;
  }
  return at(p0[1], p1[1], p2[1], p3[1], (lo + hi) / 2);
}

/** The slope of the ground at x, in degrees (positive: the line falls to the right). */
export function groundTilt(x: number): number {
  return (Math.atan2(groundY(x + 4) - groundY(x - 4), 8) * 180) / Math.PI;
}
