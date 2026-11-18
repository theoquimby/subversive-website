// Where everything stands in the brewing drawing (BrewProcess.tsx), for its two layouts:
// a tall brewhouse of stacked floors on a phone, one wide room from 64rem. Each station is
// drawn once, in its own coordinates, as simple cylinders and boxes in the same gentle
// perspective (ellipse rims, a visible front lip); a layout says where each one stands on
// the floor, which way the pipes and augers run, where the room's walls, windows and boards
// go, and where the labels sit.

export type Pt = readonly [number, number];
export type Stage =
  | "fresh"
  | "grain"
  | "steep"
  | "germ"
  | "kiln"
  | "mill"
  | "mash"
  | "runoff"
  | "spent"
  | "boil"
  | "transfer"
  | "ferment"
  | "out"
  | "done";
export type LabelKey =
  | "grain"
  | "hops"
  | "water"
  | "yeast"
  | "malting"
  | "steep"
  | "germinate"
  | "kiln"
  | "mill"
  | "mash"
  | "runoff"
  | "boil"
  | "ferment"
  | "out";
export type Into = "mash" | "kettle" | "ferm";

/** A pipe or auger: its line, its length, and how long anything takes to travel it. */
export interface LinkGeo {
  pts: readonly Pt[];
  d: string;
  len: number;
  cum: readonly number[];
  T: number;
  out: Pt;
  dir: Pt;
}

export interface Layout {
  id: "phone" | "wide";
  box: Pt;
  at: {
    sack: Pt;
    tank: Pt;
    steep: Pt;
    germ: Pt;
    kiln: Pt;
    mill: Pt;
    mash: Pt;
    kettle: Pt;
    ferm: Pt;
    out: Pt;
    hops: Pt;
    jar: Pt;
    bin: Pt;
  };
  /** the sack is drawn mirrored, its mouth to the left */
  sackFlip: boolean;
  /**  0 grain to the steep    1 water to the steep   2 steep water to the drain
       3 grain to the floor    4 floor to the kiln    5 kiln to the mill
       6 cracked to the mash   7 water to the mash    8 run-off   9 to the fermenter
      10 to the filler */
  links: readonly LinkGeo[];
  drain: Pt;
  /** the two places an extra input stands, for each vessel it can go into */
  extras: Record<Into, readonly [Pt, Pt]>;
  /** which way an extra input's name runs from its item, so it stays in the frame */
  extraAnchor: Record<Into, "start" | "middle" | "end">;
  /** where things tossed into each vessel come down, whole drawing */
  aim: Record<Into, Pt>;
  /** the brewhouse behind it all: one quiet path, and contact hatching under feet */
  room: string;
  hatch: string;
  /** where the shovel leans when it is not in use: the blade's middle on the floor */
  shovelRest: Pt;
  shelves: string;
  labels: readonly { key: LabelKey; x: number; y: number; anchor?: "start" | "middle" | "end" }[];
  /** what a tap replays from; "paddle" stirs */
  hits: readonly { to: Stage | "paddle"; r: readonly [number, number, number, number] }[];
}

/** augers that are drawn; the grain's other moves are by shovel (links 0, 3 and 4 stay
    in the list, unused, so the indices hold) */
export const GRAIN_LINKS = [5, 6] as const;
export const LIQUID_LINKS = [
  { i: 1, tone: "water" },
  { i: 2, tone: "water" },
  { i: 7, tone: "water" },
  { i: 8, tone: "wort" },
  { i: 9, tone: "wort" },
  { i: 10, tone: "beer" },
] as const;

const LIQUID = 280; // units a second along a pipe
const AUGER = 210; // grain along an auger
const FILLER = 520; // the filler's short quick line

const len2 = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const f = (n: number) => n.toFixed(1);
export const r1 = f;

