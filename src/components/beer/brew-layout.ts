// Where everything stands in the brewing drawing (BrewProcess.tsx), for the two ways it is
// laid out: tall and winding on a phone, wide from 64rem. Each station is drawn once, in
// its own coordinates (the strings below); a layout only says where each station stands,
// which way the pipes and chutes run between them, and where the labels go.

export type Pt = readonly [number, number];
export type Stage = "fresh" | "grain" | "mash" | "runoff" | "boil" | "transfer" | "ferment" | "out" | "done";
export type LabelKey =
  | "grain"
  | "hops"
  | "water"
  | "yeast"
  | "mill"
  | "mash"
  | "runoff"
  | "boil"
  | "ferment"
  | "out";

/** A pipe or chute: its line, its length, and how long anything takes to travel it. */
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
    hops: Pt;
    jug: Pt;
    jar: Pt;
    mill: Pt;
    mash: Pt;
    kettle: Pt;
    ferm: Pt;
    out: Pt;
  };
  /** 0 grain from the sack, 1 cracked grain, 2 water, 3 run-off, 4 to the fermenter, 5 to the filler */
  links: readonly LinkGeo[];
  /** the chute's own pen line, under the cracked grain */
  trough: string;
  labels: readonly { key: LabelKey; x: number; y: number; anchor?: "start" | "middle" | "end" }[];
  /** what a tap replays from; "paddle" stirs */
  hits: readonly { to: Stage | "paddle"; r: readonly [number, number, number, number] }[];
  /** hop cones fall from here into the kettle: x from, x to, y (whole drawing) */
  hopFrom: readonly [number, number, number];
}

const LIQUID = 260; // units a second along a pipe
const GRAIN = 115; // along a chute
const FILLER = 520; // the filler's line is short and quick, so a can is not kept waiting

const len2 = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const f = (n: number) => n.toFixed(1);

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

// ---- each station in its own coordinates -------------------------------------------------

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
};

/** one hop cone at the origin, about 16 tall */
export const CONE = {
  body: "M0 -8C5 -6 6.5 2 0 8C-6.5 2 -5 -6 0 -8Z",
  scales: "M-4.2 -1.5Q0 1.5 4.2 -1.5M-3.4 3Q0 5.8 3.4 3",
  stem: "M0 -8C0 -10 1 -11 2.5 -12",
};

/** a bale of hops, two cones on top */
export const BALE = {
  body: "M5 22C18 21 38 23 51 22C52 31 51 41 52 50C38 51 18 49 5 50C4 41 6 31 5 22Z",
  straps: "M18 22C17 31 19 41 18 50M38 22C39 31 37 41 38 50",
  cones: [
    [20, 14, -14],
    [35, 13, 18],
  ] as const,
};

/** a water bottle with a tap at the bottom */
export const JUG = {
  body: "M8 30C8 20 13 16 21 16H39C47 16 52 20 52 30V82C52 88 48 90 42 90H18C12 90 8 88 8 82Z",
  inside: "M9 30C9 21 14 17 21 17H39C46 17 51 21 51 30V82C51 87 48 89 42 89H18C12 89 9 87 9 82Z",
  neck: "M23 16V8C23 6 24 5 26 5H34C36 5 37 6 37 8V16M22 9H38",
  tap: "M51 78H58C60 78 61 79 61 81V88M56 78V73M53 73H59",
  out: [61, 90] as Pt,
};

/** a jar of yeast */
export const JAR = {
  lid: "M7 8C7 6 8 5 10 5H34C36 5 37 6 37 8V13H7Z",
  body: "M9 13C8 15 8 16 8 18V44C8 47 10 49 13 49H31C34 49 36 47 36 44V18C36 16 36 15 35 13",
  inside: "M9 14H35V44C35 46 34 48 31 48H13C10 48 9 46 9 44Z",
};

/** the mill: a hopper, two rollers in a housing open top and bottom, a crank, a post */
export const MILL = {
  hopper: "M20 0C30 14 42 28 52 42M100 0C90 14 78 28 68 42",
  housing:
    "M52 42H36C34 42 32 44 32 46V72C32 74 34 76 36 76H54M66 76H84C86 76 88 74 88 72V46C88 44 86 42 84 42H68",
  post: "M32 66H22V108M12 108H32M88 59H97",
  rollers: [
    [51, 59],
    [69, 59],
  ] as const,
  crank: [100, 59] as Pt,
};

