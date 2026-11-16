// The brewing drawing's physics (BrewProcess.tsx). Nothing here touches the DOM: `step`
// moves the model on by dt seconds, `paint` turns it into attribute strings, handed to a
// `put(key, attribute, value)` that either collects them (the server's still drawing) or
// writes them to the SVG (each frame).
//
// The model:
//   volume   one batch, counted in batch units and conserved. Every pipe and chute is a
//            conveyor: what enters it at time t leaves its far end at t + its travel time,
//            then falls under gravity to whatever surface is below, and only then is it
//            added to the next vessel (as in the Home glass: totals poured and landed, so
//            every drop lands once). Each vessel turns its volume into a level from its own
//            shape; the drawings are not to one scale, the count is.
//   surfaces the mash, the kettle and the fermenter each have a row of springs, as the
//            glass does: streams and grain kick them, bubbles nudge them, the paddle pushes
//            them, and the phone's lean is where they want to settle.
//   particles small fixed pools: grain on the chutes, boil bubbles, carbon dioxide, yeast,
//            three hop cones that fall, splash and float, lids that drop onto cans.
// A controller walks the batch through its stages; each stage waits for the physics (a
// vessel empty, a pipe drained) rather than a clock, except the boil and the ferment.

import {
  along,
  FERM,
  KETTLE,
  type Layout,
  type LinkGeo,
  MASH,
  MILL,
  type Pt,
  type Stage,
} from "./brew-layout";

export type Put = (key: string, attr: string, value: string) => void;

const RATE = [0.24, 0.3, 0.34, 0.4, 0.42, 0.5]; // per link, batch units a second when open
const GRAIN = 0.5; // the grain in one batch
const BOIL_OFF = 0.1; // what the boil sends up as steam
export const CAP = [0.45, 0.15, 0.15, 0.15]; // the keg and three cans: the 0.9 that is left
export const SLOT_X = [150, 108, 78, 48]; // their centres on the belt at the start
const STEP_X = [42, 30, 30, 30]; // how far the belt moves after each fill
const GRAVITY = 900;
const V0 = 60; // the speed liquid leaves a pipe at
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

const mashY = (v: number) => MASH.floor - v * 62;
const kettleY = (v: number) => KETTLE.floor - v * 78;
function fermY(v: number) {
  const a = v * 14569;
  if (a <= 2024) return 216 - Math.sqrt(a * (92 / 88));
  return 170 - (a - 2024) / 88;
}
function hopperY(g: number) {
  const a = Math.min(2016, g * 2584);
  return (80 - Math.sqrt(Math.max(0, 6400 - 3.0476 * (2016 - a)))) / 1.5238;
}
const jugY = (v: number) => 89 - v * 58;
const jarY = (v: number) => 48 - v * 28;
const contY = (i: number, v: number) =>
  i === 0 ? 98 - (v / (CAP[0] ?? 1)) * 56 : 99 - (v / (CAP[i] ?? 1)) * 36;

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
    r.h[i] = clamp(before + (r.v[i] ?? 0) * dt, -16, 16);
    moved = Math.max(moved, Math.abs((r.h[i] ?? 0) - before) / dt);
  }
  // under a lean the neighbours hold each spring a little off its rest for good, so
  // stillness is judged by motion: under a fifth of a unit a second for a quarter second
  r.calm = moved < 0.2 ? r.calm + dt : 0;
  for (let pass = 0; pass < 3; pass++)
    for (let i = 0; i < r.n; i++) {
      if (i > 0) r.v[i - 1] = (r.v[i - 1] ?? 0) + 14 * ((r.h[i] ?? 0) - (r.h[i - 1] ?? 0)) * dt;
      if (i < r.n - 1) r.v[i + 1] = (r.v[i + 1] ?? 0) + 14 * ((r.h[i] ?? 0) - (r.h[i + 1] ?? 0)) * dt;
    }
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
const top = (r: Row, y: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < r.n; i++) out.push([xOf(r, i), y + (r.h[i] ?? 0)]);
  return out;
};
const body = (r: Row, y: number, floor: number) => `M${curve(top(r, y))}V${floor}H${r.x0 - 2}V${f1(y)}Z`;
/** a head: soft crowns over the surface, as on the Home glass */
function foam(r: Row, y: number, fh: number, t: number) {
  const under = top(r, y);
  const crown = under.map(([x, sy], i): Pt => {
    const bump = Math.abs(Math.sin(i * 1.05 + t * 0.9)) * Math.min(4, fh * 0.35);
    return [x, sy - fh - bump];
  });
  return `M${curve(crown)}L${curve(under.reverse())}Z`;
}