/** A pen line through the points: corners rounded, long runs very slightly bowed. */
function penLine(pts: readonly Pt[]): string {
  const first = pts[0] as Pt;
  let d = `M${f(first[0])} ${f(first[1])}`;
  let cur: Pt = first;
  let sign = 1;
  const run = (to: Pt) => {
    const l = len2(cur, to);
    if (l > 40) {
      const nx = -(to[1] - cur[1]) / l;
      const ny = (to[0] - cur[0]) / l;
      const mx = (cur[0] + to[0]) / 2 + nx * 0.9 * sign;
      const my = (cur[1] + to[1]) / 2 + ny * 0.9 * sign;
      d += `Q${f(mx)} ${f(my)} ${f(to[0])} ${f(to[1])}`;
      sign = -sign;
    } else d += `L${f(to[0])} ${f(to[1])}`;
    cur = to;
  };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as Pt;
    const p = pts[i] as Pt;
    const b = pts[i + 1];
    if (!b) {
      run(p);
      break;
    }
    const r = Math.min(9, len2(a, p) / 2, len2(p, b) / 2);
    const la = len2(a, p) || 1;
    const lb = len2(p, b) || 1;
    const p1: Pt = [p[0] + ((a[0] - p[0]) / la) * r, p[1] + ((a[1] - p[1]) / la) * r];
    const p2: Pt = [p[0] + ((b[0] - p[0]) / lb) * r, p[1] + ((b[1] - p[1]) / lb) * r];
    run(p1);
    d += `Q${f(p[0])} ${f(p[1])} ${f(p2[0])} ${f(p2[1])}`;
    cur = p2;
  }
  return d;
}

function link(pts: readonly Pt[], speed: number): LinkGeo {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push((cum[i - 1] ?? 0) + len2(pts[i - 1] as Pt, pts[i] as Pt));
  const len = cum[cum.length - 1] ?? 1;
  const out = pts[pts.length - 1] as Pt;
  const prev = pts[pts.length - 2] as Pt;
  const l = len2(prev, out) || 1;
  return {
    pts,
    d: penLine(pts),
    len,
    cum,
    T: len / speed,
    out,
    dir: [(out[0] - prev[0]) / l, (out[1] - prev[1]) / l],
  };
}

/** The point s units along a link. */
export function along(g: LinkGeo, s: number): Pt {
  for (let i = 1; i < g.pts.length; i++) {
    const c0 = g.cum[i - 1] ?? 0;
    const c1 = g.cum[i] ?? 0;
    if (s <= c1 || i === g.pts.length - 1) {
      const a = g.pts[i - 1] as Pt;
      const b = g.pts[i] as Pt;
      const k = Math.max(0, Math.min(1, (s - c0) / (c1 - c0 || 1)));
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    }
  }
  return g.out;
}

// ---- drawing helpers ------------------------------------------------------------------------

/** how round the rims look: the drawing is seen a little from above */
export const RIM = 0.22;
/** a whole ellipse */
export const ell = (cx: number, cy: number, a: number, b: number) =>
  `M${f(cx - a)} ${f(cy)}A${f(a)} ${f(b)} 0 1 0 ${f(cx + a)} ${f(cy)}A${f(a)} ${f(b)} 0 1 0 ${f(cx - a)} ${f(cy)}`;
/** the near half of an ellipse, left to right */
export const near = (cx: number, cy: number, a: number, b: number) =>
  `M${f(cx - a)} ${f(cy)}A${f(a)} ${f(b)} 0 0 0 ${f(cx + a)} ${f(cy)}`;
/** an upright cylinder's inside: far half of the rim, the sides, near half of the bottom */
const barrel = (cx: number, top: number, bottom: number, a: number, b: number, bb = b) =>
  `M${f(cx - a)} ${f(top)}A${f(a)} ${f(b)} 0 0 1 ${f(cx + a)} ${f(top)}V${f(bottom)}A${f(a)} ${f(bb)} 0 0 1 ${f(cx - a)} ${f(bottom)}Z`;
/** a valve body on a vertical or horizontal pipe */
const bowtieV = (x: number, y: number) => `M${x - 6} ${y}H${x + 6}L${x - 6} ${y + 9}H${x + 6}Z`;
const bowtieH = (x: number, y: number) => `M${x} ${y - 6}V${y + 6}L${x + 9} ${y - 6}V${y + 6}Z`;
/** short strokes on the floor under something standing on it */
export function hatch(x0: number, x1: number, y: number) {
  let d = "";
  for (let x = x0 + 2; x < x1; x += 4.5) d += `M${f(x)} ${f(y + 1.5)}l-3 3.2`;
  return d;
}
/** the line of a cylinder's liquid: x for spring i of n at half-width a */
export const spread = (cx: number, a: number, i: number, n: number) => cx + a * ((2 * i) / (n - 1) - 1);

// ---- the stations, each in its own coordinates ---------------------------------------------