/** the mash tun: walls, rim, a false bottom, an outlet with its valve; and the paddle */
export const MASH = {
  walls:
    "M8 30C9 64 11 98 12 132C12 136 14 138 18 138H132C136 138 138 136 138 132C139 98 141 64 142 30M3 30H13M137 30H147M75 138V146",
  inside: "M9 30L12 132C12 136 14 137 18 137H132C136 137 137 136 138 132L141 30Z",
  valve: "M69 145H81L69 155H81Z",
  handle: "M75 150H87",
  valveAt: [75, 150] as Pt,
  falseBottom: "M15 128H135",
  paddle: {
    handle: "M50 4C60 40 72 78 84 108M44 6L56 2",
    blade: "M79 100C86 96 94 100 95 110C96 120 88 125 81 122C75 118 74 106 79 100Z",
    holes: "M84 108V113M89 109V114",
  },
  pivot: [56, 24] as Pt,
  floor: 136,
  x0: 9,
  x1: 141,
};

/** the kettle: open copper pot, a tap low on the right, a burner underneath */
export const KETTLE = {
  walls:
    "M4 20H14M136 20H146M10 20C10 44 10 70 10 92C10 108 40 118 75 118C110 118 140 108 140 92C140 70 140 44 140 20M134 102H148",
  inside: "M11 20V92C11 107 40 117 75 117C110 117 139 107 139 92V20Z",
  valve: "M148 96V108L160 96V108Z",
  handle: "M154 102V90",
  valveAt: [154, 102] as Pt,
  burner: "M40 134C60 133 90 135 110 134M48 134L42 148M102 134L108 148",
  floor: 112,
  x0: 11,
  x1: 139,
};

/** the fermenter: a tall conical tank on legs, a port and an airlock on top */
export const FERM = {
  walls: "M10 30C10 18 30 12 55 12C80 12 100 18 100 30M10 30V170L55 216L100 170V30M55 216V221",
  inside: "M11 30V170L55 215L99 170V30Z",
  legs: "M14 168L6 252M96 168L104 252M1 252H11M99 252H109",
  port: "M30 15V6H42V13",
  valve: "M49 221H61L49 231H61Z",
  handle: "M55 226H67",
  valveAt: [55, 226] as Pt,
  airlock: "M70 13V8H80V12M75 8V1",
  bulb: [75, -6] as Pt,
  water: "M68.3 -4A7 7 0 0 0 81.7 -4Z",
  x0: 11,
  x1: 99,
};

/** the filler: a belt, a nozzle, a capper; a keg and three cans ride the belt */
export const OUT = {
  belt: "M2 100H338M2 110H338M2 100C-2 100 -2 110 2 110M338 100C342 100 342 110 338 110M30 110V128M310 110V128M20 128H40M300 128H320",
  beltMid: "M6 105H334",
  nozzle: "M140 -2H160V12L154 18H146L140 12Z",
  tip: "M150 18V22",
  capper: "M170 2H190V12L186 16H174L170 12ZM180 16V18",
  keg: "M-20 100C-24 88 -24 52 -20 40H20C24 52 24 88 20 100Z",
  kegRibs: "M-22.6 58H22.6M-22.6 82H22.6M-6 40V35H6V40",
  can: "M-11 63V97C-11 99 -10 100 -8 100H8C10 100 11 99 11 97V63C11 61 10 60 8 60H-8C-10 60 -11 61 -11 63Z",
  lid: "M-12 61C-12 58 -8 56.5 0 56.5C8 56.5 12 58 12 61Z",
};

// ---- the two layouts -----------------------------------------------------------------------