/** a curl of steam at p (0..1) of its life */
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
const TONGUES = [
  { bx: 66, by: 133, w: 5, h: 12, seed: 1.3, speed: 3.6 },
  { bx: 84, by: 133, w: 5, h: 13, seed: 4.7, speed: 3.3 },
  { bx: 75, by: 134, w: 7.5, h: 18, seed: 8.2, speed: 2.9 },
  { bx: 75.5, by: 134, w: 3.4, h: 9, seed: 11.6, speed: 3.9 },
];
function tongue(i: number, t: number, heat: number) {
  const g = TONGUES[i] ?? { bx: 75, by: 134, w: 5, h: 10, seed: 0, speed: 3 };
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
  cum: number; // all that has entered
  landed: number; // all that has arrived
  hist: number[]; // [time, cum] pairs, flat
  headT: number; // when the current run's front entered (-1: empty)
  tailT: number; // when its end entered (-1: still running)
  enter: number; // the rate it is entering at
  ty: number; // the surface below the outlet, whole-drawing y
}
interface Dot {
  on: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  s: number; // along a chute; -1 once falling
  age: number;
}
interface Hop {
  st: 0 | 1 | 2 | 3; // unused, falling, floating, settled on the bottom
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
}
interface Lid {
  st: 0 | 1 | 2; // waiting, falling, on
  y: number;
  vy: number;
}

export interface Brew {
  t: number;
  stage: Stage;
  stageT: number;
  sack: number;
  heap: number;
  jug: number;
  jar: number;
  mashW: number;
  mashG: number;
  mashC: number; // how far the mash has turned water into wort, 0..1
  mashSteam: number;
  kettle: number;
  heat: number;
  boil: number;
  evap: number;
  ferm: number;
  fermP: number; // wort to beer, 0..1
  krausen: number;
  co2: number;
  yeastIn: boolean;
  cont: number[];
  belt: number;
  beltFrom: number;
  beltTo: number;
  beltT: number;
  slot: number;
  outPhase: 0 | 1 | 2 | 3;
  lids: Lid[];
  hops: Hop[];
  hopsDropped: number;
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
  whole: Dot[];
  cracked: Dot[];
  kb: Dot[];
  cb: Dot[];
  yeast: Dot[];
  blip: Dot;
  nextBlip: number;
}

export const POOLS = { whole: 10, cracked: 14, kb: 12, cb: 14, yeast: 8, hops: 3 } as const;
const dot = (): Dot => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, r: 1, s: 0, age: 0 });
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
const HOP_REST: readonly (readonly [number, number])[] = [
  [52, 0.5],
  [74, -0.4],
  [98, 0.9],
];

export function createBrew(): Brew {
  const s: Brew = {
    t: 0.8,
    stage: "done",
    stageT: 0,
    sack: GRAIN,
    heap: 0,
    jug: 1,
    jar: 1,
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
    yeastIn: false,
    cont: [0, 0, 0, 0],
    belt: 0,
    beltFrom: 0,
    beltTo: 0,
    beltT: 0,
    slot: 0,
    outPhase: 0,
    lids: [0, 1, 2].map(() => ({ st: 0, y: 0, vy: 0 })),
    hops: [0, 1, 2].map(() => ({ st: 0, x: 0, y: 0, vx: 0, vy: 0, a: 0 })),
    hopsDropped: 0,
    links: Array.from({ length: 6 }, newLink),
    mash: row(11, MASH.x0, MASH.x1),
    ket: row(11, KETTLE.x0, KETTLE.x1),
    fer: row(9, FERM.x0, FERM.x1),
    paddle: { a: 0, v: 0, stir: 0, ph: 0 },
    stirred: false,
    tilt: 0,
    tiltV: 0,
    tiltTo: 0,
    roller: 0,
    spin: 0,
    whole: pool(POOLS.whole),
    cracked: pool(POOLS.cracked),
    kb: pool(POOLS.kb),
    cb: pool(POOLS.cb),
    yeast: pool(POOLS.yeast),
    blip: dot(),
    nextBlip: 0,
  };
  return s;
}