/** a grain sack tipped on its side, its mouth to the right; a second stands behind it */
export const SACK = {
  back: "M14 40C11 28 13 14 20 8C24 11 30 11 34 7C40 13 42 26 39 40Z",
  front:
    "M6 62C1 52 3 38 14 32C26 26 44 28 56 36C60 39 63 42 65 46C68 47 71 49 73 52C75 56 74 60 70 61C67 62 65 61 64 60C58 66 44 69 28 68C17 67 9 66 6 62Z",
  tie: "M63 44C61 50 61 56 64 60",
  spill: "M65 61.5C67 58 72 57.5 76 61.5Z",
  ear: "M16 60C22 54 28 48 38 39",
  kernels: [
    "M24 53c-3.5-.5-5-3.5-3.5-6c3.5 .5 5 3.5 3.5 6z",
    "M24 53c.5-3.5 3.5-5 6-3.5c-.5 3.5-3.5 5-6 3.5z",
    "M30 47c-3.5-.5-5-3.5-3.5-6c3.5 .5 5 3.5 3.5 6z",
    "M30 47c.5-3.5 3.5-5 6-3.5c-.5 3.5-3.5 5-6 3.5z",
    "M36 41c-3-1-4-4-2.5-6c3 1 4 4 2.5 6z",
  ],
  mouth: [72, 60] as Pt,
  foot: [2, 74, 68] as const,
};

/** one hop cone at the origin, about 16 tall */
export const CONE = {
  body: "M0 -8C5 -6 6.5 2 0 8C-6.5 2 -5 -6 0 -8Z",
  scales: "M-4.2 -1.5Q0 1.5 4.2 -1.5M-3.4 3Q0 5.8 3.4 3",
  stem: "M0 -8C0 -10 1 -11 2.5 -12",
};

/** a bale of hops, two cones on top; the tossed cones leave from its top */
export const BALE = {
  body: "M5 22C18 21 38 23 51 22C52 31 51 41 52 50C38 51 18 49 5 50C4 41 6 31 5 22Z",
  top: "M5 22L12 16C24 15 40 17 57 16L51 22M57 16C58 26 57 36 58 44L52 50",
  straps: "M18 22C17 31 19 41 18 50M38 22C39 31 37 41 38 50",
  cones: [
    [20, 12, -14],
    [36, 11, 18],
  ] as const,
  from: [28, 8] as Pt,
  foot: [4, 56, 50] as const,
};

/** the water tank on the wall, a tap to the right and an outlet underneath */
export const TANK = {
  body: "M8 30C8 20 13 16 21 16H39C47 16 52 20 52 30V82C52 88 48 90 42 90H18C12 90 8 88 8 82Z",
  inside: "M9 30C9 21 14 17 21 17H39C46 17 51 21 51 30V82C51 87 48 89 42 89H18C12 89 9 87 9 82Z",
  neck: "M23 16V8C23 6 24 5 26 5H34C36 5 37 6 37 8V16M22 9H38",
  tap: "M51 78H60M57 78V73M54 73H60M30 90V95",
  bracket: "M8 34H1M8 74H1M1 30V78",
  out: [61, 78] as Pt,
  under: [30, 96] as Pt,
};

/** a jar of yeast; it tips from its near bottom corner to pour */
export const JAR = {
  lid: "M7 8C7 6 8 5 10 5H34C36 5 37 6 37 8V13H7Z",
  body: "M9 13C8 15 8 16 8 18V44C8 47 10 49 13 49H31C34 49 36 47 36 44V18C36 16 36 15 35 13",
  inside: "M9 14H35V44C35 46 34 48 31 48H13C10 48 9 46 9 44Z",
  mouth: [10, 10] as Pt,
  pivot: [8, 49] as Pt,
  foot: [6, 38, 49] as const,
};

/** the steeping tank: a small cylinder with a cone, on legs */
export const STEEP = {
  cx: 40,
  a: 28,
  top: 18,
  seam: 66,
  apex: 92,
  lines: `${ell(40, 18, 28, 28 * RIM)}M12 18V66L40 92L68 66V18M16 70L10 118M64 70L70 118M5 118H15M65 118H75M40 92V96M12 60H6`,
  seamLine: near(40, 66, 28, 28 * RIM),
  fill: `M12 18A28 ${f(28 * RIM)} 0 0 1 68 18V66L40 92L12 66Z`,
  valve: bowtieV(40, 96),
  handle: "M40 100H50",
  valveAt: [40, 100] as Pt,
  out: [40, 106] as Pt,
  drain: [5, 60] as Pt,
  foot: [4, 76, 118] as const,
};

