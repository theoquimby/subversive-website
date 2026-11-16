// The brewing drawing's physics (BrewProcess.tsx). Nothing here touches the DOM: `step`
// moves the model on by dt seconds, `paint` turns it into attribute strings, handed to a
// `put(key, attribute, value)` that either collects them (the server's still drawing) or
// writes them to the SVG (each frame).
//
// The model:
//   volume    one batch, in batch units, conserved: grain 0.5 from the sack through the
//             steep, the floor, the kiln, the mill and the mash; water 1.4 from the tank,
//             0.4 to steep the grain (then down the drain) and 1.0 to the mash, which goes
//             on as wort and beer (less 0.1 boiled off as steam). Every pipe and auger is a
//             conveyor: what enters at t leaves its far end at t plus its travel time, then
//             falls under gravity to the surface below; only then does it count in the next
//             vessel (totals entered and landed, as in the Home glass). Each vessel turns its
//             volume into a level from its own shape; the drawings are not to one scale.
//   surfaces  the mash, the kettle and the fermenter each have a row of springs drawn across
//             an ellipse: streams, grain, bubbles, hops and the paddle kick it, and the
//             phone's lean is where it settles.
//   flight    hop cones, yeast and any extra input are thrown: each follows a parabola
//             under gravity from where it leaves to where it lands.
//   particles small fixed pools; sprouts and the kiln's colour change in steps.
// The extra inputs and the cold rest come from the beer's own menu words (brew-recipe.ts).

import {
  along,
  BALE,
  EXTRA,
  FERM,
  GERM,
  type Into,
  JAR,
  KETTLE,
  KILN,
  type Layout,
  LIQUID_LINKS,
  type LinkGeo,
  MASH,
  MILL,
  type Pt,
  RIM,
  STEEP,
  type Stage,
  spread,
} from "./brew-layout";
import type { ExtraKind, Recipe } from "./brew-recipe";

export type Put = (key: string, attr: string, value: string) => void;

//            grain  water  drain  floor  kiln   mill   crack  water  run    xfer   fill
const RATE = [0.45, 0.45, 0.7, 0.55, 0.55, 0.65, 0.7, 0.7, 0.6, 0.6, 0.6];
const GRAIN = 0.5;
const STEEP_WATER = 0.4;
const MASH_WATER = 1;
const BOIL_OFF = 0.1;
export const CAP = [0.45, 0.15, 0.15, 0.15]; // the keg and three cans: the 0.9 that is left
export const SLOT_X = [150, 108, 78, 48];
const STEP_X = [42, 30, 30, 30];
const GRAVITY = 900;
const TOSS = 520; // gravity for things thrown, a little gentler to read
const V0 = 60;
const TILT = 0.3;

const fallTime = (d: number) => (-V0 + Math.sqrt(V0 * V0 + 2 * GRAVITY * Math.max(0, d))) / GRAVITY;
const fallDist = (tau: number) => (tau <= 0 ? 0 : V0 * tau + 0.5 * GRAVITY * tau * tau);
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => {
  const k = clamp(x, 0, 1);
  return k * k * (3 - 2 * k);
};
const f1 = (n: number) => n.toFixed(1);
const f2 = (n: number) => n.toFixed(2);

// ---- levels from volumes, each in its station's coordinates -------------------------------

function steepY(v: number) {
  const a = v * 3298;
  if (a <= 728) return STEEP.apex - Math.sqrt(a / 1.0769);
  return STEEP.seam - (a - 728) / 56;
}
const steepHalf = (y: number) =>
  y <= STEEP.seam ? STEEP.a : (STEEP.a * (STEEP.apex - y)) / (STEEP.apex - STEEP.seam);
const mashY = (v: number) => MASH.bottom - v * 58;
const kettleY = (v: number) => 104 - v * 70;
function fermY(v: number) {
  const a = v * 14471;
  if (a <= 1936) return 214 - Math.sqrt(a);
  return 170 - (a - 1936) / 88;
}
const fermHalf = (y: number) => (y <= 170 ? FERM.a : Math.max(0, 214 - y));
function hopperY(g: number) {
  const a = Math.min(2016, g * 2584);
  return (80 - Math.sqrt(Math.max(0, 6400 - 3.0476 * (2016 - a)))) / 1.5238;
}
const tankY = (v: number) => 89 - (v / (STEEP_WATER + MASH_WATER)) * 58;
const jarY = (v: number) => 48 - v * 28;
const contY = (i: number, v: number) =>
  i === 0 ? 92 - (v / (CAP[0] ?? 1)) * 54 : 92 - (v / (CAP[i] ?? 1)) * 34;

// ---- surfaces ---------------------------------------------------------------------------

interface Row {
  n: number;
  x0: number;
  x1: number;
  h: Float32Array;
  v: Float32Array;
  /** how long the surface has hardly moved, seconds */
  calm: number;
}
const row = (n: number, x0: number, x1: number): Row => ({
  n,
  x0,
  x1,
  h: new Float32Array(n),
  v: new Float32Array(n),
  calm: 0,
});
const xOf = (r: Row, i: number) => r.x0 + (i * (r.x1 - r.x0)) / (r.n - 1);
const rest = (r: Row, i: number, tilt: number) =>
  clamp(-Math.tan(tilt) * (xOf(r, i) - (r.x0 + r.x1) / 2), -12, 12);

function rowStep(r: Row, dt: number, tilt: number) {
  let moved = 0;
  for (let i = 0; i < r.n; i++) {
    const acc = -150 * ((r.h[i] ?? 0) - rest(r, i, tilt)) - 3.4 * (r.v[i] ?? 0);
    r.v[i] = (r.v[i] ?? 0) + acc * dt;
    const before = r.h[i] ?? 0;
    r.h[i] = clamp(before + (r.v[i] ?? 0) * dt, -14, 14);
    moved = Math.max(moved, Math.abs((r.h[i] ?? 0) - before) / dt);
  }
  for (let pass = 0; pass < 3; pass++)
    for (let i = 0; i < r.n; i++) {
      if (i > 0) r.v[i - 1] = (r.v[i - 1] ?? 0) + 14 * ((r.h[i] ?? 0) - (r.h[i - 1] ?? 0)) * dt;
      if (i < r.n - 1) r.v[i + 1] = (r.v[i + 1] ?? 0) + 14 * ((r.h[i] ?? 0) - (r.h[i + 1] ?? 0)) * dt;
    }
  // under a lean the neighbours hold each spring a little off its rest for good, so
  // stillness is judged by motion: under a fifth of a unit a second for a quarter second
  r.calm = moved < 0.2 ? r.calm + dt : 0;
}
const rowStill = (r: Row) => r.calm > 0.25;
function kick(r: Row, x: number, amount: number) {
  r.calm = 0;
  const i = Math.round(((x - r.x0) / (r.x1 - r.x0)) * (r.n - 1));
  if (i < 0 || i >= r.n) return;
  r.v[i] = (r.v[i] ?? 0) + amount;
  if (i > 0) r.v[i - 1] = (r.v[i - 1] ?? 0) + amount * 0.5;
  if (i < r.n - 1) r.v[i + 1] = (r.v[i + 1] ?? 0) + amount * 0.5;
}
function rowAt(r: Row, x: number) {
  const at = clamp(((x - r.x0) / (r.x1 - r.x0)) * (r.n - 1), 0, r.n - 1.001);
  const lo = Math.floor(at);
  return (r.h[lo] ?? 0) + ((r.h[lo + 1] ?? 0) - (r.h[lo] ?? 0)) * (at - lo);
}