/** The finished picture: every vessel full, the keg and cans filled and lidded. What the
    server draws, and all there is without JavaScript or with reduced motion. */
export function stillBrew(): Brew {
  const s = createBrew();
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
  s.krausen = 6;
  s.cont = [...CAP];
  s.belt = STEP_X.reduce((a, b) => a + b, 0);
  s.slot = 4;
  for (const l of s.lids) l.st = 2;
  s.hops.forEach((h, i) => {
    const r = HOP_REST[i] ?? [75, 0];
    h.st = 2;
    h.x = r[0];
    h.y = kettleY(1) - 1;
    h.a = r[1];
  });
  return s;
}

/** Everything back to where a stage starts, as if the stages before it had just run. */
export function setStage(s: Brew, stage: Stage) {
  s.sack = GRAIN;
  s.heap = 0;
  s.jug = 1;
  s.jar = 1;
  s.mashW = 0;
  s.mashG = 0;
  s.mashC = 0;
  s.kettle = 0;
  s.heat = 0;
  s.boil = 0;
  s.evap = 0;
  s.ferm = 0;
  s.fermP = 0;
  s.krausen = 0;
  s.co2 = 0;
  s.yeastIn = false;
  s.cont = [0, 0, 0, 0];
  s.belt = 0;
  s.beltT = 0;
  s.slot = 0;
  s.outPhase = 0;
  for (const l of s.lids) {
    l.st = 0;
    l.y = 0;
    l.vy = 0;
  }
  for (const h of s.hops) h.st = 0;
  s.hopsDropped = 0;
  s.links = Array.from({ length: 6 }, newLink);
  for (const p of [s.whole, s.cracked, s.kb, s.cb, s.yeast]) for (const d of p) d.on = false;
  s.blip.on = false;
  s.paddle.stir = 0;
  s.stirred = false;

  const order: Stage[] = ["grain", "mash", "runoff", "boil", "transfer", "ferment", "out"];
  const at = order.indexOf(stage);
  if (at >= 1) {
    // the grain is in the mash with the water
    s.sack = 0;
    s.jug = 0;
    s.mashW = 1;
    s.mashG = GRAIN;
    s.mashC = 0.35;
    s.paddle.stir = 2.6;
    s.stirred = true;
  }
  if (at >= 2) s.mashC = 1;
  if (at >= 3) {
    s.mashW = 0;
    s.kettle = 1;
    s.heat = 1;
    s.boil = 0.6;
  }
  if (at >= 4) {
    s.kettle = 0;
    s.heat = 0;
    s.boil = 0;
    s.ferm = 1 - BOIL_OFF;
    s.hops.forEach((h, i) => {
      const r = HOP_REST[i] ?? [75, 0];
      h.st = 3;
      h.x = r[0];
      h.y = KETTLE.floor - 2;
      h.a = r[1];
    });
    s.hopsDropped = 3;
  }
  if (at >= 6) {
    s.fermP = 1;
    s.yeastIn = true;
    s.jar = 0.6;
  }
  s.stage = stage === "transfer" ? "ferment" : stage;
  s.stageT = 0;
}

// ---- pipes and chutes --------------------------------------------------------------------

/** how much had entered a link by time t */
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