/** the germination floor: a low tray seen a little from above */
export const GERM = {
  lines: "M0 50H112L126 36H14ZM0 50V58H112V50M112 58L126 44V36",
  fill: "M0 50L14 36H126V44L112 58H0Z",
  front: 49,
  depth: [14, -12] as Pt,
  width: 106,
  x0: 3,
  thick: 24, // bed thickness per batch unit of grain
  foot: [0, 124, 58] as const,
};

/** the kiln: a brick base with a fire in its arch, a slatted floor on top */
export const KILN = {
  lines:
    "M0 40H100V74H0ZM100 40L112 30V64L100 74M0 40L12 30H112M0 52H36M64 52H100M25 40V52M75 40V52M36 74V64A14 10 0 0 1 64 64V74",
  slats: "M12 40L24 30M24 40L36 30M36 40L48 30M48 40L60 30M60 40L72 30M72 40L84 30M84 40L96 30",
  fill: "M0 40L12 30H112V64L100 74H0Z",
  front: 39,
  depth: [12, -10] as Pt,
  width: 98,
  x0: 1,
  thick: 20,
  fire: [50, 74] as Pt,
  foot: [0, 112, 74] as const,
};

/** the mill: a hopper, two rollers in a housing open top and bottom, a crank, a post */
export const MILL = {
  hopper: "M20 0C30 14 42 28 52 42M100 0C90 14 78 28 68 42",
  rim: ell(60, 0, 40, 5),
  housing:
    "M52 42H36C34 42 32 44 32 46V72C32 74 34 76 36 76H54M66 76H84C86 76 88 74 88 72V46C88 44 86 42 84 42H68",
  post: "M32 66H22V108M12 108H32M88 59H97",
  rollers: [
    [51, 59],
    [69, 59],
  ] as const,
  crank: [100, 59] as Pt,
  foot: [10, 34, 108] as const,
};

const MB = 62 * RIM;
/** the mash tun: a cylinder with a false bottom, an outlet underneath; and the paddle */
export const MASH = {
  cx: 75,
  a: 62,
  top: 30,
  bottom: 128,
  lines: `${ell(75, 30, 62, MB)}M13 30V128M137 30V128${near(75, 128, 62, MB)}M24 136L20 150M126 136L130 150M14 150H26M124 150H136M75 ${f(128 + MB)}V148`,
  inside: barrel(75, 30, 128, 62, MB),
  falseBottom: near(75, 120, 62, MB),
  valve: bowtieV(75, 148),
  handle: "M75 152H87",
  valveAt: [75, 152] as Pt,
  paddle: {
    handle: "M50 4C60 40 72 78 84 108M44 6L56 2",
    blade: "M79 100C86 96 94 100 95 110C96 120 88 125 81 122C75 118 74 106 79 100Z",
    holes: "M84 108V113M89 109V114",
  },
  pivot: [56, 24] as Pt,
  foot: [12, 138, 150] as const,
};

const KB = 62 * RIM;
/** the kettle: an open cylinder with a dished bottom on legs, a burner under it */
export const KETTLE = {
  cx: 75,
  a: 62,
  top: 20,
  bottom: 92,
  lines: `${ell(75, 20, 62, KB)}M13 20V92M137 20V92M13 92A62 20 0 0 0 137 92M22 100L16 150M128 100L134 150M10 150H22M128 150H140M137 84H150`,
  inside: barrel(75, 20, 92, 62, KB, 20),
  burner: `${ell(75, 124, 24, 4.5)}M57 127L54 136M93 127L96 136`,
  valve: bowtieH(150, 84),
  handle: "M155 84V72",
  valveAt: [155, 84] as Pt,
  foot: [8, 142, 150] as const,
};

