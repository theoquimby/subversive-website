"use client";

// The fire pit in the beer garden, as a living pen drawing (2026-11-15). A steel bowl on
// short legs, two crossed logs, a flame, sparks and a wisp of smoke. The drawing is flat;
// the physics is real:
//   flame   three closed pen shapes and an inner tongue; each tip is thrown about by
//           smooth noise (height, lean and curl), and the whole flame leans with "up"
//   embers  particles with buoyancy that fades as they cool, drag, a little turbulence
//           and a lifetime; cold ones sink a touch, shrink and wink out
//   smoke   two thin curls that rise slowly, lengthen, loosen and fade
// The phone's lean is the wind: "up" turns against the roll, so flame, sparks and smoke
// all go the same way. Nothing here renders through React after the first paint: a fixed
// pool of elements has its attributes written each frame. Without JavaScript or with
// reduced motion the server's still fire stays as drawn.
import { useEffect, useRef } from "react";
import { createLoop } from "../../lib/motion/loop";
import { onTilt } from "../../lib/motion/tilt";

const POOL = 14; // embers alive at most
const BUOYANCY = 44; // units / s² while white hot
const WEIGHT = 7; // what is left pulling down once an ember has cooled
const DRAG = 2.3; // 1 / s
const GUST = 13; // sideways turbulence, units / s²

// Smooth noise in -1..1: three sines that never line up.
function noise(t: number, seed: number): number {
  return (
    0.5 * Math.sin(t * 1.7 + seed) +
    0.3 * Math.sin(t * 3.1 + seed * 2.3) +
    0.2 * Math.sin(t * 5.3 + seed * 4.1)
  );
}

const r1 = (n: number) => Math.round(n * 10) / 10;

interface Tongue {
  bx: number;
  by: number;
  w: number;
  h: number;
  seed: number;
  speed: number;
}

// back left, back right, the main flame, and the inner tongue (drawn in that order)
const TONGUES: readonly Tongue[] = [
  { bx: 50, by: 58, w: 6, h: 19, seed: 1.3, speed: 3.6 },
  { bx: 70.5, by: 58, w: 6.5, h: 22, seed: 4.7, speed: 3.3 },
  { bx: 60, by: 59, w: 11, h: 33, seed: 8.2, speed: 2.9 },
  { bx: 60.5, by: 59, w: 5, h: 18, seed: 11.6, speed: 3.9 },
];
const TONGUE_CLASS = ["firepit__flame", "firepit__flame", "firepit__flame", "firepit__core"];

// One tongue of flame: a teardrop from its base to a tip that the noise throws about.
function tongue(f: Tongue, t: number, lean: number): string {
  const ts = t * f.speed;
  const h = f.h * (1 + 0.2 * noise(ts, f.seed));
  const a = lean * 1.25 + 0.16 * noise(ts * 0.7, f.seed + 9);
  const tx = f.bx - Math.sin(a) * h;
  const ty = f.by - Math.cos(a) * h;
  const curl = f.w * 0.9 * noise(ts * 1.3, f.seed + 4);
  const mid = (tx - f.bx) * 0.35;
  return (
    `M${r1(f.bx - f.w)} ${f.by}` +
    `C${r1(f.bx - f.w * 1.35 + mid)} ${r1(f.by - h * 0.42)} ${r1(tx - f.w * 0.25 + curl)} ${r1(ty + h * 0.36)} ${r1(tx)} ${r1(ty)}` +
    `C${r1(tx + f.w * 0.45 + curl)} ${r1(ty + h * 0.4)} ${r1(f.bx + f.w * 1.35 + mid)} ${r1(f.by - h * 0.38)} ${r1(f.bx + f.w)} ${f.by}Z`
  );
}

interface Wisp {
  x: number; // where it leaves the flame
  life: number; // seconds from flame to gone
  offset: number; // 0..1, so the two are never in step
  seed: number;
}
const WISPS: readonly Wisp[] = [
  { x: 58.5, life: 5.2, offset: 0.18, seed: 2.1 },
  { x: 62, life: 6.1, offset: 0.66, seed: 6.4 },
];