/** grains ride a chute at its speed, then fall to the surface below */
function grains(s: Brew, g: LinkGeo, i: number, ps: Dot[], dt: number, r: number) {
  const k = s.links[i] as Link;
  const rate = RATE[i] ?? 0.2;
  if (k.enter > 0 && Math.random() < (k.enter / rate) * 18 * dt) {
    const p = ps.find((d) => !d.on);
    if (p) {
      p.on = true;
      p.s = 0;
      p.age = (Math.random() - 0.5) * 2.4; // sideways offset on the chute
      p.r = r * (0.8 + Math.random() * 0.4);
    }
  }
  const speed = g.len / g.T;
  for (const p of ps) {
    if (!p.on) continue;
    if (p.s >= 0) {
      p.s += speed * dt;
      if (p.s >= g.len) {
        p.s = -1;
        p.x = g.out[0] + p.age;
        p.y = g.out[1];
        p.vx = g.dir[0] * speed * 0.5;
        p.vy = Math.max(V0 * 0.6, g.dir[1] * speed);
      } else {
        const at = along(g, p.s);
        p.x = at[0] + p.age * Math.abs(g.dir[1]);
        p.y = at[1] - 1.5;
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

// ---- the batch, stage by stage -------------------------------------------------------------

function go(s: Brew, stage: Stage) {
  s.stage = stage;
  s.stageT = 0;
  for (const k of s.links) k.open = false;
}

function control(s: Brew, dt: number) {
  const k = s.links;
  const L0 = k[0] as Link;
  const L5 = k[5] as Link;
  switch (s.stage) {
    case "grain": {
      L0.open = s.sack > 0;
      (k[1] as Link).open = true;
      (k[2] as Link).open = s.stageT > 0.25 && s.jug > 0;
      if (s.stageT > 1.4 && !s.stirred) {
        s.paddle.stir = Math.max(s.paddle.stir, 3.2);
        s.stirred = true;
      }
      if (s.stageT > 2 && s.sack <= 0 && s.jug <= 0 && s.heap <= 0 && empty(L0) && empty(k[1]) && empty(k[2]))
        go(s, "mash");
      break;
    }
    case "mash":
      if (s.stageT > 1 && s.paddle.stir <= 0 && s.mashC >= 1) go(s, "runoff");
      break;
    case "runoff":
      (k[3] as Link).open = s.mashW > 0;
      if (s.mashW <= 0 && empty(k[3])) go(s, "boil");
      break;
    case "boil": {
      const due = [0.3, 1.1, 1.9];
      while (s.hopsDropped < 3 && s.stageT >= (due[s.hopsDropped] ?? 9)) dropHop(s, s.hopsDropped++);
      if (s.evap >= BOIL_OFF - 1e-6 && s.stageT > 2.5) go(s, "transfer");
      break;
    }
    case "transfer":
      (k[4] as Link).open = s.kettle > 0;
      if (!s.yeastIn && s.ferm > 0.3) pitch(s);
      if (s.kettle <= 0 && empty(k[4])) go(s, "ferment");
      break;
    case "ferment":
      if (!s.yeastIn && s.stageT > 0.1) pitch(s);
      s.fermP = Math.max(s.fermP, smooth((s.stageT - 0.4) / 3.4));
      if (s.stageT > 4) go(s, "out");
      break;
    case "out": {
      if (s.outPhase === 0) {
        L5.open = true;
        // shut when what is in the line, and what the closing valve still lets by, will
        // top this one up; the last can takes whatever is left in the tank
        const ahead = (s.cont[s.slot] ?? 0) + (L5.cum - L5.landed) + (RATE[5] ?? 0) * L5.flow * 0.11;
        const lastOne = s.slot === 3;
        if ((!lastOne && ahead >= (CAP[s.slot] ?? 0) - 1e-3) || s.ferm <= 0) {
          L5.open = false;
          s.outPhase = 1;
        }
      } else if (s.outPhase === 1) {
        if (empty(L5)) {
          s.outPhase = 2;
          s.beltFrom = s.belt;
          s.beltTo = s.belt + (STEP_X[s.slot] ?? 0);
          s.beltT = 0;
        }
      } else if (s.outPhase === 2) {
        s.beltT += dt / 0.45;
        s.belt = s.beltFrom + (s.beltTo - s.beltFrom) * smooth(s.beltT);
        if (s.beltT >= 1) {
          // the can that has just reached the capper gets its lid
          const lid = s.lids[s.slot - 1];
          if (lid) {
            lid.st = 1;
            lid.y = -42;
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

function dropHop(s: Brew, i: number) {
  const h = s.hops[i];
  if (!h) return;
  h.st = 1;
  h.x = -1; // placed by step(), which knows the layout
  h.y = 0;
  h.vx = 0;
  h.vy = 0;
  h.a = (Math.random() - 0.5) * 1.2;
}

function pitch(s: Brew) {
  s.yeastIn = true;
  s.jar = Math.max(0, s.jar - 0.4);
  s.yeast.forEach((d, i) => {
    d.on = true;
    d.x = 34 + Math.random() * 6;
    d.y = 32 - i * 3;
    d.vx = (Math.random() - 0.5) * 30;
    d.vy = 10 + Math.random() * 30;
    d.r = 1.4 + Math.random() * 0.8;
    d.age = 0;
  });
}

// ---- one step ---------------------------------------------------------------------------

export function step(s: Brew, L: Layout, dt: number) {
  s.t += dt;
  s.stageT += dt;
  control(s, dt);

  const { mill: M, mash: H, kettle: K, ferm: F, out: O } = L.at;
  const g = L.links;
  const g0 = g[0] as LinkGeo;
  const g1 = g[1] as LinkGeo;
  const g2 = g[2] as LinkGeo;
  const g3 = g[3] as LinkGeo;
  const g4 = g[4] as LinkGeo;
  const g5 = g[5] as LinkGeo;

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

  // grain: the sack into the hopper; the mill into the mash
  s.sack -= move(s, g0, 0, dt, s.sack, 1, true);
  s.heap += land(s, g0, 0, M[1] + hopperY(s.heap) - 2);
  const millLast = s.sack <= 0 && empty(s.links[0]);
  s.heap -= move(s, g1, 1, dt, s.heap, s.heap * 5 * dt + 1e-5, millLast);
  s.heap = Math.max(0, s.heap);
  let a = land(s, g1, 1, H[1] + mashLevel + rowAt(s.mash, g1.out[0] - H[0]));
  s.mashG += a;
  splash(s.mash, g1, H, a, 1, 0.35);
  const turning = (s.links[1] as Link).flow > 0.05 && (s.heap > 0 || !empty(s.links[1])) ? 1 : 0;
  s.spin += (turning - s.spin) * Math.min(1, dt * 4);
  s.roller += s.spin * 7 * dt;
  grains(s, g0, 0, s.whole, dt, 1.9);
  grains(s, g1, 1, s.cracked, dt, 1.4);

  // water into the mash
  s.jug -= move(s, g2, 2, dt, s.jug, 1, true);
  a = land(s, g2, 2, H[1] + mashLevel + rowAt(s.mash, g2.out[0] - H[0]));
  s.mashW += a;
  splash(s.mash, g2, H, a, 2);
  if (s.mashW > 0.15 && s.mashG > 0.1) s.mashC = Math.min(1, s.mashC + dt * (s.paddle.stir > 0 ? 0.3 : 0.2));
  s.mashSteam += ((s.mashW > 0.05 ? 1 : 0) - s.mashSteam) * Math.min(1, dt * 1.5);

  // the run-off into the kettle
  s.mashW -= move(s, g3, 3, dt, s.mashW, 1, true);
  s.mashW = Math.max(0, s.mashW);
  a = land(s, g3, 3, K[1] + ketLevel + rowAt(s.ket, g3.out[0] - K[0]));
  s.kettle += a;
  splash(s.ket, g3, K, a, 3);

  // the boil
  const fire = (s.stage === "runoff" && s.kettle > 0.12) || s.stage === "boil" ? 1 : 0;
  s.heat += (fire - s.heat) * Math.min(1, dt * 1.2);
  s.boil += ((s.kettle > 0.05 ? s.heat : 0) - s.boil) * Math.min(1, dt * 0.8);
  if (s.stage === "boil") {
    const e = Math.min(s.kettle, 0.04 * s.boil * dt, BOIL_OFF - s.evap);
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
        b.y = KETTLE.floor - 2;
        b.vy = 10;
        b.r = 1 + Math.random() * 1.6;
      }
    }
    // a rolling boil: the surface is pushed about from below
    for (let n = 0; n < 2; n++) {
      const i = Math.floor(Math.random() * s.ket.n);
      s.ket.v[i] = (s.ket.v[i] ?? 0) + (Math.random() - 0.5) * s.boil * 1600 * dt;
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

  // hops: fall, splash, float and drift on the boil; lie on the bottom once it is drained
  const [hx0, hx1, hy] = L.hopFrom;
  s.hops.forEach((h, i) => {
    if (h.st === 0) return;
    if (h.st === 1) {
      if (h.x < 0) {
        h.x = hx0 - K[0] + ((hx1 - hx0) * (i + 0.5)) / 3;
        h.y = hy - K[1];
      }
      h.vy += 520 * dt;
      h.y += h.vy * dt;
      h.a += 1.4 * dt;
      const sy = ketLevel + rowAt(s.ket, h.x);
      if (s.kettle > 0.05 && h.y >= sy - 1) {
        kick(s.ket, h.x, h.vy * 0.35);
        h.st = 2;
        h.vy *= 0.25;
      } else if (h.y >= KETTLE.floor - 2) h.st = 3; // nothing to land in: it lies on the bottom
    } else if (h.st === 2) {
      const sy = ketLevel + rowAt(s.ket, h.x) - 1;
      h.vy += (60 * (sy - h.y) - 6 * h.vy) * dt;
      h.y += h.vy * dt;
      h.vx += (Math.sin(s.t * 0.9 + i * 2.1) * 14 * (0.3 + s.boil) - h.vx * 1.5) * dt;
      h.vx += Math.sin(s.tilt) * 30 * dt;
      h.x = clamp(h.x + h.vx * dt, 24, 126);
      h.a += (Math.sin(s.t * 1.3 + i) * 0.4 + h.vx * 0.03 - h.a) * Math.min(1, dt * 2);
      if (s.kettle < 0.03) h.st = 3;
    } else {
      h.y += (KETTLE.floor - 2 - h.y) * Math.min(1, dt * 3);
    }
  });

  // into the fermenter; the yeast; the ferment
  s.kettle -= move(s, g4, 4, dt, s.kettle, 1, true);
  s.kettle = Math.max(0, s.kettle);
  a = land(s, g4, 4, F[1] + fermLevel + rowAt(s.fer, g4.out[0] - F[0]));
  s.ferm += a;
  splash(s.fer, g4, F, a, 4);
  for (const d of s.yeast) {
    if (!d.on) continue;
    d.age += dt;
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
  const co2 = s.stage === "ferment" ? smooth(s.stageT / 1.2) * (1 - smooth((s.stageT - 3.4) / 1.4)) : 0;
  s.co2 += (co2 - s.co2) * Math.min(1, dt * 3);
  s.krausen += (9 * s.co2 + (s.fermP > 0.5 && s.ferm > 0.05 ? 2.5 : 0) - s.krausen) * Math.min(1, dt * 1.2);
  if (s.ferm < 0.02) s.krausen = Math.min(s.krausen, s.ferm * 100);
  if (s.co2 > 0.02 && Math.random() < s.co2 * 26 * dt) {
    const b = s.cb.find((d) => !d.on);
    if (b) {
      b.on = true;
      b.x = 30 + Math.random() * 50;
      b.y = 160 + Math.random() * 40;
      b.x = clamp(b.x, 55 - (216 - b.y) * 0.9, 55 + (216 - b.y) * 0.9);
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
  // the airlock lets a bubble go now and then while the yeast is busy
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
  s.ferm -= move(s, g5, 5, dt, s.ferm, 1, true);
  s.ferm = Math.max(0, s.ferm);
  const under = Math.min(3, s.slot);
  const cx = O[0] + (SLOT_X[under] ?? 0) + s.belt;
  const lined = Math.abs(cx - g5.out[0]) < 6; // otherwise it would land on the belt
  a = land(s, g5, 5, O[1] + (lined ? contY(under, s.cont[under] ?? 0) : 100));
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
    // mash heaps up ahead of the blade and drops behind it
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
  for (const p of [s.whole, s.cracked, s.kb, s.cb, s.yeast]) if (p.some((d) => d.on)) return true;
  if (s.blip.on || s.lids.some((l) => l.st === 1)) return true;
  if (s.boil > 0.01 || s.heat > 0.01 || s.co2 > 0.01 || Math.abs(s.spin) > 0.01) return true;
  if (s.mashSteam > 0.01) return true;
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
export function relayout(s: Brew) {
  for (const p of [s.whole, s.cracked]) for (const d of p) d.on = false;
}

// ---- drawing ----------------------------------------------------------------------------

const MIX = (a: string, b: string, p: number) =>
  `color-mix(in srgb, var(${a}) ${Math.round(clamp(p, 0, 1) * 20) * 5}%, var(${b}))`;
const show = (put: Put, k: string, on: boolean) => put(k, "display", on ? "" : "none");

export function paint(s: Brew, L: Layout, put: Put) {
  const t = s.t;
  // inputs
  put("jug.w", "d", `M8 ${f1(jugY(s.jug))}H52V91H8Z`);
  show(put, "jug.w", s.jug > 0.003);
  const jy = jarY(s.jar);
  put("jar.f", "d", `M8 ${f1(jy)}C16 ${f1(jy - 1.5)} 28 ${f1(jy + 1.5)} 36 ${f1(jy)}V50H8Z`);

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
  put("mash.b", "d", body(s.mash, my, 140));
  show(put, "mash.b", s.mashW + s.mashG > 0.003);
  put("mash.b", "fill", MIX("--brew-wort", "--brew-water", s.mashC * 0.85));
  const bed = mashY(s.mashG);
  put("mash.bed", "d", `M9 ${f1(bed)}C40 ${f1(bed - 2)} 100 ${f1(bed + 2)} 141 ${f1(bed)}V140H9Z`);
  show(put, "mash.bed", s.mashG > 0.003);
  put("paddle", "transform", `rotate(${f2(s.paddle.a)} ${MASH.pivot[0]} ${MASH.pivot[1]})`);
  [40, 104].forEach((x, i) => {
    const p = (t / (4.6 + i) + i * 0.47) % 1;
    put(`mash.s${i}`, "d", wisp(x, my + rowAt(s.mash, x) - 2, p, t, i * 3.1));
    put(`mash.s${i}`, "opacity", f2(wispInk(p) * s.mashSteam));
  });
  const valve = (key: string, at: Pt, i: number) =>
    put(key, "transform", `rotate(${f1((s.links[i]?.flow ?? 0) * 90)} ${at[0]} ${at[1]})`);
  valve("v3", MASH.valveAt, 3);
  valve("v4", KETTLE.valveAt, 4);
  valve("v5", FERM.valveAt, 5);

  // the kettle
  const ky = kettleY(s.kettle);
  put("ket.b", "d", body(s.ket, ky, 120));
  show(put, "ket.b", s.kettle > 0.003);
  for (let i = 0; i < TONGUES.length; i++) put(`ket.f${i}`, "d", tongue(i, t, 0.4 + 0.6 * s.heat));
  show(put, "ket.fire", s.heat > 0.05);
  [44, 76, 106].forEach((x, i) => {
    const p = (t / (3.8 + i * 0.7) + i * 0.31) % 1;
    put(`ket.s${i}`, "d", wisp(x, ky + rowAt(s.ket, x) - 2, p, t, i * 2.3 + 1));
    put(`ket.s${i}`, "opacity", f2(wispInk(p) * s.boil));
  });
  s.kb.forEach((b, i) => {
    show(put, `kb${i}`, b.on);
    if (!b.on) return;
    put(`kb${i}`, "cx", f1(b.x));
    put(`kb${i}`, "cy", f1(b.y));
    put(`kb${i}`, "r", f2(b.r));
  });
  s.hops.forEach((h, i) => {
    show(put, `hop${i}`, h.st !== 0 && h.x >= 0);
    if (h.st === 0 || h.x < 0) return;
    put(`hop${i}`, "transform", `translate(${f1(h.x)} ${f1(h.y)}) rotate(${f1((h.a * 180) / Math.PI)})`);
  });

  // the fermenter
  const fy = fermY(s.ferm);
  put("fer.b", "d", body(s.fer, fy, 220));
  show(put, "fer.b", s.ferm > 0.003);
  put("fer.b", "fill", MIX("--brew-beer", "--brew-wort", s.fermP));
  const fh = s.krausen;
  put("fer.foam", "d", fh > 0.6 ? foam(s.fer, fy, fh, t) : "");
  show(put, "fer.foam", fh > 0.6 && s.ferm > 0.003);
  s.cb.forEach((b, i) => {
    show(put, `cb${i}`, b.on);
    if (!b.on) return;
    put(`cb${i}`, "cx", f1(b.x));
    put(`cb${i}`, "cy", f1(b.y));
    put(`cb${i}`, "r", f2(b.r));
  });
  s.yeast.forEach((d, i) => {
    show(put, `y${i}`, d.on);
    if (!d.on) return;
    put(`y${i}`, "cx", f1(d.x));
    put(`y${i}`, "cy", f1(d.y));
    put(`y${i}`, "r", f2(Math.max(0.2, d.r)));
  });
  show(put, "blip", s.blip.on);
  if (s.blip.on) {
    put("blip", "cy", f1(FERM.bulb[1] + 4 + s.blip.y));
    put("blip", "r", f2(1.2 + (-s.blip.y / 11) * 1.2));
  }

  // pipes and the streams out of them
  for (const i of [2, 3, 4, 5]) {
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
    // the stream: its front falls from the outlet, and once the run ends, its tail
    const surf = k.ty;
    const x = g.out[0];
    const a = k.tailT >= 0 ? g.out[1] + fallDist(t - k.tailT - g.T) : g.out[1];
    const b = k.headT >= 0 ? Math.min(surf, g.out[1] + fallDist(t - k.headT - g.T)) : g.out[1];
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
  // grain on the chutes
  const dots = (ps: Dot[], pre: string) =>
    ps.forEach((d, i) => {
      show(put, `${pre}${i}`, d.on);
      if (!d.on) return;
      put(`${pre}${i}`, "cx", f1(d.x));
      put(`${pre}${i}`, "cy", f1(d.y));
      put(`${pre}${i}`, "r", f2(d.r));
    });
  dots(s.whole, "gw");
  dots(s.cracked, "gc");

  // the filler
  put("belt", "doff", f1(-s.belt));
  s.cont.forEach((v, i) => {
    put(`c${i}`, "transform", `translate(${f1((SLOT_X[i] ?? 0) + s.belt)} 0)`);
    const y = contY(i, Math.min(v, CAP[i] ?? 1));
    const half = i === 0 ? 20 : 10;
    const bottom = i === 0 ? 98 : 99;
    put(`c${i}.l`, "d", `M${-half} ${f1(y)}H${half}V${bottom}H${-half}Z`);
    show(put, `c${i}.l`, v > 0.002);
    const head = Math.min(3, v * 40);
    put(`c${i}.f`, "d", `M${-half} ${f1(y - head)}H${half}V${f1(y)}H${-half}Z`);
    show(put, `c${i}.f`, v > 0.01);
  });
  s.lids.forEach((l, i) => {
    show(put, `lid${i}`, l.st !== 0);
    put(`lid${i}`, "transform", `translate(0 ${f1(l.y)})`);
  });
}