const FB = 44 * RIM;
/** the fermenter: a tall conical tank on legs, a port and an airlock on top */
export const FERM = {
  cx: 55,
  a: 44,
  lines:
    "M11 30C11 16 32 10 55 10C78 10 99 16 99 30M11 30V170L55 214L99 170V30M55 214V220M15 166L7 250M95 166L103 250M2 250H12M98 250H108",
  seams: `${near(55, 30, 44, FB)}${near(55, 170, 44, FB)}`,
  fill: "M11 30C11 16 32 10 55 10C78 10 99 16 99 30V170L55 214L11 170Z",
  inside: "M11 30C11 22 32 17 55 17C78 17 99 22 99 30V170L55 214L11 170Z",
  port: "M30 15V5H42V12",
  valve: bowtieV(55, 220),
  handle: "M55 225H67",
  valveAt: [55, 225] as Pt,
  airlock: "M70 13V8H80V12M75 8V1",
  bulb: [75, -6] as Pt,
  water: "M68.3 -4A7 7 0 0 0 81.7 -4Z",
  frost: (() => {
    let d = "";
    const at: Pt[] = [
      [17, 48],
      [22, 78],
      [16, 108],
      [21, 138],
      [17, 160],
      [93, 56],
      [88, 86],
      [94, 116],
      [89, 146],
      [55, 196],
    ];
    for (const [x, y] of at)
      d += `M${x} ${y - 3}V${y + 3}M${x - 2.6} ${y - 1.5}L${x + 2.6} ${y + 1.5}M${x - 2.6} ${y + 1.5}L${x + 2.6} ${y - 1.5}`;
    return d;
  })(),
  foot: [0, 110, 250] as const,
};

/** the filler: a belt, a nozzle, a capper; a keg and three cans ride the belt */
/** the shovel, side on: the blade's middle at the origin, the lip to the right, the handle
    up to the left; it turns about the blade */
export const SHOVEL = {
  blade: "M-11 -6V1C-5 4.5 6 4 12 0C6 1.5 -4 1.5 -9 -1V-6Z",
  load: "M-9 -1.5C-5 -8 5 -7 11 -0.5C5 1 -4 1.2 -9 -1.5Z",
  handle: "M-10 -5L-33 -30M-36 -27L-30 -33",
  lip: [12, 0] as Pt,
  /** drawn this much larger than its coordinates */
  size: 1.35,
  /** how it leans at rest, degrees */
  lean: 35,
};

/** the bin the spent grain is shovelled into */
export const BIN = {
  cx: 20,
  a: 18,
  top: 10,
  bottom: 40,
  lines: `${ell(20, 10, 18, 18 * RIM)}M2 10V40M38 10V40${near(20, 40, 18, 18 * RIM)}M0 18H2M38 18H40`,
  inside: barrel(20, 10, 40, 18, 18 * RIM),
  foot: [2, 38, 44] as const,
};

export const OUT = {
  belt: "M2 96H338L348 88H12ZM2 96V104H338V96M338 104L348 96V88M30 104V120M310 104V120M20 120H40M300 120H320",
  /** the frame that holds the nozzle and the capper over the belt */
  frame: "M126 88V5H140M200 88V7H190",
  beltFill: "M2 96L12 88H348V96L338 104H2Z",
  beltMid: "M8 92H342",
  nozzle: "M140 -2H160V12L154 18H146L140 12Z",
  tip: "M150 18V22",
  capper: "M170 2H190V12L186 16H174L170 12ZM180 16V18",
  keg: `${ell(0, 34, 20, 4.4)}M-20 34V92M20 34V92${near(0, 92, 20, 4.4)}M-5 33V28H5V33`,
  kegRibs: `${near(0, 52, 20.6, 4.5)}${near(0, 74, 20.6, 4.5)}`,
  kegFill: barrel(0, 34, 92, 20, 4.4),
  // tall cans (Theo, 2026-11-18: "tall boys"): 22 across, 52 tall
  can: `${ell(0, 40, 11, 2.4)}M-11 40V92M11 40V92${near(0, 92, 11, 2.4)}`,
  canFill: barrel(0, 40, 92, 11, 2.4),
  lid: "M-11.5 40A11.5 2.8 0 1 0 11.5 40A11.5 2.8 0 1 0 -11.5 40Z",
  /** where a can's label sits: [x, y, width, height] */
  canLabel: [-11, 44, 22, 46] as const,
  foot: [
    [14, 46, 120],
    [294, 326, 120],
  ] as const,
};

/** an extra input: a bowl of fruit, or a jar */
export const EXTRA = {
  bowl: "M2 17C2 26 8 30 15 30C22 30 28 26 28 17Z",
  bowlRim: ell(15, 17, 13, 2.6),
  fruit: [
    [9, 14],
    [15, 11.5],
    [21, 14],
  ] as const,
  jar: "M7 9H23V27C23 29 22 30 20 30H10C8 30 7 29 7 27ZM6 5H24V9H6Z",
  jarInside: "M8 13H22V27C22 28 21 29 20 29H10C9 29 8 28 8 27Z",
  mouth: [15, 6] as Pt,
  foot: [2, 28, 30] as const,
};