/** a smooth line through the midpoints of a row of points */
function curve(pts: Pt[]) {
  const first = pts[0] as Pt;
  let d = `${f1(first[0])} ${f1(first[1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i] as Pt;
    const q = pts[i + 1] as Pt;
    d += `Q${f1(p[0])} ${f1(p[1])} ${f1((p[0] + q[0]) / 2)} ${f1((p[1] + q[1]) / 2)}`;
  }
  const last = pts[pts.length - 1] as Pt;
  return `${d}L${f1(last[0])} ${f1(last[1])}`;
}

/** A liquid in a round vessel: the body under the far edge of its surface, the surface as an
    ellipse with the springs drawn across it, and (if any) a head of foam on it. */
function liquid(r: Row | null, cx: number, a: number, y: number, floor: number, head = 0, t = 0) {
  const n = r?.n ?? 7;
  const b = a * RIM;
  const back: Pt[] = [];
  const front: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const u = (2 * i) / (n - 1) - 1;
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const h = r ? (r.h[i] ?? 0) : 0;
    const x = spread(cx, a, i, n);
    back.push([x, y - b * s + h]);
    front.push([x, y + b * s + h]);
  }
  const body = `M${curve(back)}V${f1(floor)}H${f1(cx - a - 2)}Z`;
  const top = `M${curve(back)}L${curve([...front].reverse())}Z`;
  let foam = "";
  if (head > 0.6) {
    const crown = back.map(([x, by], i): Pt => {
      const bump = Math.abs(Math.sin(i * 1.05 + t * 0.9)) * Math.min(3.5, head * 0.35);
      return [x, by - head - bump];
    });
    const under = front.map(([x, fy]): Pt => [x, fy - head * 0.3]).reverse();
    foam = `M${curve(crown)}L${curve(under)}Z`;
  }
  return { body, top, foam };
}

/** a curl of warm air or steam at p (0..1) of its life */
function wisp(x: number, y0: number, p: number, t: number, seed: number) {
  const rise = 3 + 22 * p;
  const len = 7 + 9 * p;
  const amp = (2 + 3.5 * p) * Math.sin(t * 1.1 + seed);
  const y = y0 - rise;
  return `M${f1(x)} ${f1(y)}C${f1(x + amp)} ${f1(y - len / 3)} ${f1(x - amp)} ${f1(y - (2 * len) / 3)} ${f1(x)} ${f1(y - len)}`;
}
const wispInk = (p: number) => 0.5 * Math.sin(Math.PI * p ** 0.7);

/** smooth noise in -1..1 (the fire pit's) */
const noise = (t: number, seed: number) =>
  0.5 * Math.sin(t * 1.7 + seed) +
  0.3 * Math.sin(t * 3.1 + seed * 2.3) +
  0.2 * Math.sin(t * 5.3 + seed * 4.1);
interface Tongue {
  bx: number;
  by: number;
  w: number;
  h: number;
  seed: number;
  speed: number;
}
const KETTLE_FIRE: Tongue[] = [
  { bx: 66, by: 123, w: 5, h: 12, seed: 1.3, speed: 3.6 },
  { bx: 84, by: 123, w: 5, h: 13, seed: 4.7, speed: 3.3 },
  { bx: 75, by: 124, w: 7.5, h: 17, seed: 8.2, speed: 2.9 },
  { bx: 75.5, by: 124, w: 3.4, h: 9, seed: 11.6, speed: 3.9 },
];
const KILN_FIRE: Tongue[] = [
  { bx: 45, by: 74, w: 4, h: 8, seed: 2.2, speed: 3.4 },
  { bx: 56, by: 74, w: 4, h: 9, seed: 5.1, speed: 3.1 },
  { bx: 50.5, by: 74, w: 2.4, h: 5, seed: 9.4, speed: 3.8 },
];
function tongue(g: Tongue, t: number, heat: number) {
  const ts = t * g.speed;
  const h = g.h * heat * (1 + 0.2 * noise(ts, g.seed));
  const a = 0.16 * noise(ts * 0.7, g.seed + 9);
  const tx = g.bx - Math.sin(a) * h;
  const ty = g.by - Math.cos(a) * h;
  const curl = g.w * 0.9 * noise(ts * 1.3, g.seed + 4);
  const mid = (tx - g.bx) * 0.35;
  return (
    `M${f1(g.bx - g.w)} ${g.by}C${f1(g.bx - g.w * 1.35 + mid)} ${f1(g.by - h * 0.42)} ${f1(tx - g.w * 0.25 + curl)} ${f1(ty + h * 0.36)} ${f1(tx)} ${f1(ty)}` +
    `C${f1(tx + g.w * 0.45 + curl)} ${f1(ty + h * 0.4)} ${f1(g.bx + g.w * 1.35 + mid)} ${f1(g.by - h * 0.38)} ${f1(g.bx + g.w)} ${g.by}Z`
  );
}

// ---- the model's state ------------------------------------------------------------------

interface Link {
  open: boolean;
  flow: number;
  cum: number;
  landed: number;
  hist: number[];
  headT: number;
  tailT: number;
  enter: number;
  ty: number;
}
interface Dot {
  on: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  s: number; // along an auger; -1 once falling
  age: number;
  T: number; // flight time, for thrown things
  link: number;
  fill: string;
  into: Into | "yeast";
}
interface Hop {
  st: 0 | 1 | 2 | 3 | 4; // unused, flying, floating in the kettle, on its bottom, gone in
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  age: number;
  T: number;
  into: "kettle" | "ferm";
}
interface Lid {
  st: 0 | 1 | 2;
  y: number;
  vy: number;
}

export interface Brew {
  t: number;
  stage: Stage;
  stageT: number;
  recipe: Recipe;
  sack: number;
  tankS: number;
  tankM: number;
  jar: number;
  steepG: number;
  steepW: number;
  drained: number;
  floorG: number;
  sprout: number;
  rake: number;
  kilnG: number;
  toast: number;
  kilnHeat: number;
  heap: number;
  mashW: number;
  mashG: number;
  mashC: number;
  mashSteam: number;
  kettle: number;
  heat: number;
  boil: number;
  evap: number;
  ferm: number;
  fermP: number;
  krausen: number;
  co2: number;
  frost: number;
  yeastIn: boolean;
  pitchT: number;
  jarTip: number;
  /** extra inputs still to go in, and when the next goes */
  exLeft: number[];
  exNext: number[];
  exDone: Record<Into, boolean>;
  dryDone: boolean;
  cont: number[];
  belt: number;
  beltFrom: number;
  beltTo: number;
  beltT: number;
  slot: number;
  outPhase: 0 | 1 | 2 | 3;
  lids: Lid[];
  hops: Hop[];
  hopsTossed: number;
  links: Link[];
  mash: Row;
  ket: Row;
  fer: Row;
  paddle: { a: number; v: number; stir: number; ph: number };
  stirred: boolean;
  tilt: number;
  tiltV: number;
  tiltTo: number;
  roller: number;
  spin: number;
  grains: Dot[];
  cracked: Dot[];
  sb: Dot[];
  kb: Dot[];
  cb: Dot[];
  yeast: Dot[];
  fx: Dot[];
  blip: Dot;
  nextBlip: number;
}

export const POOLS = {
  grains: 16,
  cracked: 12,
  sb: 8,
  kb: 12,
  cb: 14,
  yeast: 8,
  fx: 14,
  hops: 5,
  sprouts: 10,
} as const;
const dot = (): Dot => ({
  on: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  r: 1,
  s: 0,
  age: 0,
  T: 1,
  link: 0,
  fill: "",
  into: "kettle",
});
const pool = (n: number) => Array.from({ length: n }, dot);
const newLink = (): Link => ({
  open: false,
  flow: 0,
  cum: 0,
  landed: 0,
  hist: [],
  headT: -1,
  tailT: -1,
  enter: 0,
  ty: 0,
});
const NO_RECIPE: Recipe = { lager: false, dryHop: false, hazy: false, extras: [] };
const HOP_REST: readonly (readonly [number, number])[] = [
  [52, 0.5],
  [74, -0.4],
  [98, 0.9],
];
/** where the sprouts sit on the floor's bed: across, and back */
export const SPROUTS: readonly Pt[] = [
  [0.08, 0.2],
  [0.2, 0.7],
  [0.31, 0.35],
  [0.42, 0.85],
  [0.5, 0.15],
  [0.6, 0.55],
  [0.7, 0.9],
  [0.78, 0.3],
  [0.88, 0.7],
  [0.95, 0.15],
];
export const FILLS: Record<ExtraKind | "yeast", string> = {
  fruit: "var(--currant)",
  citrus: "var(--pils)",
  brine: "var(--brew-water)",
  spice: "var(--ember-deep)",
  grain: "var(--gold)",
  salt: "var(--card)",
  yeast: "var(--card)",
};
const GRAIN_FILL = ["var(--brew-grain)", "", "", "var(--brew-wet)", "var(--brew-wet)", "var(--brew-toast)"];

export function createBrew(recipe: Recipe = NO_RECIPE): Brew {
  return {
    t: 0.8,
    stage: "done",
    stageT: 0,
    recipe,
    sack: GRAIN,
    tankS: STEEP_WATER,
    tankM: MASH_WATER,
    jar: 1,
    steepG: 0,
    steepW: 0,
    drained: 0,
    floorG: 0,
    sprout: 0,
    rake: -1,
    kilnG: 0,
    toast: 0,
    kilnHeat: 0,
    heap: 0,
    mashW: 0,
    mashG: 0,
    mashC: 0,
    mashSteam: 0,
    kettle: 0,
    heat: 0,
    boil: 0,
    evap: 0,
    ferm: 0,
    fermP: 0,
    krausen: 0,
    co2: 0,
    frost: 0,
    yeastIn: false,
    pitchT: -1,
    jarTip: 0,
    exLeft: [0, 0],
    exNext: [0, 0],
    exDone: { mash: false, kettle: false, ferm: false },
    dryDone: false,
    cont: [0, 0, 0, 0],
    belt: 0,
    beltFrom: 0,
    beltTo: 0,
    beltT: 0,
    slot: 0,
    outPhase: 0,
    lids: [0, 1, 2].map(() => ({ st: 0, y: 0, vy: 0 })),
    hops: Array.from({ length: POOLS.hops }, () => ({
      st: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      a: 0,
      age: 0,
      T: 1,
      into: "kettle",
    })),
    hopsTossed: 0,
    links: Array.from({ length: 11 }, newLink),
    mash: row(9, MASH.cx - MASH.a, MASH.cx + MASH.a),
    ket: row(9, KETTLE.cx - KETTLE.a, KETTLE.cx + KETTLE.a),
    fer: row(9, FERM.cx - FERM.a, FERM.cx + FERM.a),
    paddle: { a: 0, v: 0, stir: 0, ph: 0 },
    stirred: false,
    tilt: 0,
    tiltV: 0,
    tiltTo: 0,
    roller: 0,
    spin: 0,
    grains: pool(POOLS.grains),
    cracked: pool(POOLS.cracked),
    sb: pool(POOLS.sb),
    kb: pool(POOLS.kb),
    cb: pool(POOLS.cb),
    yeast: pool(POOLS.yeast),
    fx: pool(POOLS.fx),
    blip: dot(),
    nextBlip: 0,
  };
}

/** The whole process at once: every vessel full, the keg and cans filled and lidded. What the
    server draws, and all there is without JavaScript or with reduced motion. */
export function stillBrew(L: Layout): Brew {
  const s = createBrew();
  s.steepG = GRAIN * 0.6;
  s.steepW = STEEP_WATER * 0.8;
  s.floorG = GRAIN * 0.8;
  s.sprout = 0.8;
  s.kilnG = GRAIN * 0.7;
  s.toast = 0.75;
  s.kilnHeat = 1;
  s.heap = 0.16;
  s.mashW = 1;
  s.mashG = GRAIN;
  s.mashC = 0.7;
  s.mashSteam = 1;
  s.kettle = 1;
  s.heat = 1;
  s.boil = 1;
  s.ferm = 0.9;
  s.fermP = 1;
  s.krausen = 5;
  s.cont = [...CAP];
  s.belt = STEP_X.reduce((a, b) => a + b, 0);
  s.slot = 4;
  for (const l of s.lids) l.st = 2;
  const K = L.at.kettle;
  s.hops.forEach((h, i) => {
    const r = HOP_REST[i];
    if (!r) return;
    h.st = 2;
    h.x = K[0] + r[0];
    h.y = K[1] + kettleY(1) - 1;
    h.a = r[1];
  });
  return s;
}

const ORDER: Stage[] = [
  "grain",
  "steep",
  "germ",
  "kiln",
  "mill",
  "mash",
  "runoff",
  "boil",
  "transfer",
  "ferment",
  "out",
];

/** Everything back to where a stage starts, as if the stages before it had just run. */
export function setStage(s: Brew, stage: Stage, L: Layout) {
  const at = ORDER.indexOf(stage);
  Object.assign(s, {
    sack: GRAIN,
    tankS: STEEP_WATER,
    tankM: MASH_WATER,
    jar: 1,
    steepG: 0,
    steepW: 0,
    drained: 0,
    floorG: 0,
    sprout: 0,
    rake: -1,
    kilnG: 0,
    toast: 0,
    heap: 0,
    mashW: 0,
    mashG: 0,
    mashC: 0,
    kettle: 0,
    heat: 0,
    boil: 0,
    evap: 0,
    ferm: 0,
    fermP: 0,
    krausen: 0,
    co2: 0,
    yeastIn: false,
    pitchT: -1,
    cont: [0, 0, 0, 0],
    belt: 0,
    beltT: 0,
    slot: 0,
    outPhase: 0,
    hopsTossed: 0,
    stirred: false,
    exLeft: [0, 0],
    exNext: [0, 0],
    exDone: { mash: at > 4, kettle: at > 7, ferm: at > 9 },
    dryDone: at > 9,
  });
  for (const l of s.lids) {
    l.st = 0;
    l.y = 0;
    l.vy = 0;
  }
  for (const h of s.hops) h.st = 0;
  s.links = Array.from({ length: 11 }, newLink);
  for (const p of [s.grains, s.cracked, s.sb, s.kb, s.cb, s.yeast, s.fx]) for (const d of p) d.on = false;
  s.blip.on = false;
  s.paddle.stir = 0;

  if (at >= 1) {
    s.sack = 0;
    s.tankS = 0;
    s.steepG = GRAIN;
    s.steepW = STEEP_WATER;
  }
  if (at >= 2) {
    s.steepW = 0;
    s.drained = STEEP_WATER;
  }
  if (at >= 3) {
    s.steepG = 0;
    s.floorG = GRAIN;
    s.sprout = 1;
  }
  if (at >= 4) {
    s.floorG = 0;
    s.kilnG = GRAIN;
    s.toast = 1;
  }
  if (at >= 5) {
    s.kilnG = 0;
    s.tankM = 0;
    s.mashW = MASH_WATER;
    s.mashG = GRAIN;
    s.mashC = 0.35;
    s.paddle.stir = 2.2;
    s.stirred = true;
  }
  if (at >= 6) s.mashC = 1;
  if (at >= 7) {
    s.mashW = 0;
    s.kettle = MASH_WATER;
    s.heat = 1;
    s.boil = 0.6;
  }
  if (at >= 8) {
    s.kettle = 0;
    s.heat = 0;
    s.boil = 0;
    s.ferm = MASH_WATER - BOIL_OFF;
    const K = L.at.kettle;
    s.hops.forEach((h, i) => {
      const r = HOP_REST[i];
      if (!r) return;
      h.st = 3;
      h.x = K[0] + r[0];
      h.y = K[1] + 100;
      h.a = r[1];
    });
    s.hopsTossed = 3;
  }
  if (at >= 10) {
    s.fermP = 1;
    s.yeastIn = true;
    s.jar = 0.6;
  }
  s.stage = stage === "transfer" ? "ferment" : stage;
  s.stageT = 0;
}

// ---- pipes and augers --------------------------------------------------------------------

function enteredBy(h: number[], t: number) {
  if (h.length < 2) return 0;
  if (t <= (h[0] ?? 0)) return h[1] ?? 0;
  for (let i = h.length - 2; i >= 0; i -= 2) {
    const ti = h[i] ?? 0;
    if (ti <= t) {
      const ci = h[i + 1] ?? 0;
      if (i + 2 >= h.length) return ci;
      const tn = h[i + 2] ?? 0;
      const cn = h[i + 3] ?? 0;
      return ci + ((cn - ci) * (t - ti)) / (tn - ti || 1);
    }
  }
  return h[1] ?? 0;
}

/** Let up to what the valve allows into link i; returns how much went in.
    `last`: the source will not be topped up again, so its last scrap goes too. */
function move(s: Brew, g: LinkGeo, i: number, dt: number, avail: number, cap: number, last: boolean) {
  const k = s.links[i] as Link;
  const rate = RATE[i] ?? 0.3;
  if (k.tailT >= 0) {
    k.flow = 0;
    k.enter = 0;
    return 0;
  }
  k.flow += ((k.open ? 1 : 0) - k.flow) * Math.min(1, dt * 8);
  let amt = Math.max(0, Math.min(rate * k.flow * dt, avail, cap));
  if (k.open && last && avail - amt < 2e-4) amt = avail;
  if (amt > 1e-7 && k.headT < 0) {
    k.headT = s.t;
    k.hist.length = 0;
    k.hist.push(s.t - dt, k.cum);
  }
  k.cum += amt;
  k.enter = amt / dt;
  if (k.headT >= 0) {
    k.hist.push(s.t, k.cum);
    while (k.hist.length >= 6 && (k.hist[2] ?? 0) < s.t - g.T - 1.2) k.hist.splice(0, 2);
    if (k.enter < rate * 0.05 && (!k.open || (last && avail - amt <= 1e-6))) k.tailT = s.t;
  }
  return amt;
}

/** What arrives this step at the surface `ty` (whole-drawing y) below link i's outlet. */
function land(s: Brew, g: LinkGeo, i: number, ty: number) {
  const k = s.links[i] as Link;
  k.ty = ty;
  if (k.headT < 0) return 0;
  const fall = fallTime(ty - g.out[1]);
  const by = Math.max(k.landed, enteredBy(k.hist, s.t - g.T - fall));
  const amt = by - k.landed;
  k.landed = by;
  if (k.tailT >= 0 && s.t - k.tailT > g.T + fall + 0.03 && k.cum - k.landed < 1e-7) {
    k.headT = -1;
    k.tailT = -1;
    k.hist.length = 0;
    k.landed = k.cum;
  }
  return amt;
}
const empty = (k: Link | undefined) => !k || k.headT < 0;

/** grains ride an auger at its speed, then fall to the surface below */
function grains(s: Brew, g: LinkGeo, i: number, ps: Dot[], dt: number, r: number) {
  const k = s.links[i] as Link;
  const rate = RATE[i] ?? 0.2;
  if (k.enter > 0 && Math.random() < (k.enter / rate) * 16 * dt) {
    const p = ps.find((d) => !d.on);
    if (p) {
      p.on = true;
      p.s = 0;
      p.link = i;
      p.fill = GRAIN_FILL[i] ?? "";
      p.age = (Math.random() - 0.5) * 1.6; // across the auger
      p.r = r * (0.8 + Math.random() * 0.4);
    }
  }
  const speed = g.len / g.T;
  for (const p of ps) {
    if (!p.on || p.link !== i) continue;
    if (p.s >= 0) {
      p.s += speed * dt;
      if (p.s >= g.len) {
        p.s = -1;
        p.x = g.out[0] + p.age;
        p.y = g.out[1];
        p.vx = g.dir[0] * speed * 0.4;
        p.vy = Math.max(V0 * 0.6, g.dir[1] * speed);
      } else {
        const at = along(g, p.s);
        p.x = at[0] + p.age * Math.abs(g.dir[1]);
        p.y = at[1] + p.age * Math.abs(g.dir[0]);
      }
    } else {
      p.vy += GRAVITY * dt;
      p.vx *= 1 - 2 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y >= k.ty) p.on = false;
    }
  }
}

/** set something flying from a to b in T seconds */
function throwTo(
  o: { x: number; y: number; vx: number; vy: number; age: number; T: number },
  a: Pt,
  b: Pt,
  T: number,
) {
  o.x = a[0];
  o.y = a[1];
  o.vx = (b[0] - a[0]) / T;
  o.vy = (b[1] - a[1] - 0.5 * TOSS * T * T) / T;
  o.age = 0;
  o.T = T;
}
function tossDot(s: Brew, a: Pt, b: Pt, T: number, fill: string, into: Into | "yeast", r = 1.8) {
  const d = s.fx.find((x) => !x.on);
  if (!d) return;
  d.on = true;
  throwTo(d, a, [b[0] + (Math.random() - 0.5) * 8, b[1]], T * (0.9 + Math.random() * 0.2));
  d.fill = fill;
  d.into = into;
  d.r = r * (0.8 + Math.random() * 0.4);
}
function tossHop(s: Brew, L: Layout, i: number, into: "kettle" | "ferm") {
  const h = s.hops[i];
  if (!h) return;
  const from: Pt = [L.at.hops[0] + BALE.from[0], L.at.hops[1] + BALE.from[1]];
  const aim = L.aim[into === "kettle" ? "kettle" : "ferm"];
  h.st = 1;
  h.into = into;
  h.a = (Math.random() - 0.5) * 1.2;
  throwTo(h, from, [aim[0] + (into === "kettle" ? (i - 1) * 22 : 0), aim[1]], into === "kettle" ? 0.75 : 0.9);
}

// ---- the batch, stage by stage -------------------------------------------------------------

function go(s: Brew, stage: Stage) {
  s.stage = stage;
  s.stageT = 0;
  for (const k of s.links) k.open = false;
}

/** start the extra inputs that go into this vessel, if the beer has any */
function addExtras(s: Brew, into: Into) {
  if (s.exDone[into]) return;
  s.exDone[into] = true;
  s.recipe.extras.forEach((e, i) => {
    if (e.into !== into) return;
    s.exLeft[i] = 6;
    s.exNext[i] = i * 0.35;
  });
}

function control(s: Brew, L: Layout, dt: number) {
  const k = s.links;
  const L10 = k[10] as Link;
  switch (s.stage) {
    case "grain":
      (k[0] as Link).open = s.sack > 0;
      (k[1] as Link).open = s.stageT > 0.2 && s.tankS > 0;
      if (s.stageT > 1 && s.sack <= 0 && s.tankS <= 0 && empty(k[0]) && empty(k[1])) go(s, "steep");
      break;
    case "steep":
      // soak, with air bubbling up through it; then the water goes down the drain
      (k[2] as Link).open = s.stageT > 0.7 && s.steepW > 0;
      if (s.stageT > 0.7 && s.steepW <= 0 && empty(k[2])) go(s, "germ");
      break;
    case "germ":
      (k[3] as Link).open = s.steepG > 0;
      if (s.steepG <= 0 && empty(k[3])) {
        s.sprout = Math.min(1, s.sprout + dt / 1.1);
        if (s.rake < 0 && s.sprout > 0.25) s.rake = 0;
      }
      if (s.rake >= 0 && s.rake < 1) s.rake = Math.min(1, s.rake + dt / 0.9);
      if (s.sprout >= 1 && s.rake >= 1) go(s, "kiln");
      break;
    case "kiln":
      (k[4] as Link).open = s.floorG > 0;
      if (s.floorG <= 0 && empty(k[4])) s.toast = Math.min(1, s.toast + dt / 1.1);
      if (s.toast >= 1) go(s, "mill");
      break;
    case "mill":
      (k[5] as Link).open = s.kilnG > 0;
      (k[6] as Link).open = true;
      (k[7] as Link).open = s.tankM > 0;
      if (s.stageT > 0.9 && !s.stirred) {
        s.paddle.stir = Math.max(s.paddle.stir, 2.6);
        s.stirred = true;
      }
      if (s.mashW > 0.3) addExtras(s, "mash");
      if (
        s.stageT > 1 &&
        s.kilnG <= 0 &&
        s.heap <= 0 &&
        s.tankM <= 0 &&
        empty(k[5]) &&
        empty(k[6]) &&
        empty(k[7]) &&
        s.exLeft.every((n) => n <= 0)
      )
        go(s, "mash");
      break;
    case "mash":
      if (s.stageT > 0.5 && s.paddle.stir <= 0 && s.mashC >= 1) go(s, "runoff");
      break;
    case "runoff":
      (k[8] as Link).open = s.mashW > 0;
      if (s.mashW <= 0 && empty(k[8])) go(s, "boil");
      break;
    case "boil": {
      const due = [0.2, 0.55, 0.9];
      while (s.hopsTossed < 3 && s.stageT >= (due[s.hopsTossed] ?? 9))
        tossHop(s, L, s.hopsTossed++, "kettle");
      if (s.stageT > 1) addExtras(s, "kettle");
      if (s.evap >= BOIL_OFF - 1e-6 && s.stageT > 1.9 && s.exLeft.every((n) => n <= 0)) go(s, "transfer");
      break;
    }
    case "transfer":
      (k[9] as Link).open = s.kettle > 0;
      if (!s.yeastIn && s.ferm > 0.3) pitch(s);
      if (s.kettle <= 0 && empty(k[9])) go(s, "ferment");
      break;
    case "ferment": {
      if (!s.yeastIn) pitch(s);
      if (s.stageT > 0.4) addExtras(s, "ferm");
      if (s.recipe.dryHop && !s.dryDone && s.stageT > 1.2) {
        s.dryDone = true;
        tossHop(s, L, 3, "ferm");
        tossHop(s, L, 4, "ferm");
      }
      s.fermP = Math.max(s.fermP, smooth((s.stageT - 0.3) / 2.4));
      const end = s.recipe.lager ? 4 : 3;
      if (s.stageT > end && s.exLeft.every((n) => n <= 0)) go(s, "out");
      break;
    }
    case "out": {
      if (s.outPhase === 0) {
        L10.open = true;
        // shut when what is in the line, and what the closing valve still lets by, will
        // top this one up; the last can takes whatever is left in the tank
        const ahead = (s.cont[s.slot] ?? 0) + (L10.cum - L10.landed) + (RATE[10] ?? 0) * L10.flow * 0.11;
        const lastOne = s.slot === 3;
        if ((!lastOne && ahead >= (CAP[s.slot] ?? 0) - 1e-3) || s.ferm <= 0) {
          L10.open = false;
          s.outPhase = 1;
        }
      } else if (s.outPhase === 1) {
        if (empty(L10)) {
          s.outPhase = 2;
          s.beltFrom = s.belt;
          s.beltTo = s.belt + (STEP_X[s.slot] ?? 0);
          s.beltT = 0;
        }
      } else if (s.outPhase === 2) {
        s.beltT += dt / 0.4;
        s.belt = s.beltFrom + (s.beltTo - s.beltFrom) * smooth(s.beltT);
        if (s.beltT >= 1) {
          const lid = s.lids[s.slot - 1];
          if (lid) {
            lid.st = 1;
            lid.y = -38;
            lid.vy = 0;
          }
          s.slot++;
          s.outPhase = s.slot < 4 ? 0 : 3;
        }
      } else if (s.lids.every((l) => l.st === 2)) go(s, "done");
      break;
    }
    default:
      break;
  }
}

function pitch(s: Brew) {
  s.yeastIn = true;
  s.pitchT = 0;
}

// ---- one step ---------------------------------------------------------------------------

export function step(s: Brew, L: Layout, dt: number) {
  s.t += dt;
  s.stageT += dt;
  control(s, L, dt);

  const { steep: S, germ: Gm, kiln: Kn, mill: M, mash: H, kettle: K, ferm: F, out: O } = L.at;
  const g = (i: number) => L.links[i] as LinkGeo;

  s.tiltV += (70 * (s.tiltTo - s.tilt) - 5.5 * s.tiltV) * dt;
  s.tilt += s.tiltV * dt;
  const mashLevel = mashY(s.mashW + s.mashG);
  const ketLevel = kettleY(s.kettle);
  const fermLevel = fermY(s.ferm);
  const splash = (r: Row, gl: LinkGeo, origin: Pt, amt: number, i: number, scale = 1) => {
    if (amt <= 1e-7) return;
    const norm = amt / dt / (RATE[i] ?? 0.3);
    kick(r, gl.out[0] - origin[0], (0.6 + Math.random() * 0.8) * 420 * norm * dt * scale);
  };
  const germTop = Gm[1] + GERM.front - s.floorG * GERM.thick;
  const kilnTop = Kn[1] + KILN.front - s.kilnG * KILN.thick;

  // malting: the sack and the tank into the steep; its water to the drain; the grain to the
  // floor, to the kiln, and on to the mill
  s.sack -= move(s, g(0), 0, dt, s.sack, 1, true);
  s.steepG += land(s, g(0), 0, S[1] + steepY(s.steepG + s.steepW));
  s.tankS -= move(s, g(1), 1, dt, s.tankS, 1, true);
  s.steepW += land(s, g(1), 1, S[1] + steepY(s.steepG + s.steepW));
  s.steepW -= move(s, g(2), 2, dt, s.steepW, 1, true);
  s.steepW = Math.max(0, s.steepW);
  s.drained += land(s, g(2), 2, L.drain[1]);
  s.steepG -= move(s, g(3), 3, dt, s.steepG, 1, true);
  s.steepG = Math.max(0, s.steepG);
  s.floorG += land(s, g(3), 3, germTop - 6);
  s.floorG -= move(s, g(4), 4, dt, s.floorG, 1, true);
  s.floorG = Math.max(0, s.floorG);
  s.kilnG += land(s, g(4), 4, kilnTop - 5);
  s.kilnG -= move(s, g(5), 5, dt, s.kilnG, 1, true);
  s.kilnG = Math.max(0, s.kilnG);
  s.heap += land(s, g(5), 5, M[1] + hopperY(s.heap) - 2);
  s.kilnHeat += ((s.stage === "kiln" ? 1 : 0) - s.kilnHeat) * Math.min(1, dt * 1.5);
  // the steep is aired from below while the grain soaks
  if ((s.stage === "grain" || s.stage === "steep") && s.steepW > 0.05 && Math.random() < 14 * dt) {
    const b = s.sb.find((d) => !d.on);
    if (b) {
      b.on = true;
      b.x = STEEP.cx + (Math.random() - 0.5) * 16;
      b.y = STEEP.apex - 6;
      b.vy = 8;
      b.r = 0.8 + Math.random();
    }
  }
  const sy = steepY(s.steepG + s.steepW);
  for (const b of s.sb) {
    if (!b.on) continue;
    b.vy = Math.min(70, b.vy + 60 * dt);
    b.y -= b.vy * dt;
    b.x += Math.sin(s.t * 6 + b.r * 9) * 6 * dt;
    if (b.y <= sy + 1) b.on = false;
  }

  // the mill into the mash
  const millLast = s.kilnG <= 0 && empty(s.links[5]);
  s.heap -= move(s, g(6), 6, dt, s.heap, s.heap * 5 * dt + 1e-5, millLast);
  s.heap = Math.max(0, s.heap);
  let a = land(s, g(6), 6, H[1] + mashLevel + rowAt(s.mash, g(6).out[0] - H[0]));
  s.mashG += a;
  splash(s.mash, g(6), H, a, 6, 0.35);
  const turning = (s.links[6] as Link).flow > 0.05 && (s.heap > 0 || !empty(s.links[6])) ? 1 : 0;
  s.spin += (turning - s.spin) * Math.min(1, dt * 4);
  s.roller += s.spin * 7 * dt;
  for (const i of [0, 3, 4, 5]) grains(s, g(i), i, s.grains, dt, 1.6);
  grains(s, g(6), 6, s.cracked, dt, 1.3);

  // water into the mash
  s.tankM -= move(s, g(7), 7, dt, s.tankM, 1, true);
  a = land(s, g(7), 7, H[1] + mashLevel + rowAt(s.mash, g(7).out[0] - H[0]));
  s.mashW += a;
  splash(s.mash, g(7), H, a, 7);
  if (s.mashW > 0.15 && s.mashG > 0.1) s.mashC = Math.min(1, s.mashC + dt * (s.paddle.stir > 0 ? 0.5 : 0.35));
  s.mashSteam += ((s.mashW > 0.05 ? 1 : 0) - s.mashSteam) * Math.min(1, dt * 1.5);

  // the run-off into the kettle
  s.mashW -= move(s, g(8), 8, dt, s.mashW, 1, true);
  s.mashW = Math.max(0, s.mashW);
  a = land(s, g(8), 8, K[1] + ketLevel + rowAt(s.ket, g(8).out[0] - K[0]));
  s.kettle += a;
  splash(s.ket, g(8), K, a, 8);

  // the boil
  const fire = (s.stage === "runoff" && s.kettle > 0.12) || s.stage === "boil" ? 1 : 0;
  s.heat += (fire - s.heat) * Math.min(1, dt * 1.2);
  s.boil += ((s.kettle > 0.05 ? s.heat : 0) - s.boil) * Math.min(1, dt * 0.8);
  if (s.stage === "boil") {
    const e = Math.min(s.kettle, 0.06 * s.boil * dt, BOIL_OFF - s.evap);
    if (e > 0) {
      s.kettle -= e;
      s.evap += e;
    }
  }
  if (s.boil > 0.05) {
    if (Math.random() < s.boil * 20 * dt) {
      const b = s.kb.find((d) => !d.on);
      if (b) {
        b.on = true;
        b.x = 24 + Math.random() * 102;
        b.y = 108;
        b.vy = 10;
        b.r = 1 + Math.random() * 1.6;
      }
    }
    for (let n = 0; n < 2; n++) {
      const i = Math.floor(Math.random() * s.ket.n);
      s.ket.v[i] = (s.ket.v[i] ?? 0) + (Math.random() - 0.5) * s.boil * 1500 * dt;
    }
  }
  for (const b of s.kb) {
    if (!b.on) continue;
    b.vy = Math.min(95, b.vy + (70 + b.r * 20) * dt);
    b.y -= b.vy * dt;
    b.x += Math.sin(s.t * 7 + b.r * 9) * 8 * dt;
    if (b.y <= ketLevel + rowAt(s.ket, b.x) + 1 || s.kettle < 0.03) {
      kick(s.ket, b.x, b.r * 9);
      b.on = false;
    }
  }

  // hop cones: thrown from the bale; in the kettle they float on the boil, then lie on the
  // bottom once it is drained; in the fermenter they go in at the port
  s.hops.forEach((h, i) => {
    if (h.st === 1) {
      h.vy += TOSS * dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.a += 2.4 * dt;
      h.age += dt;
      if (h.age >= h.T) {
        if (h.into === "ferm") {
          h.st = 4;
          kick(s.fer, FERM.cx, 6);
        } else {
          kick(s.ket, h.x - K[0], h.vy * 0.3);
          h.st = s.kettle > 0.05 ? 2 : 3;
          h.vy *= 0.2;
        }
      }
    } else if (h.st === 2) {
      const lx = h.x - K[0];
      const top = K[1] + ketLevel + rowAt(s.ket, lx) - 1;
      h.vy += (60 * (top - h.y) - 6 * h.vy) * dt;
      h.y += h.vy * dt;
      h.vx += (Math.sin(s.t * 0.9 + i * 2.1) * 14 * (0.3 + s.boil) - h.vx * 1.5 + Math.sin(s.tilt) * 30) * dt;
      h.x = clamp(h.x + h.vx * dt, K[0] + 26, K[0] + 124);
      h.a += (Math.sin(s.t * 1.3 + i) * 0.4 + h.vx * 0.03 - h.a) * Math.min(1, dt * 2);
      if (s.kettle < 0.03) h.st = 3;
    } else if (h.st === 3) {
      // drained: it comes to rest on the bottom, the three spread across it
      const k = Math.min(1, dt * 3);
      h.y += (K[1] + 100 - h.y) * k;
      h.x += (K[0] + (HOP_REST[i]?.[0] ?? 75) - h.x) * k;
      h.a += ((HOP_REST[i]?.[1] ?? 0) - h.a) * k;
    }
  });

  // extra inputs, from the beer's own description, go in a handful at a time
  s.recipe.extras.forEach((e, i) => {
    if ((s.exLeft[i] ?? 0) <= 0) return;
    s.exNext[i] = (s.exNext[i] ?? 0) - dt;
    if ((s.exNext[i] ?? 0) > 0) return;
    s.exNext[i] = 0.13;
    s.exLeft[i] = (s.exLeft[i] ?? 0) - 1;
    const c = L.extras[e.into][i] ?? L.extras[e.into][0];
    tossDot(
      s,
      [c[0] + EXTRA.mouth[0], c[1] + EXTRA.mouth[1]],
      L.aim[e.into],
      0.6,
      FILLS[e.kind],
      e.into,
      2.2,
    );
  });
  // the yeast: the jar tips over the port, and pours
  if (s.pitchT >= 0) {
    s.pitchT += dt;
    if (s.pitchT > 0.35 && s.pitchT < 1.1 && Math.random() < 14 * dt) {
      const J = L.at.jar;
      const ang = (s.jarTip * Math.PI) / 180;
      const mx = JAR.mouth[0] - JAR.pivot[0];
      const my = JAR.mouth[1] - JAR.pivot[1];
      const from: Pt = [
        J[0] + JAR.pivot[0] + mx * Math.cos(ang) - my * Math.sin(ang),
        J[1] + JAR.pivot[1] + mx * Math.sin(ang) + my * Math.cos(ang),
      ];
      tossDot(s, from, L.aim.ferm, 0.45, FILLS.yeast, "yeast", 1.7);
      s.jar = Math.max(0.6, s.jar - 0.05);
    }
    if (s.pitchT > 1.8) s.pitchT = -1;
  }
  const tipTo = s.pitchT >= 0 && s.pitchT < 1.3 ? -100 : 0;
  s.jarTip += (tipTo - s.jarTip) * Math.min(1, dt * 5);
  for (const d of s.fx) {
    if (!d.on) continue;
    d.vy += TOSS * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.age += dt;
    if (d.age < d.T) continue;
    d.on = false;
    if (d.into === "kettle") kick(s.ket, d.x - K[0], 14);
    else if (d.into === "mash") kick(s.mash, d.x - H[0], 10);
    else if (d.into === "yeast") {
      // in at the port: it carries on down inside the tank
      const y = s.yeast.find((x) => !x.on);
      if (y) {
        y.on = true;
        y.x = clamp(d.x - F[0], 20, 90);
        y.y = 34;
        y.vx = (Math.random() - 0.5) * 30;
        y.vy = d.vy * 0.5;
        y.r = 1.4 + Math.random() * 0.8;
      }
    } else kick(s.fer, FERM.cx, 4);
  }

  // into the fermenter; the yeast at work
  s.kettle -= move(s, g(9), 9, dt, s.kettle, 1, true);
  s.kettle = Math.max(0, s.kettle);
  a = land(s, g(9), 9, F[1] + fermLevel + rowAt(s.fer, g(9).out[0] - F[0]));
  s.ferm += a;
  splash(s.fer, g(9), F, a, 9);
  for (const d of s.yeast) {
    if (!d.on) continue;
    const under = d.y > fermLevel + rowAt(s.fer, d.x);
    if (under) {
      d.vy += (8 - d.vy) * Math.min(1, dt * 3);
      d.vx *= 1 - 3 * dt;
      d.r -= dt * 0.5;
    } else d.vy += GRAVITY * 0.6 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    if (d.r <= 0.2 || d.y > 205) d.on = false;
  }
  const busy = s.stage === "ferment" ? smooth(s.stageT / 1) * (1 - smooth((s.stageT - 1.9) / 1)) : 0;
  s.co2 += (busy - s.co2) * Math.min(1, dt * 3);
  s.krausen += (9 * s.co2 + (s.fermP > 0.5 && s.ferm > 0.05 ? 2.5 : 0) - s.krausen) * Math.min(1, dt * 1.2);
  if (s.ferm < 0.02) s.krausen = Math.min(s.krausen, s.ferm * 100);
  // a lager's cold rest: frost comes up on the tank, and goes once it is packed
  const cold = s.recipe.lager && s.stage === "ferment" && s.stageT > 2.6 ? 1 : 0;
  s.frost += (cold - s.frost) * Math.min(1, dt * (cold ? 1.6 : 0.8));
  if (s.co2 > 0.02 && Math.random() < s.co2 * 26 * dt) {
    const b = s.cb.find((d) => !d.on);
    if (b) {
      b.on = true;
      b.y = 160 + Math.random() * 40;
      b.x = clamp(30 + Math.random() * 50, 55 - (214 - b.y) * 0.9, 55 + (214 - b.y) * 0.9);
      b.vy = 6;
      b.r = 0.8 + Math.random() * 1.3;
    }
  }
  for (const b of s.cb) {
    if (!b.on) continue;
    b.vy = Math.min(80, b.vy + (40 + b.r * 18) * dt);
    b.y -= b.vy * dt;
    b.x += (Math.sin(s.t * 6 + b.r * 7) * 5 - Math.sin(s.tilt) * 20) * dt;
    if (b.y <= fermLevel + rowAt(s.fer, b.x) + 2 || s.ferm < 0.05) {
      kick(s.fer, b.x, -b.r * 4);
      b.on = false;
    }
  }
  s.nextBlip -= dt;
  if (s.co2 > 0.15 && s.nextBlip <= 0 && !s.blip.on) {
    s.blip.on = true;
    s.blip.y = -2;
    s.blip.vy = 0;
    s.nextBlip = 0.35 + (Math.random() * 0.5) / s.co2;
  }
  if (s.blip.on) {
    s.blip.vy += 120 * dt;
    s.blip.y -= s.blip.vy * dt;
    if (s.blip.y < -11) s.blip.on = false;
  }

  // to the filler, and into whatever stands under it
  s.ferm -= move(s, g(10), 10, dt, s.ferm, 1, true);
  s.ferm = Math.max(0, s.ferm);
  const under = Math.min(3, s.slot);
  const cx = O[0] + (SLOT_X[under] ?? 0) + s.belt;
  const lined = Math.abs(cx - g(10).out[0]) < 6;
  a = land(s, g(10), 10, O[1] + (lined ? contY(under, s.cont[under] ?? 0) : 96));
  if (a > 0 && lined) s.cont[under] = (s.cont[under] ?? 0) + a;
  for (const l of s.lids) {
    if (l.st !== 1) continue;
    l.vy += 700 * dt;
    l.y += l.vy * dt;
    if (l.y >= 0) {
      l.y = 0;
      if (l.vy > 90) l.vy = -l.vy * 0.2;
      else l.st = 2;
    }
  }

  // the paddle: a spring toward a slow stroke, and the blade shoves the mash about
  const pd = s.paddle;
  if (pd.stir > 0) {
    pd.stir -= dt;
    pd.ph += dt / 1.3;
  }
  const want = pd.stir > 0 ? 14 * Math.sin(pd.ph * Math.PI * 2) : 0;
  pd.v += (60 * (want - pd.a) - 9 * pd.v) * dt;
  pd.a += pd.v * dt;
  const deep = Math.min(1, (s.mashW + s.mashG) / 0.6);
  if (deep > 0.05 && Math.abs(pd.v) > 0.5) {
    // the blade sits about (30, 86) from the pivot; turned by a, it moves sideways at this speed
    const rad = (pd.a * Math.PI) / 180;
    const bx = MASH.pivot[0] + 30 * Math.cos(rad) - 86 * Math.sin(rad);
    const vx = (-30 * Math.sin(rad) - 86 * Math.cos(rad)) * ((pd.v * Math.PI) / 180);
    const push = vx * deep * 1.6 * dt;
    kick(s.mash, bx + 14, -push);
    kick(s.mash, bx - 14, push);
  }

  const tilt = clamp(s.tilt, -TILT, TILT);
  rowStep(s.mash, dt, tilt);
  rowStep(s.ket, dt, tilt);
  rowStep(s.fer, dt, tilt);
}

/** true while anything is still moving */
export function moving(s: Brew) {
  if (s.stage !== "done" && s.stage !== "fresh") return true;
  if (s.links.some((k) => k.headT >= 0)) return true;
  for (const p of [s.grains, s.cracked, s.sb, s.kb, s.cb, s.yeast, s.fx])
    if (p.some((d) => d.on)) return true;
  if (s.blip.on || s.lids.some((l) => l.st === 1)) return true;
  if (s.boil > 0.01 || s.heat > 0.01 || s.co2 > 0.01 || s.kilnHeat > 0.01 || Math.abs(s.spin) > 0.01)
    return true;
  if (s.mashSteam > 0.01 || s.frost > 0.01 || Math.abs(s.jarTip) > 0.5 || s.pitchT >= 0) return true;
  if (s.hops.some((h) => h.st === 1 || (h.st === 2 && s.kettle > 0))) return true;
  if (s.paddle.stir > 0 || Math.abs(s.paddle.a) > 0.05 || Math.abs(s.paddle.v) > 0.2) return true;
  if (Math.abs(s.tiltTo - s.tilt) > 0.003 || Math.abs(s.tiltV) > 0.02) return true;
  return !(rowStill(s.mash) && rowStill(s.ket) && rowStill(s.fer));
}

/** the phone's lean; the vessels follow */
export function lean(s: Brew, rad: number) {
  s.tiltTo = clamp(rad, -TILT, TILT);
}

/** a tap on the paddle */
export function stir(s: Brew) {
  s.paddle.stir = Math.max(s.paddle.stir, 2.6);
}

/** The layout changed under a running model: what was in flight in the old drawing goes. */
export function relayout(s: Brew, L: Layout) {
  for (const p of [s.grains, s.cracked, s.fx]) for (const d of p) d.on = false;
  const K = L.at.kettle;
  s.hops.forEach((h, i) => {
    if (h.st === 1) h.st = h.into === "ferm" ? 4 : 2;
    if (h.st === 2 || h.st === 3) h.x = K[0] + (HOP_REST[i]?.[0] ?? 75);
    if (h.st === 3) h.y = K[1] + 100;
    if (h.st === 2) h.y = K[1] + kettleY(s.kettle) - 1;
  });
}

// ---- drawing ----------------------------------------------------------------------------

const pct = (p: number, step = 0.05) => Math.round(clamp(p, 0, 1) / step) * step * 100;
const MIX = (a: string, b: string, p: number, step = 0.05) =>
  `color-mix(in srgb, ${a} ${pct(p, step).toFixed(0)}%, ${b})`;
const LIGHT = (c: string) => `color-mix(in srgb, ${c} 72%, var(--card))`;
const show = (put: Put, k: string, on: boolean) => put(k, "display", on ? "" : "none");

/** a bed of grain on a tray seen a little from above: its outline, and its top's front edge */
function bed(face: typeof GERM | typeof KILN, t: number) {
  const x0 = face.x0;
  const y = face.front;
  const [dx, dy] = face.depth;
  const w = face.width;
  return {
    d: `M${x0} ${y}V${f1(y - t)}L${x0 + dx} ${f1(y + dy - t)}H${x0 + w + dx}V${y + dy}L${x0 + w} ${y}Z`,
    edge: `M${x0} ${f1(y - t)}H${x0 + w}L${x0 + w + dx} ${f1(y + dy - t)}M${x0 + w} ${f1(y - t)}V${y}`,
  };
}

export function paint(s: Brew, L: Layout, put: Put) {
  const t = s.t;
  const water = "var(--brew-water)";
  const wort = "var(--brew-wort)";
  const beer = "var(--brew-beer-look)";

  // the tank and the jar
  put("tank.w", "d", `M8 ${f1(tankY(s.tankS + s.tankM))}H52V91H8Z`);
  show(put, "tank.w", s.tankS + s.tankM > 0.003);
  const jy = jarY(s.jar);
  put("jar.f", "d", `M8 ${f1(jy)}C16 ${f1(jy - 1.5)} 28 ${f1(jy + 1.5)} 36 ${f1(jy)}V50H8Z`);
  put("jar", "transform", `rotate(${f1(s.jarTip)} ${JAR.pivot[0]} ${JAR.pivot[1]})`);

  // the steep: water over a bed of grain, aired from below
  const sl = steepY(s.steepG + s.steepW);
  const sa = steepHalf(sl);
  const st = liquid(null, STEEP.cx, sa, sl, STEEP.apex + 2);
  put("steep.b", "d", st.body);
  put("steep.top", "d", st.top);
  show(put, "steep.b", s.steepW > 0.003);
  show(put, "steep.top", s.steepW + s.steepG > 0.003);
  put("steep.top", "fill", s.steepW > 0.01 ? LIGHT(water) : "var(--brew-wet)");
  const bl = steepY(s.steepG);
  const bd = liquid(null, STEEP.cx, steepHalf(bl), bl, STEEP.apex + 2);
  put("steep.bed", "d", bd.body);
  show(put, "steep.bed", s.steepG > 0.003);
  s.sb.forEach((b, i) => {
    show(put, `sb${i}`, b.on);
    if (!b.on) return;
    put(`sb${i}`, "cx", f1(b.x));
    put(`sb${i}`, "cy", f1(b.y));
    put(`sb${i}`, "r", f2(b.r));
  });
  put(
    "vS",
    "transform",
    `rotate(${f1((s.links[3]?.flow ?? 0) * 90)} ${STEEP.valveAt[0]} ${STEEP.valveAt[1]})`,
  );

  // the floor: wet grain spread out; each kernel puts out a rootlet, in steps; one pass of the rake
  const gt = s.floorG * GERM.thick;
  const gb = bed(GERM, gt);
  put("germ.bed", "d", gb.d);
  put("germ.edge", "d", gb.edge);
  show(put, "germ.bed", s.floorG > 0.003);
  show(put, "germ.edge", s.floorG > 0.003);
  const grow = Math.floor(clamp(s.sprout, 0, 1) * 3.999);
  SPROUTS_AT(s, put, gt, grow);
  const rk = s.rake >= 0 && s.rake < 1;
  show(put, "rake", rk);
  if (rk) {
    const x = GERM.x0 + 4 + (GERM.width - 8) * smooth(s.rake);
    put("rake", "transform", `translate(${f1(x)} ${f1(GERM.front - gt - 2)})`);
  }

  // the kiln: the bed dries and toasts, a quarter at a time; warm air off it
  const kt = s.kilnG * KILN.thick;
  const kb = bed(KILN, kt);
  put("kiln.bed", "d", kb.d);
  put("kiln.edge", "d", kb.edge);
  show(put, "kiln.bed", s.kilnG > 0.003);
  show(put, "kiln.edge", s.kilnG > 0.003);
  put("kiln.bed", "fill", MIX("var(--brew-toast)", "var(--brew-wet)", s.toast, 0.25));
  KILN_FIRE.forEach((g, i) => {
    put(`kiln.f${i}`, "d", tongue(g, t, 0.4 + 0.6 * s.kilnHeat));
  });
  show(put, "kiln.fire", s.kilnHeat > 0.05);
  [36, 70].forEach((x, i) => {
    const p = (t / (3.4 + i * 0.6) + i * 0.4) % 1;
    put(`kiln.s${i}`, "d", wisp(x, KILN.front - kt - 6, p, t, i * 1.7));
    put(`kiln.s${i}`, "opacity", f2(wispInk(p) * s.kilnHeat * (s.kilnG > 0.01 ? 1 : 0.4)));
  });

  // the mill
  const hy = hopperY(s.heap);
  const xl = 20 + (32 * hy) / 42;
  const xr = 100 - (32 * hy) / 42;
  put(
    "heap",
    "d",
    `M${f1(xl)} ${f1(hy)}Q60 ${f1(hy - Math.min(7, (42 - hy) * 0.4))} ${f1(xr)} ${f1(hy)}L68 42H52Z`,
  );
  show(put, "heap", s.heap > 0.002);
  const deg = (s.roller * 180) / Math.PI;
  const [ra, rb] = MILL.rollers;
  put("rA", "transform", `rotate(${f1(deg)} ${ra[0]} ${ra[1]})`);
  put("rB", "transform", `rotate(${f1(-deg)} ${rb[0]} ${rb[1]})`);
  put("crank", "transform", `rotate(${f1(-deg)} ${MILL.crank[0]} ${MILL.crank[1]})`);

  // the mash
  const my = mashY(s.mashW + s.mashG);
  const mashTone = MIX(wort, water, s.mashC * 0.85);
  const ml = liquid(s.mash, MASH.cx, MASH.a, my, MASH.bottom + 16);
  const wet = s.mashW > 0.02;
  put("mash.b", "d", ml.body);
  put("mash.top", "d", ml.top);
  show(put, "mash.b", wet);
  show(put, "mash.top", s.mashW + s.mashG > 0.003);
  put("mash.b", "fill", mashTone);
  put("mash.top", "fill", wet ? LIGHT(mashTone) : "var(--brew-bed)");
  const bedY = mashY(s.mashG);
  put("mash.bed", "d", liquid(null, MASH.cx, MASH.a, bedY, MASH.bottom + 16).body);
  show(put, "mash.bed", s.mashG > 0.003);
  put("paddle", "transform", `rotate(${f2(s.paddle.a)} ${MASH.pivot[0]} ${MASH.pivot[1]})`);
  [44, 104].forEach((x, i) => {
    const p = (t / (4.6 + i) + i * 0.47) % 1;
    put(`mash.s${i}`, "d", wisp(x, my - 6 + rowAt(s.mash, x), p, t, i * 3.1));
    put(`mash.s${i}`, "opacity", f2(wispInk(p) * s.mashSteam));
  });
  const valve = (key: string, at: Pt, i: number) =>
    put(key, "transform", `rotate(${f1((s.links[i]?.flow ?? 0) * 90)} ${at[0]} ${at[1]})`);
  valve("vM", MASH.valveAt, 8);
  valve("vK", KETTLE.valveAt, 9);
  valve("vF", FERM.valveAt, 10);

  // the kettle
  const ky = kettleY(s.kettle);
  const kl = liquid(s.ket, KETTLE.cx, KETTLE.a, ky, 118);
  put("ket.b", "d", kl.body);
  put("ket.top", "d", kl.top);
  show(put, "ket.b", s.kettle > 0.003);
  show(put, "ket.top", s.kettle > 0.003);
  KETTLE_FIRE.forEach((g, i) => {
    put(`ket.f${i}`, "d", tongue(g, t, 0.4 + 0.6 * s.heat));
  });
  show(put, "ket.fire", s.heat > 0.05);
  [44, 76, 106].forEach((x, i) => {
    const p = (t / (3.8 + i * 0.7) + i * 0.31) % 1;
    put(`ket.s${i}`, "d", wisp(x, ky - 6 + rowAt(s.ket, x), p, t, i * 2.3 + 1));
    put(`ket.s${i}`, "opacity", f2(wispInk(p) * s.boil));
  });
  dots(put, s.kb, "kb");

  // the fermenter
  const fy = fermY(s.ferm);
  const fermTone = MIX(beer, wort, s.fermP);
  const fl = liquid(s.fer, FERM.cx, fermHalf(fy), fy, 220, s.krausen, t);
  put("fer.b", "d", fl.body);
  put("fer.top", "d", fl.top);
  put("fer.foam", "d", fl.foam);
  show(put, "fer.b", s.ferm > 0.003);
  show(put, "fer.top", s.ferm > 0.003);
  show(put, "fer.foam", s.ferm > 0.003 && fl.foam !== "");
  put("fer.b", "fill", fermTone);
  put("fer.top", "fill", LIGHT(fermTone));
  dots(put, s.cb, "cb");
  dots(put, s.yeast, "y", 0.2);
  show(put, "blip", s.blip.on);
  if (s.blip.on) {
    put("blip", "cy", f1(FERM.bulb[1] + 4 + s.blip.y));
    put("blip", "r", f2(1.2 + (-s.blip.y / 11) * 1.2));
  }
  // frost comes on in steps
  put("frost", "opacity", f2(Math.round(s.frost * 4) / 4));
  show(put, "frost", s.frost > 0.12);

  // pipes and the streams out of them
  for (const { i } of LIQUID_LINKS) {
    const k = s.links[i] as Link;
    const g = L.links[i] as LinkGeo;
    let head = 0;
    let tail = 0;
    if (k.headT >= 0) {
      head = clamp((t - k.headT) / g.T, 0, 1);
      tail = k.tailT >= 0 ? clamp((t - k.tailT) / g.T, 0, 1) : 0;
    }
    put(
      `l${i}.liq`,
      "dash",
      head - tail > 0.001 ? `0 ${tail.toFixed(4)} ${(head - tail).toFixed(4)} 2` : "0 2",
    );
    const full = head >= 1 && tail <= 0;
    show(put, `l${i}.fl`, full);
    // flecks in the liquid move at the pipe's own speed (the path's length is 1)
    if (full) put(`l${i}.fl`, "doff", (-(t / g.T) % 1).toFixed(4));
    const x = g.out[0];
    const a = k.tailT >= 0 ? g.out[1] + fallDist(t - k.tailT - g.T) : g.out[1];
    const b = k.headT >= 0 ? Math.min(k.ty, g.out[1] + fallDist(t - k.headT - g.T)) : g.out[1];
    const on = k.headT >= 0 && head >= 1 && b - a > 1;
    show(put, `l${i}.st`, on);
    if (on) {
      const w = 2.4 + 1.6 * clamp(k.flow, 0.4, 1);
      const wb = w * 0.62;
      const sway = Math.sin(t * 23 + i) * 0.6 + Math.sin(t * 37) * 0.3;
      const mid = (a + b) / 2;
      put(
        `l${i}.st`,
        "d",
        `M${f2(x - w / 2)} ${f1(a)}H${f2(x + w / 2)}Q${f2(x + w / 2)} ${f1(mid)} ${f2(x + wb / 2 + sway)} ${f1(b)}` +
          `H${f2(x - wb / 2 + sway)}Q${f2(x - w / 2)} ${f1(mid)} ${f2(x - w / 2)} ${f1(a)}Z`,
      );
    }
  }
  // grain in the augers, things in the air
  dots(put, s.grains, "gw", 0.3, true);
  dots(put, s.cracked, "gc");
  dots(put, s.fx, "fx", 0.3, true);
  s.hops.forEach((h, i) => {
    const on = h.st >= 1 && h.st <= 3;
    show(put, `hop${i}`, on);
    if (on)
      put(`hop${i}`, "transform", `translate(${f1(h.x)} ${f1(h.y)}) rotate(${f1((h.a * 180) / Math.PI)})`);
  });

  // the filler
  put("belt", "doff", f1(-s.belt));
  s.cont.forEach((v, i) => {
    put(`c${i}`, "transform", `translate(${f1((SLOT_X[i] ?? 0) + s.belt)} 0)`);
    const y = contY(i, Math.min(v, CAP[i] ?? 1));
    const a = i === 0 ? 20 : 11;
    put(`c${i}.l`, "d", `M${-a} ${f1(y)}A${a} ${f1(a * RIM)} 0 0 1 ${a} ${f1(y)}V96H${-a}Z`);
    show(put, `c${i}.l`, v > 0.002);
    put(
      `c${i}.f`,
      "d",
      `M${-a} ${f1(y)}A${a} ${f1(a * RIM)} 0 1 1 ${a} ${f1(y)}A${a} ${f1(a * RIM)} 0 1 1 ${-a} ${f1(y)}Z`,
    );
    show(put, `c${i}.f`, v > 0.01);
  });
  s.lids.forEach((l, i) => {
    show(put, `lid${i}`, l.st !== 0);
    put(`lid${i}`, "transform", `translate(0 ${f1(l.y)})`);
  });
}

function SPROUTS_AT(s: Brew, put: Put, t: number, grow: number) {
  const on = s.floorG > 0.05 && s.sprout > 0;
  SPROUTS.forEach(([u, v], i) => {
    show(put, `sp${i}`, on);
    if (!on) return;
    const x = GERM.x0 + 4 + (GERM.width - 8) * u + GERM.depth[0] * v;
    const y = GERM.front - t + GERM.depth[1] * v;
    put(`sp${i}`, "transform", `translate(${f1(x)} ${f1(y)})`);
    const k = Math.min(grow, 1 + ((i * 7) % 3));
    put(
      `spr${i}`,
      "d",
      k <= 0
        ? ""
        : `M1.4 0.2q${k * 1.1} ${-k * 0.9} ${k * 2.2} ${k * 0.2}${k >= 3 ? "M-1.2 0.6q-1 0.9 -1.9 0.5" : ""}`,
    );
  });
}

function dots(put: Put, ps: Dot[], pre: string, min = 0.2, fill = false) {
  ps.forEach((d, i) => {
    show(put, `${pre}${i}`, d.on);
    if (!d.on) return;
    put(`${pre}${i}`, "cx", f1(d.x));
    put(`${pre}${i}`, "cy", f1(d.y));
    put(`${pre}${i}`, "r", f2(Math.max(min, d.r)));
    if (fill && d.fill) put(`${pre}${i}`, "fill", d.fill);
  });
}