export const PHONE: Layout = {
  id: "phone",
  box: [360, 1052],
  at: {
    sack: [8, 22],
    hops: [104, 40],
    jug: [178, 6],
    jar: [272, 42],
    mill: [20, 150],
    mash: [190, 236],
    kettle: [40, 432],
    ferm: [220, 610],
    out: [10, 888],
  },
  links: [
    link(
      [
        [80, 82],
        [84, 90],
      ],
      GRAIN,
    ),
    link(
      [
        [80, 194],
        [80, 230],
        [86, 246],
        [208, 256],
      ],
      GRAIN,
    ),
    link(
      [
        [239, 96],
        [239, 140],
        [302, 140],
        [302, 244],
      ],
      LIQUID,
    ),
    link(
      [
        [265, 390],
        [265, 404],
        [120, 404],
        [120, 426],
      ],
      LIQUID,
    ),
    link(
      [
        [202, 534],
        [212, 534],
        [212, 596],
        [256, 596],
        [256, 640],
      ],
      LIQUID,
    ),
    link(
      [
        [275, 844],
        [275, 870],
        [160, 870],
        [160, 908],
      ],
      FILLER,
    ),
  ],
  trough: "M82 249L211 260",
  labels: [
    { key: "grain", x: 46, y: 116 },
    { key: "hops", x: 132, y: 116 },
    { key: "water", x: 208, y: 116 },
    { key: "yeast", x: 294, y: 116 },
    { key: "mill", x: 80, y: 284 },
    { key: "mash", x: 182, y: 330, anchor: "end" },
    { key: "runoff", x: 276, y: 408, anchor: "start" },
    { key: "boil", x: 115, y: 602 },
    { key: "ferment", x: 212, y: 730, anchor: "end" },
    { key: "out", x: 170, y: 1042 },
  ],
  hits: [
    { to: "grain", r: [0, 0, 360, 124] },
    { to: "grain", r: [16, 140, 120, 152] },
    { to: "paddle", r: [222, 214, 48, 52] },
    { to: "mash", r: [184, 226, 170, 162] },
    { to: "runoff", r: [110, 388, 250, 44] },
    { to: "boil", r: [36, 432, 180, 180] },
    { to: "ferment", r: [190, 586, 166, 292] },
    { to: "out", r: [0, 880, 360, 172] },
  ],
  hopFrom: [62, 100, 412],
};

export const WIDE: Layout = {
  id: "wide",
  box: [1050, 452],
  at: {
    sack: [20, 8],
    jug: [250, 4],
    hops: [470, 120],
    jar: [690, 36],
    mill: [40, 120],
    mash: [200, 220],
    kettle: [400, 200],
    ferm: [600, 110],
    out: [700, 296],
  },
  links: [
    link(
      [
        [92, 68],
        [96, 76],
      ],
      GRAIN,
    ),
    link(
      [
        [100, 164],
        [100, 200],
        [106, 216],
        [218, 240],
      ],
      GRAIN,
    ),
    link(
      [
        [311, 94],
        [311, 232],
      ],
      LIQUID,
    ),
    link(
      [
        [275, 374],
        [275, 392],
        [372, 392],
        [372, 196],
        [440, 196],
        [440, 214],
      ],
      LIQUID,
    ),
    link(
      [
        [562, 302],
        [580, 302],
        [580, 96],
        [636, 96],
        [636, 140],
      ],
      LIQUID,
    ),
    link(
      [
        [655, 344],
        [655, 372],
        [722, 372],
        [722, 280],
        [850, 280],
        [850, 316],
      ],
      FILLER,
    ),
  ],
  trough: "M102 219L221 244",
  labels: [
    { key: "grain", x: 50, y: 98 },
    { key: "water", x: 280, y: 112 },
    { key: "hops", x: 498, y: 112 },
    { key: "yeast", x: 712, y: 102 },
    { key: "mill", x: 100, y: 264 },
    { key: "mash", x: 194, y: 330, anchor: "end" },
    { key: "runoff", x: 322, y: 412 },
    { key: "boil", x: 475, y: 368 },
    { key: "ferment", x: 716, y: 198, anchor: "start" },
    { key: "out", x: 860, y: 446 },
  ],
  hits: [
    { to: "grain", r: [10, 0, 96, 104] },
    { to: "grain", r: [240, 0, 80, 116] },
    { to: "grain", r: [462, 96, 76, 84] },
    { to: "grain", r: [682, 20, 62, 90] },
    { to: "grain", r: [30, 110, 124, 160] },
    { to: "paddle", r: [226, 196, 50, 52] },
    { to: "mash", r: [194, 212, 162, 180] },
    { to: "runoff", r: [262, 382, 124, 40] },
    { to: "runoff", r: [362, 186, 86, 28] },
    { to: "boil", r: [392, 180, 186, 196] },
    { to: "ferment", r: [596, 86, 130, 290] },
    { to: "out", r: [700, 270, 350, 182] },
  ],
  hopFrom: [484, 512, 176],
};