// ---- the room -------------------------------------------------------------------------------

const window4 = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y}h${w}v${h}h${-w}ZM${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}M${x - 4} ${y + h}h${w + 8}`;
function door(x: number, y: number, w: number, h: number) {
  let d = `M${x} ${y + h}V${y}H${x + w}V${y + h}M${x + 4} ${y + 4}H${x + w - 4}`;
  for (let s = y + 12; s < y + h - 2; s += 9) d += `M${x + 4} ${s}H${x + w - 4}`;
  return `${d}M${x + w / 2 - 6} ${y + h - 6}h12`;
}
/** a line cut to the box's width */
function cut(x0: number, y0: number, x1: number, y1: number, w: number) {
  let a = 0;
  let b = 1;
  const dx = x1 - x0;
  for (const [p, q] of [
    [-dx, x0],
    [dx, w - x0],
  ] as const) {
    if (p === 0) {
      if (q < 0) return "";
      continue;
    }
    const r = q / p;
    if (p < 0) a = Math.max(a, r);
    else b = Math.min(b, r);
  }
  if (a >= b) return "";
  return `M${f(x0 + dx * a)} ${f(y0 + (y1 - y0) * a)}L${f(x0 + dx * b)} ${f(y0 + (y1 - y0) * b)}`;
}

/** footprints of things standing on the floor: their own [x0, x1, foot], placed */
const foot = (at: Pt, fp: readonly [number, number, number]) =>
  hatch(at[0] + fp[0], at[0] + fp[1], at[1] + fp[2]);
const shelf = (x0: number, x1: number, y: number) =>
  `M${x0} ${y}H${x1}M${x0 + 6} ${y}l-5 7M${x1 - 6} ${y}l5 7`;

// ---- the two layouts ------------------------------------------------------------------------

function phone(): Layout {
  const at = {
    tank: [8, 20] as Pt,
    sack: [270, 162] as Pt,
    steep: [110, 112] as Pt,
    germ: [16, 322] as Pt,
    kiln: [196, 306] as Pt,
    mash: [10, 450] as Pt,
    mill: [226, 492] as Pt,
    kettle: [40, 650] as Pt,
    hops: [272, 748] as Pt,
    ferm: [210, 840] as Pt,
    jar: [314, 831] as Pt,
    out: [10, 1134] as Pt,
    bin: [170, 556] as Pt,
  };
  const W = 360;
  const floors = [230, 380, 600, 800, 1090, 1254];
  let room = "";
  for (const y of floors) {
    room += `M0 ${y}H${W}M0 ${y + 5}H${W}M0 ${y - 18}H${W}`;
    for (let x = 0; x <= W; x += 36) room += `M${x} ${y}L${f(180 + (x - 180) * 0.8)} ${y - 18}`;
  }
  room += window4(192, 136, 48, 56) + window4(226, 712, 36, 32) + window4(36, 960, 56, 56);
  room += door(242, 1128, 98, 94);
  const sackAt = at.sack;
  const hatchAll =
    hatch(sackAt[0] + 2, sackAt[0] + 74, sackAt[1] + 68) +
    foot(at.steep, STEEP.foot) +
    foot(at.germ, GERM.foot) +
    foot(at.kiln, KILN.foot) +
    foot(at.mill, MILL.foot) +
    foot(at.mash, MASH.foot) +
    foot(at.kettle, KETTLE.foot) +
    foot(at.hops, BALE.foot) +
    foot(at.ferm, FERM.foot) +
    OUT.foot.map((fp) => foot(at.out, fp)).join("") +
    foot(at.jar, JAR.foot) +
    foot(at.bin, BIN.foot);
  return {
    id: "phone",
    box: [W, 1290],
    at,
    sackFlip: true,
    links: [
      link(
        [
          [272, 220],
          [250, 116],
          [172, 116],
        ],
        AUGER,
      ),
      link(
        [
          [69, 98],
          [136, 98],
          [136, 116],
        ],
        LIQUID,
      ),
      link(
        [
          [115, 172],
          [104, 172],
          [104, 222],
        ],
        LIQUID,
      ),
      link(
        [
          [150, 222],
          [150, 240],
          [104, 326],
        ],
        AUGER,
      ),
      link(
        [
          [140, 366],
          [168, 304],
          [236, 304],
        ],
        AUGER,
      ),
      link(
        [
          [312, 350],
          [338, 380],
          [300, 474],
        ],
        AUGER,
      ),
      link(
        [
          [286, 536],
          [286, 576],
          [276, 584],
          [236, 584],
          [236, 456],
          [120, 456],
        ],
        AUGER,
      ),
      link(
        [
          [38, 116],
          [38, 124],
          [5, 124],
          [5, 438],
          [104, 438],
          [104, 456],
        ],
        LIQUID,
      ),
      link(
        [
          [85, 606],
          [85, 630],
          [152, 630],
          [152, 648],
        ],
        LIQUID,
      ),
      link(
        [
          [204, 734],
          [214, 734],
          [214, 792],
          [246, 792],
          [246, 876],
        ],
        LIQUID,
      ),
      link(
        [
          [265, 1072],
          [265, 1106],
          [160, 1106],
          [160, 1154],
        ],
        FILLER,
      ),
    ],
    drain: [104, 232],
    extras: {
      mash: [
        [126, 404],
        [160, 404],
      ],
      kettle: [
        [222, 672],
        [256, 672],
      ],
      ferm: [
        [14, 900],
        [56, 900],
      ],
    },
    extraAnchor: { mash: "middle", kettle: "start", ferm: "start" },
    aim: { mash: [80, 490], kettle: [112, 690], ferm: [246, 862] },
    room,
    hatch: hatchAll,
    shovelRest: [214, 220.5],
    shelves: shelf(312, 356, 880),
    labels: [
      { key: "water", x: 38, y: 14 },
      { key: "malting", x: 290, y: 60 },
      { key: "grain", x: 310, y: 254 },
      { key: "steep", x: 198, y: 254 },
      { key: "germinate", x: 79, y: 404 },
      { key: "kiln", x: 252, y: 404 },
      { key: "mash", x: 40, y: 624 },
      { key: "mill", x: 286, y: 624 },
      { key: "runoff", x: 162, y: 642, anchor: "start" },
      { key: "boil", x: 115, y: 824 },
      { key: "hops", x: 300, y: 824 },
      { key: "yeast", x: 334, y: 900 },
      { key: "ferment", x: 202, y: 1034, anchor: "end" },
      { key: "out", x: 180, y: 1282 },
    ],
    hits: [
      { to: "grain", r: [0, 0, 360, 124] },
      { to: "grain", r: [100, 100, 260, 136] },
      { to: "germ", r: [0, 300, 180, 90] },
      { to: "kiln", r: [180, 290, 180, 100] },
      { to: "paddle", r: [40, 436, 48, 50] },
      { to: "mill", r: [200, 470, 160, 140] },
      { to: "mash", r: [0, 430, 200, 180] },
      { to: "runoff", r: [60, 606, 200, 40] },
      { to: "boil", r: [0, 646, 360, 164] },
      { to: "ferment", r: [0, 810, 360, 292] },
      { to: "out", r: [0, 1104, 360, 186] },
    ],
  };
}

function wide(): Layout {
  const at = {
    tank: [20, 40] as Pt,
    sack: [10, 304] as Pt,
    steep: [100, 254] as Pt,
    germ: [196, 314] as Pt,
    kiln: [350, 298] as Pt,
    mill: [490, 264] as Pt,
    mash: [630, 222] as Pt,
    kettle: [800, 222] as Pt,
    hops: [760, 420] as Pt,
    ferm: [970, 122] as Pt,
    jar: [1092, 61] as Pt,
    out: [850, 370] as Pt,
    bin: [652, 426] as Pt,
  };
  const W = 1200;
  const H = 520;
  const base = 330;
  const vp: Pt = [600, 200];
  let room = `M0 ${base}H${W}M0 62H${W}M0 68H${W}`;
  for (let x = 100; x < W; x += 250) room += `M${x} 56V74`;
  for (let x = -900; x <= 2100; x += 64) {
    const X = vp[0] + ((x - vp[0]) * (H - vp[1])) / (base - vp[1]);
    room += cut(x, base, X, H, W);
  }
  room += `M0 432H${W}`;
  room += window4(196, 180, 80, 84) + window4(352, 180, 80, 84) + door(1104, 214, 90, 116);
  const hatchAll =
    foot(at.sack, SACK.foot) +
    foot(at.steep, STEEP.foot) +
    foot(at.germ, GERM.foot) +
    foot(at.kiln, KILN.foot) +
    foot(at.mill, MILL.foot) +
    foot(at.mash, MASH.foot) +
    foot(at.kettle, KETTLE.foot) +
    foot(at.hops, BALE.foot) +
    foot(at.ferm, FERM.foot) +
    OUT.foot.map((fp) => foot(at.out, fp)).join("") +
    foot(at.jar, JAR.foot) +
    foot(at.bin, BIN.foot);
  return {
    id: "wide",
    box: [W, H],
    at,
    sackFlip: false,
    links: [
      link(
        [
          [84, 358],
          [100, 250],
          [128, 250],
        ],
        AUGER,
      ),
      link(
        [
          [50, 136],
          [50, 150],
          [156, 150],
          [156, 260],
        ],
        LIQUID,
      ),
      link(
        [
          [105, 316],
          [105, 384],
        ],
        LIQUID,
      ),
      link(
        [
          [140, 362],
          [176, 372],
          [228, 328],
        ],
        AUGER,
      ),
      link(
        [
          [318, 360],
          [340, 316],
          [404, 316],
        ],
        AUGER,
      ),
      link(
        [
          [462, 340],
          [476, 290],
          [540, 250],
        ],
        AUGER,
      ),
      link(
        [
          [550, 300],
          [550, 340],
          [566, 352],
          [610, 352],
          [624, 236],
          [670, 236],
        ],
        AUGER,
      ),
      link(
        [
          [81, 118],
          [92, 118],
          [92, 84],
          [720, 84],
          [720, 230],
        ],
        LIQUID,
      ),
      link(
        [
          [705, 378],
          [705, 394],
          [790, 394],
          [790, 214],
          [850, 214],
          [850, 224],
        ],
        LIQUID,
      ),
      link(
        [
          [964, 306],
          [972, 306],
          [972, 108],
          [1006, 108],
          [1006, 142],
        ],
        LIQUID,
      ),
      link(
        [
          [1025, 354],
          [1025, 364],
          [1000, 364],
          [1000, 390],
        ],
        FILLER,
      ),
    ],
    drain: [105, 390],
    extras: {
      mash: [
        [618, 166],
        [652, 166],
      ],
      kettle: [
        [782, 166],
        [822, 166],
      ],
      ferm: [
        [902, 166],
        [938, 166],
      ],
    },
    extraAnchor: { mash: "middle", kettle: "start", ferm: "end" },
    aim: { mash: [700, 250], kettle: [880, 252], ferm: [1006, 140] },
    room,
    hatch: hatchAll,
    shovelRest: [182, 362.5],
    shelves: shelf(1084, 1150, 110),
    labels: [
      { key: "water", x: 50, y: 30 },
      { key: "malting", x: 288, y: 166 },
      { key: "grain", x: 46, y: 398 },
      { key: "steep", x: 148, y: 398 },
      { key: "germinate", x: 259, y: 398 },
      { key: "kiln", x: 406, y: 398 },
      { key: "mill", x: 550, y: 398 },
      { key: "mash", x: 606, y: 412, anchor: "middle" },
      { key: "runoff", x: 746, y: 414 },
      { key: "boil", x: 875, y: 398 },
      { key: "hops", x: 788, y: 494 },
      { key: "yeast", x: 1118, y: 128 },
      { key: "ferment", x: 1040, y: 96 },
      { key: "out", x: 1020, y: 512 },
    ],
    hits: [
      { to: "grain", r: [0, 0, 190, 400] },
      { to: "germ", r: [190, 290, 150, 110] },
      { to: "kiln", r: [340, 280, 140, 120] },
      { to: "mill", r: [480, 250, 140, 150] },
      { to: "paddle", r: [656, 200, 52, 56] },
      { to: "mash", r: [620, 200, 160, 200] },
      { to: "runoff", r: [690, 380, 110, 40] },
      { to: "boil", r: [760, 160, 200, 260] },
      { to: "ferment", r: [960, 60, 200, 300] },
      { to: "out", r: [840, 360, 360, 160] },
    ],
  };
}

export const PHONE = phone();
export const WIDE = wide();