// One curl of smoke at p (0..1) of its life: an S that rises along "up", gets longer and
// looser as it goes, and leans further downwind than the flame does.
function wisp(w: Wisp, p: number, t: number, lean: number): string {
  const a = lean * 1.7 + 0.1 * noise(t * 0.5, w.seed);
  const ux = -Math.sin(a);
  const uy = -Math.cos(a);
  const rise = 3 + 19 * p;
  const len = 7 + 8 * p;
  const amp = 2 + 3.5 * p;
  const sway = Math.sin(t * 1.1 + w.seed);
  const x0 = w.x + ux * rise;
  const y0 = 21 + uy * rise;
  // the normal to "up" is (-uy, ux)
  const c1x = x0 + (ux * len) / 3 - uy * amp * sway;
  const c1y = y0 + (uy * len) / 3 + ux * amp * sway;
  const c2x = x0 + (ux * len * 2) / 3 + uy * amp * sway;
  const c2y = y0 + (uy * len * 2) / 3 - ux * amp * sway;
  return `M${r1(x0)} ${r1(y0)}C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${r1(x0 + ux * len)} ${r1(y0 + uy * len)}`;
}
// in over the first part of its life, out over the rest; never heavier than a hint
const wispInk = (p: number) => r1(0.5 * Math.sin(Math.PI * p ** 0.7) * 10) / 10;

// The still fire: what the server draws, and what stays with reduced motion.
const STILL_T = 0.8;
const STILL_TONGUES = TONGUES.map((f) => tongue(f, STILL_T, 0));
const STILL_WISPS = WISPS.map((w) => ({
  d: wisp(w, w.offset, STILL_T, 0),
  ink: wispInk(w.offset),
}));
// three embers placed by hand; the animation picks them up where they are
const STILL_EMBERS = [
  { x: 66, y: 31, r: 1.5, age: 0.5, life: 2.4 },
  { x: 54.5, y: 20, r: 1.2, age: 1.1, life: 2.3 },
  { x: 63.5, y: 10, r: 0.9, age: 1.6, life: 2.2 },
] as const;
const EMBER_KEYS = Array.from({ length: POOL }, (_, i) => `e${i}`);

interface Ember {
  live: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r0: number;
  seed: number;
}

export function Firepit({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const flames = Array.from(svg.querySelectorAll<SVGPathElement>("[data-flame]"));
    const smokes = Array.from(svg.querySelectorAll<SVGPathElement>("[data-smoke]"));
    const dots = Array.from(svg.querySelectorAll<SVGCircleElement>("[data-ember]"));

    const embers: Ember[] = dots.map((_, i) => {
      const s = STILL_EMBERS[i];
      return {
        live: Boolean(s),
        x: s?.x ?? 0,
        y: s?.y ?? 0,
        vx: 0,
        vy: s ? -12 : 0,
        age: s?.age ?? 0,
        life: s?.life ?? 1,
        r0: s?.r ?? 1,
        seed: i * 2.4,
      };
    });

    let t = STILL_T;
    let wind = 0; // the phone's lean, as last reported
    let lean = 0; // the lean the air has caught up with
    let next = 0.3; // seconds until the next spark

    const throwEmber = () => {
      const e = embers.find((x) => !x.live);
      if (!e) return;
      e.live = true;
      e.x = 60 + (Math.random() - 0.5) * 15 - Math.sin(lean) * 8;
      e.y = 38 + Math.random() * 10;
      e.vx = (Math.random() - 0.5) * 14;
      e.vy = -(14 + Math.random() * 16);
      e.age = 0;
      e.life = 1.4 + Math.random() * 1.5;
      e.r0 = 1 + Math.random() * 0.7;
      e.seed = Math.random() * 40;
    };

    const frame = (dt: number) => {
      t += dt;
      lean += (wind - lean) * (1 - Math.exp(-dt * 3.5));
      // the garden's own air: never quite still
      const air = lean + 0.07 * noise(t * 0.45, 3.3);

      for (let i = 0; i < flames.length; i++) {
        const f = TONGUES[i];
        if (f) flames[i]?.setAttribute("d", tongue(f, t, air));
      }

      for (let i = 0; i < smokes.length; i++) {
        const w = WISPS[i];
        const el = smokes[i];
        if (!w || !el) continue;
        const p = ((t - STILL_T) / w.life + w.offset) % 1;
        el.setAttribute("d", wisp(w, p, t, air));
        el.setAttribute("opacity", String(wispInk(p)));
      }

      next -= dt;
      if (next <= 0) {
        throwEmber();
        if (Math.random() < 0.22) throwEmber(); // a log pops
        next = 0.12 + Math.random() * 0.5;
      }
      const ea = air * 1.4;
      const ux = -Math.sin(ea);
      const uy = -Math.cos(ea);
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        const el = dots[i];
        if (!e || !el || !e.live) continue;
        e.age += dt;
        const heat = 1 - e.age / e.life;
        if (heat <= 0) {
          e.live = false;
          el.setAttribute("r", "0");
          continue;
        }
        const lift = BUOYANCY * heat - WEIGHT;
        const gust = GUST * Math.sin(e.seed + t * (2.2 + (e.seed % 2)));
        e.vx += (ux * lift - uy * gust - DRAG * e.vx) * dt;
        e.vy += (uy * lift + ux * gust - DRAG * e.vy) * dt;
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        el.setAttribute("cx", String(r1(e.x)));
        el.setAttribute("cy", String(r1(e.y)));
        // full size while hot; shrinks to nothing over the last third of its life
        el.setAttribute("r", String(Math.round(e.r0 * Math.min(1, heat * 3) * 100) / 100));
      }
      return true; // a fire never comes to rest; the loop still sleeps off screen
    };

    const loop = createLoop(svg, frame);
    loop.wake();
    const offTilt = onTilt((rad) => {
      wind = rad;
    });
    return () => {
      offTilt();
      loop.stop();
    };
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 120 90"
      className={["pen", "firepit", className ?? ""].filter(Boolean).join(" ")}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 80C36 78 84 81 114 79" />
      {WISPS.map((w, i) => (
        <path
          key={w.seed}
          className="firepit__smoke"
          data-smoke=""
          d={STILL_WISPS[i]?.d}
          opacity={STILL_WISPS[i]?.ink}
          suppressHydrationWarning
        />
      ))}
      {TONGUES.map((f, i) => (
        <path
          key={f.seed}
          className={TONGUE_CLASS[i]}
          data-flame=""
          d={STILL_TONGUES[i]}
          suppressHydrationWarning
        />
      ))}
      {/* two crossed logs, the legs, then the bowl in front of it all */}
      <path
        className="firepit__solid"
        d="M39.5 55.5C50 53 62 50.5 73.5 47.5C76 48 76.5 51.5 74.5 52.5C63 55 51 58 40.5 60.5C38 60 37.5 56.5 39.5 55.5Z"
      />
      <path
        className="firepit__solid"
        d="M81 56.5C70 54 58 51 47 48.5C44.5 49 44 52.5 46 53.5C57 56 69 59 80 61.5C82.5 61 83 57.5 81 56.5Z"
      />
      <path d="M43 69C42 73 41 76 40 80M77 69C78 73 79 76 80 79" />
      <path className="firepit__solid" d="M30 58C46 56.5 74 59 90 57C88 67 76 72 60 72C44 72 32 67 30 58Z" />
      {EMBER_KEYS.map((key, i) => {
        const s = STILL_EMBERS[i];
        return (
          <circle
            key={key}
            className="firepit__ember"
            data-ember=""
            cx={s?.x ?? 60}
            cy={s?.y ?? 40}
            r={s?.r ?? 0}
          />
        );
      })}
    </svg>
  );
}
