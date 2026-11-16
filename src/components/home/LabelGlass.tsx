"use client";

// The hero's drawing and its pour.
//
// The drawing is one ink line: it comes in from the left edge of the screen as the
// ground, rises into the Catskill ridge, comes back down and, without lifting, becomes
// their stemmed glass (foot, stem, bowl, rim, and back down). A second line comes in from
// the right as the bar tap above the glass. Flat colour, nothing shaded.
//
// The pour is simulated, then drawn flat. Each frame a small model moves: the tap opens,
// a stream falls under gravity, the liquid level rises faster where the bowl is narrow,
// the surface is a row of springs that the stream keeps kicking (so it sloshes and
// settles), the head builds with the pour and settles back into beer, and bubbles leave
// the bottom and speed up as they rise. A lively beer throws too much head: it runs over
// the rim and down the glass, the tap stops, the head drops, and the tap tops it up, as
// behind a bar. The model writes straight to the SVG (no React render per frame) and
// stops itself when everything is still.
//
// Fidelity pass, 2026-11-15 (Theo): the beer answers the phone. Where the device reports
// its tilt, the surface finds the world's level and sloshes on the way (the tilt itself is
// a spring, so the beer overshoots and settles); bubbles rise against gravity, not up the
// screen. Bubbles leave from a few fixed points on the bowl in strings, as in a real
// glass, and the stream drags a burst of them under where it lands. Head that goes over
// the rim domes above it and runs down the outside as drips with tails, not loose dots.
// iOS only gives the tilt after a tap and its own permission prompt: it is asked for on
// the first tap in the hero.
//
// Without JavaScript, or with reduced motion, the glass is simply full.
import { useEffect, useRef } from "react";
import { BARLEY_VIEWBOX, KERNELS } from "../graphics/BarleyMark";

// Glass coordinates: the bowl spans x 43–157, its rim is at y 14, the ground at y 319.
const INSIDE =
  "M49.3 16C51.6 96 58.7 176 65.8 210C69.3 231 83.5 243 100 243C116.5 243 130.7 231 134.2 210C141.3 176 148.4 96 150.7 16Z";
const RIM = 16;
const LEVEL = 50; // a full pour's liquid line
const HEAD = 17; // a settled head's thickness
const FLOOR = 246;
const SPOUT = -34;
const GROUND = 318;

// The ridge, then the glass, in one stroke. Left of x -980 the ground runs on, flat.
const GROUND_LINE = "M-4000 319H-978";
const ONE_LINE = [
  "M-980 319C-950 319 -930 311 -905 308S-865 302 -845 305S-800 290 -772 289S-735 301 -705 302",
  "S-660 284 -628 280S-585 269 -560 275S-520 297 -490 300S-455 307 -430 305S-392 284 -362 277",
  "S-330 265 -305 270S-270 287 -248 284S-205 254 -172 249S-130 255 -112 268S-88 276 -70 274",
  // down to the ground, which runs flat under the glass and becomes the foot's near edge
  "S-40 292 -24 304S-6 320 12 320H100A46 6 0 0 0 146 314",
  // the foot's far edge to the stem (with its knop), then the bowl's right side
  "C118 309 103 306 103 298V268C107 266 107 260 103 258V249C120 247 135.4 236 140.1 212C147.2 176 154.3 96 156.6 14",
  // round the rim, down the left side, the stem again, and the foot closes where it began
  "A56.6 4.5 0 0 1 43.4 14A56.6 4.5 0 0 1 156.6 14A56.6 4.5 0 0 1 43.4 14",
  "C45.7 96 52.8 176 59.9 212C64.6 236 80 247 97 249V258C93 260 93 266 97 268V298",
  "C97 306 82 309 54 314A46 6 0 0 0 100 320",
].join("");
const TAP_LINE = "M4000 -58H132C112 -58 100 -54 100 -44V-34M92 -34H108";

const N = 17; // surface springs
const X0 = 36;
const X1 = 164;
const MAX_BUBBLES = 30;
const TILT = 17; // degrees of lean the beer will follow before it would be over the rim
// where strings of bubbles leave the bowl: x, y
const SITES: [number, number][] = [
  [80, 226],
  [93, 239],
  [106, 240],
  [119, 229],
  [100, 176],
];
const MAX_SPILLS = 6;
const MAX_DROPS = 8;
const HEAD_BUBBLES = 6;

export interface GlassBeer {
  id?: string;
  color: string;
  hazy?: boolean;
}

/** The liquid's and the head's outlines for a level, a head thickness and a surface. */
export function shapes(y: number, f: number, h: ArrayLike<number> | null, t: number) {
  const step = (X1 - X0) / (N - 1);
  const top: [number, number][] = [];
  for (let i = 0; i < N; i++) top.push([X0 + i * step, y + (h ? (h[i] ?? 0) : 0)]);
  // a smooth line through the midpoints
  const curve = (pts: [number, number][]) => {
    const first = pts[0] as [number, number];
    let d = `${first[0].toFixed(1)} ${first[1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i] as [number, number];
      const q = pts[i + 1] as [number, number];
      d += `Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${((p[0] + q[0]) / 2).toFixed(1)} ${((p[1] + q[1]) / 2).toFixed(1)}`;
    }
    const last = pts[pts.length - 1] as [number, number];
    return `${d}L${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
  };
  const body = `M${curve(top)}V300H${X0}Z`;
  if (f < 0.6) return { body, foam: "" };
  // the head: its underside follows the beer, its top is a row of soft crowns that drift
  const crown = top.map(([x, sy], i): [number, number] => {
    const bump = Math.abs(Math.sin(i * 1.05 + t * 0.9)) * Math.min(5, f * 0.3);
    const drift = Math.sin(i * 1.7 + t * 1.4) * Math.min(1.6, f * 0.08);
    return [x, sy - f - bump - drift - (sy - y) * 0.45];
  });
  const under = [...top].reverse();
  const foam = `M${curve(crown)}L${curve(under).replace(/^/, "")}Z`;
  return { body, foam };
}

const REST = shapes(LEVEL, HEAD, null, 0);

/** 0–1 from a string, stable: which pours come out lively. */
function chance(s: string) {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619);
  return ((x >>> 0) % 1000) / 1000;
}

export function LabelGlass({
  beer,
  pour,
  className,
}: {
  beer: GlassBeer;
  /** changes with every pour */
  pour: number;
  className?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const first = useRef(beer); // what the server drew; the model owns the colour after that
  const model = useRef<{ start: (b: GlassBeer, n: number) => void; stop: () => void } | null>(null);

  useEffect(() => {
    const root = svg.current;
    if (!root) return;
    const q = <T extends Element>(s: string) => root.querySelector(s) as T;
    const body = q<SVGPathElement>(".lglass__body");
    const haze = q<SVGPathElement>(".lglass__haze");
    const foam = q<SVGPathElement>(".lglass__foam");
    const stream = q<SVGPathElement>(".lglass__stream");
    const dropEls = [...root.querySelectorAll<SVGCircleElement>(".lglass__drops circle")];
    const headEls = [...root.querySelectorAll<SVGCircleElement>(".lglass__head circle")];
    const handle = q<SVGGElement>(".lglass__handle");
    const bubbleEls = [...root.querySelectorAll<SVGCircleElement>(".lglass__bubbles circle")];
    const spillEls = [...root.querySelectorAll<SVGPathElement>(".lglass__spills path")];
    const dome = q<SVGPathElement>(".lglass__dome");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    const h = new Float32Array(N);
    const v = new Float32Array(N);
    const s = {
      phase: "idle" as "idle" | "drain" | "fill" | "rest" | "topup" | "settle",
      y: LEVEL,
      f: HEAD,
      flow: 0,
      open: false,
      t: 0,
      front: SPOUT, // the stream's leading end
      frontV: 0,
      tail: SPOUT, // its trailing end, once the tap shuts
      tailV: 0,
      head: 1,
      rest: 0,
      carb: 0,
      next: null as GlassBeer | null,
      bubbles: [] as { x: number; y: number; r: number; vx: number; vy: number; ph: number }[],
      // a drip: its leading end, where its tail still clings, its speed, its size
      spills: [] as { y: number; top: number; vy: number; r: number; side: 1 | -1 }[],
      tilt: 0, // the beer's lean, radians; follows tiltTo as a spring
      tiltV: 0,
      tiltTo: 0,
      dome: 0, // how far the head stands above the rim
      drops: [] as { x: number; y: number; vx: number; vy: number; r: number }[],
    };
    let raf = 0;
    let last = 0;

    const colour = (b: GlassBeer) => {
      body.setAttribute("fill", b.color);
      stream.setAttribute("fill", b.color);
      for (const el of dropEls) el.setAttribute("fill", b.color);
      haze.style.display = b.hazy ? "" : "none";
    };

    const xOf = (i: number) => X0 + (i * (X1 - X0)) / (N - 1);
    /** where the surface wants to be at spring i: the world's level, seen from a leaning glass */
    const level = (i: number) => Math.max(-19, Math.min(19, -Math.tan(s.tilt) * (xOf(i) - 100)));
    /** the surface's offset at any x */
    const hAt = (x: number) => {
      const at = Math.max(0, Math.min(N - 1.001, ((x - X0) / (X1 - X0)) * (N - 1)));
      const lo = Math.floor(at);
      return (h[lo] ?? 0) + ((h[lo + 1] ?? 0) - (h[lo] ?? 0)) * (at - lo);
    };
    /** the outside of the bowl at a height, on one side */
    const edge = (y: number, side: 1 | -1) => 100 + side * (58.4 - (y - 14) * 0.086);

    const draw = () => {
      const d = shapes(s.y, s.f, h, s.t);
      body.setAttribute("d", d.body);
      haze.setAttribute("d", d.body);
      foam.setAttribute("d", d.foam);
      // the stream: from its tail to its front, never below the surface
      const surface = s.y + (h[(N - 1) / 2] ?? 0) - s.f * 0.5;
      const a = Math.max(SPOUT, s.tail);
      const b = Math.min(s.front, surface);
      if (b - a > 1 && (s.flow > 0.02 || s.tail > SPOUT)) {
        const w = 2.4 + 2.8 * Math.max(s.flow, s.tail > SPOUT ? 0.6 : 0);
        // wider at the spout, narrower and a little unsteady where it lands
        const wb = w * 0.62;
        const sway = Math.sin(s.t * 23) * 0.9 + Math.sin(s.t * 37) * 0.4;
        const midY = (a + b) / 2;
        stream.setAttribute(
          "d",
          `M${(100 - w / 2).toFixed(2)} ${a.toFixed(1)}H${(100 + w / 2).toFixed(2)}` +
            `Q${(100 + w / 2).toFixed(2)} ${midY.toFixed(1)} ${(100 + wb / 2 + sway).toFixed(2)} ${b.toFixed(1)}` +
            `H${(100 - wb / 2 + sway).toFixed(2)}Q${(100 - w / 2).toFixed(2)} ${midY.toFixed(1)} ${(100 - w / 2).toFixed(2)} ${a.toFixed(1)}Z`,
        );
        stream.style.display = "";
      } else stream.style.display = "none";
      handle.setAttribute("transform", `rotate(${(-34 * s.flow).toFixed(1)} 128 -58)`);
      dropEls.forEach((el, i) => {
        const d = s.drops[i];
        if (!d) {
          el.style.display = "none";
          return;
        }
        el.style.display = "";
        el.setAttribute("cx", d.x.toFixed(1));
        el.setAttribute("cy", d.y.toFixed(1));
        el.setAttribute("r", d.r.toFixed(2));
      });
      // a row of bubbles along the head's top edge, riding the surface
      headEls.forEach((el, k) => {
        if (s.f < 5) {
          el.style.display = "none";
          return;
        }
        const at = 1.5 + k * 2.8;
        const lo = Math.floor(at);
        const hh = (h[lo] ?? 0) + ((h[lo + 1] ?? 0) - (h[lo] ?? 0)) * (at - lo);
        el.style.display = "";
        el.setAttribute("cx", (X0 + (at * (X1 - X0)) / (N - 1)).toFixed(1));
        el.setAttribute("cy", (s.y + hh * 0.55 - s.f - 1 + Math.sin(s.t * 2.1 + k * 1.9) * 0.8).toFixed(1));
        el.setAttribute("r", (3.4 + ((k * 7) % 3) * 1.1 + Math.min(2, s.f * 0.04)).toFixed(2));
      });
      bubbleEls.forEach((el, i) => {
        const bb = s.bubbles[i];
        if (!bb) {
          el.style.display = "none";
          return;
        }
        el.style.display = "";
        el.setAttribute("cx", bb.x.toFixed(1));
        el.setAttribute("cy", bb.y.toFixed(1));
        el.setAttribute("r", bb.r.toFixed(2));
      });
      spillEls.forEach((el, i) => {
        const sp = s.spills[i];
        if (!sp) {
          el.style.display = "none";
          return;
        }
        el.style.display = "";
        const r = sp.r;
        if (sp.y < 212) {
          // clinging to the bowl: a rounded leading end and a tail back up to where it left
          const xi = edge(sp.y, sp.side);
          const xo = xi + sp.side * r * 1.7;
          const xt = edge(sp.top, sp.side);
          el.setAttribute(
            "d",
            `M${xt.toFixed(1)} ${sp.top.toFixed(1)}L${xi.toFixed(1)} ${sp.y.toFixed(1)}` +
              `A${(r * 0.75).toFixed(2)} ${r.toFixed(2)} 0 0 ${sp.side > 0 ? 0 : 1} ${xo.toFixed(1)} ${sp.y.toFixed(1)}` +
              `L${(xt + sp.side * 2.6).toFixed(1)} ${sp.top.toFixed(1)}Z`,
          );
        } else {
          // off the bowl: a falling drop, pointed at the top
          const x = 100 + sp.side * 42.5;
          el.setAttribute(
            "d",
            `M${x.toFixed(1)} ${(sp.y - r * 2.2).toFixed(1)}Q${(x + r * 1.1).toFixed(1)} ${sp.y.toFixed(1)} ${x.toFixed(1)} ${(sp.y + r).toFixed(1)}` +
              `Q${(x - r * 1.1).toFixed(1)} ${sp.y.toFixed(1)} ${x.toFixed(1)} ${(sp.y - r * 2.2).toFixed(1)}Z`,
          );
        }
      });
      // head standing above the rim, with a slow uneven crown
      if (s.dome > 0.4) {
        const a = s.dome;
        const w = (k: number) => (15 - a * (1 + 0.16 * Math.sin(s.t * 1.7 + k * 2.1))).toFixed(1);
        dome.setAttribute(
          "d",
          `M45.5 15.5Q57 ${w(0)} 72 ${w(1)}T100 ${(15 - a * 1.12).toFixed(1)}T128 ${w(2)}Q143 ${w(3)} 154.5 15.5Z`,
        );
        dome.style.display = "";
      } else dome.style.display = "none";
    };

    const step = (dt: number) => {
      s.t += dt;
      if (s.phase === "drain") {
        // the last beer goes down fast; its head thins as it falls
        s.y += (FLOOR + 16 - s.y) * Math.min(1, dt * 7) + 70 * dt;
        s.f *= Math.exp(-dt * 7);
        s.bubbles.length = 0;
        if (s.y >= FLOOR + 8) {
          s.y = FLOOR + 8;
          s.f = 0;
          if (s.next) colour(s.next);
          s.phase = "fill";
          s.open = true;
          s.front = SPOUT;
          s.frontV = 60;
          s.tail = SPOUT;
          s.tailV = 0;
          s.carb = 1;
        }
      }
      s.flow += ((s.open ? 1 : 0) - s.flow) * Math.min(1, dt * 11);

      // the stream falls; when the tap shuts its tail falls after it
      const mid = (N - 1) / 2;
      const surface = s.y + (h[mid] ?? 0) - s.f * 0.5;
      if (s.open || s.front > SPOUT) {
        s.frontV += 1500 * dt;
        s.front = Math.min(surface, s.front + s.frontV * dt);
      }
      if (!s.open && s.flow < 0.25 && s.front > SPOUT) {
        s.tailV += 1500 * dt;
        s.tail += (s.tailV + 120) * dt;
        if (s.tail >= surface) {
          s.tail = SPOUT;
          s.tailV = 0;
          s.front = SPOUT;
          s.frontV = 0;
        }
      }
      const landing = s.front >= surface - 1 && (s.open ? s.flow : s.tail > SPOUT ? 0.7 : 0);

      if (landing && (s.phase === "fill" || s.phase === "topup" || s.tail > SPOUT)) {
        // the bowl is narrow at the bottom, so the level climbs fastest there
        const width = 30 + (FLOOR - s.y) * 0.36;
        const rise = landing * 118 * (100 / width) * dt;
        s.y = Math.max(LEVEL - 1, s.y - Math.min(rise, 9));
        s.f += landing * s.head * 9.5 * dt;
        const kick = (0.6 + Math.random() * 0.8) * 860 * landing * dt;
        // droplets jump where the stream lands
        if (s.drops.length < MAX_DROPS && Math.random() < 34 * landing * dt)
          s.drops.push({
            x: 100 + (Math.random() - 0.5) * 6,
            y: surface,
            vx: (Math.random() - 0.5) * 90,
            vy: -(70 + Math.random() * 120),
            r: 1 + Math.random() * 1.4,
          });
        // ...and the stream drags a burst of bubbles under with it
        if (s.bubbles.length < MAX_BUBBLES && s.y < FLOOR - 30 && Math.random() < 30 * landing * dt)
          s.bubbles.push({
            x: 100 + (Math.random() - 0.5) * 10,
            y: Math.min(236, surface + s.f * 0.5 + 6 + Math.random() * 10),
            r: 0.7 + Math.random() * 1.5,
            vx: (Math.random() - 0.5) * 26,
            vy: -(50 + Math.random() * 80),
            ph: Math.random() * 6,
          });
        v[mid] = (v[mid] ?? 0) + kick;
        v[mid - 1] = (v[mid - 1] ?? 0) + kick * 0.5;
        v[mid + 1] = (v[mid + 1] ?? 0) + kick * 0.5;
      }

      // the head settles back into beer, quickly while the tap waits
      const settle = s.phase === "rest" ? 1.5 : s.f > HEAD ? 0.22 : 0.02;
      const lost = s.f * settle * dt;
      s.f -= lost;
      s.y = Math.max(LEVEL - 1, s.y - lost * 0.12);

      // too much head: it stands above the rim, then runs down the outside of the glass.
      // Each side is judged on its own, so a lean sends it over the low side.
      const crestL = s.y + hAt(52) - s.f;
      const crestR = s.y + hAt(148) - s.f;
      const crest = Math.min(crestL, crestR);
      const over = Math.max(0, RIM + 3 - crest);
      // it stands a moment after the excess has gone, as foam does
      const stand = Math.min(13, over * 2.4 + (s.spills.some((sp) => sp.y < 60) ? 5 : 0));
      s.dome += (stand - s.dome) * Math.min(1, dt * (stand > s.dome ? 9 : 1.6));
      if (crest < RIM + 1) {
        s.f -= Math.min(s.f, 34 * dt + Math.max(0, RIM - 7 - crest));
        if (s.spills.length < MAX_SPILLS && Math.random() < 11 * dt) {
          const low =
            Math.abs(crestL - crestR) < 1.5 ? (Math.random() < 0.5 ? -1 : 1) : crestL < crestR ? -1 : 1;
          s.spills.push({
            y: 17,
            top: 14.5,
            vy: 12 + Math.random() * 16,
            r: 4.4 + Math.random() * 3,
            side: low,
          });
        }
      }

      if (s.phase === "fill" || s.phase === "topup") {
        // shut a little early: what is still falling finishes the pour
        if (s.y <= LEVEL + 7) {
          s.open = false;
          s.phase = "settle";
        } else if (s.y - s.f <= RIM - 4) {
          // head at the rim and the beer still short: stop and let it drop
          s.open = false;
          s.phase = "rest";
          s.rest = 0.75;
        }
      } else if (s.phase === "rest") {
        s.rest -= dt;
        if (s.rest <= 0 && s.tail === SPOUT) {
          if (s.y > LEVEL + 4) {
            s.phase = "topup";
            s.open = true;
            s.head = 0.3; // a gentle top-up
            s.front = SPOUT;
            s.frontV = 60;
          } else s.phase = "settle";
        }
      }

      // the lean follows the phone as a spring, a little underdamped: the beer overshoots
      s.tiltV += (70 * (s.tiltTo - s.tilt) - 5.5 * s.tiltV) * dt;
      s.tilt += s.tiltV * dt;
      // the surface: springs that pull to the world's level and pass their motion along
      for (let i = 0; i < N; i++) {
        const acc = -150 * ((h[i] ?? 0) - level(i)) - 3.4 * (v[i] ?? 0);
        v[i] = (v[i] ?? 0) + acc * dt;
        h[i] = Math.max(-21, Math.min(21, (h[i] ?? 0) + (v[i] ?? 0) * dt));
      }
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < N; i++) {
          if (i > 0) v[i - 1] = (v[i - 1] ?? 0) + 14 * ((h[i] ?? 0) - (h[i - 1] ?? 0)) * dt;
          if (i < N - 1) v[i + 1] = (v[i + 1] ?? 0) + 14 * ((h[i] ?? 0) - (h[i + 1] ?? 0)) * dt;
        }
      }

      // bubbles leave the bottom while the beer is fresh, and speed up as they rise
      if (s.phase !== "drain" && s.phase !== "idle") s.carb = Math.max(0, s.carb - dt / 11);
      const lively = s.carb * (s.flow > 0.1 ? 2.2 : 1);
      if (s.y < FLOOR - 24 && s.bubbles.length < MAX_BUBBLES && Math.random() < lively * 22 * dt) {
        // a string leaves from one of a few points on the bowl, as in a real glass
        const site = SITES[Math.floor(Math.random() * SITES.length)] as [number, number];
        if (site[1] > s.y + 12)
          s.bubbles.push({
            x: site[0] + (Math.random() - 0.5) * 2.4,
            y: site[1],
            r: 0.6 + Math.random() * Math.random() * 1.9,
            vx: 0,
            vy: 10 + Math.random() * 10,
            ph: Math.random() * 6,
          });
      }
      const gx = Math.sin(s.tilt);
      const gy = Math.cos(s.tilt);
      for (let i = s.bubbles.length - 1; i >= 0; i--) {
        const b = s.bubbles[i];
        if (!b) continue;
        // buoyancy is against gravity, wherever that is; bigger bubbles rise faster
        const lift = 40 + b.r * 14;
        b.vy += lift * gy * dt;
        b.vx += -lift * gx * dt - b.vx * 1.8 * dt;
        b.vy = Math.min(b.vy, 62 + b.r * 22);
        b.y -= b.vy * dt;
        b.x += (b.vx + Math.sin(s.t * 6 + b.ph) * 6) * dt;
        b.y = Math.min(b.y, 241);
        b.r += 0.22 * dt;
        if (b.y <= s.y + hAt(b.x) + 3) {
          // it reaches the surface and joins the head with the smallest of nudges
          const at = Math.round(((b.x - X0) / (X1 - X0)) * (N - 1));
          if (at >= 0 && at < N) v[at] = (v[at] ?? 0) - b.r * 5;
          s.bubbles.splice(i, 1);
        }
      }
      for (let i = s.drops.length - 1; i >= 0; i--) {
        const d = s.drops[i];
        if (!d) continue;
        d.vy += 760 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.vy > 0 && d.y >= s.y - s.f * 0.5) s.drops.splice(i, 1);
      }
      for (let i = s.spills.length - 1; i >= 0; i--) {
        const sp = s.spills[i];
        if (!sp) continue;
        if (sp.y < 212) {
          // creeping down the glass: slow to start, and the tail lets go behind it
          sp.vy += (60 + sp.r * 26) * dt;
          sp.vy = Math.min(sp.vy, 150);
          sp.top += (sp.y - sp.top - 14 > 0 ? sp.vy * 0.8 : sp.vy * 0.25) * dt;
        } else {
          sp.vy += 900 * dt;
          sp.r *= 1 - 0.9 * dt;
        }
        sp.y += sp.vy * dt;
        if (sp.y >= GROUND - 2) s.spills.splice(i, 1);
      }

      if (s.phase === "settle") {
        let moving =
          s.flow > 0.01 ||
          s.tail > SPOUT ||
          s.spills.length > 0 ||
          s.bubbles.length > 0 ||
          s.drops.length > 0;
        if (Math.abs(s.tiltTo - s.tilt) > 0.003 || Math.abs(s.tiltV) > 0.02 || s.dome > 0.4) moving = true;
        for (let i = 0; i < N && !moving; i++)
          if (Math.abs((h[i] ?? 0) - level(i)) > 0.08 || Math.abs(v[i] ?? 0) > 0.4) moving = true;
        if (!moving && s.carb <= 0 && Math.abs(s.f - HEAD) < 1.5) s.phase = "idle";
        // a head that came up short or tall eases to its settled size
        s.f += (HEAD - s.f) * Math.min(1, dt * 0.9);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
      last = now;
      // two half steps keep the springs steady on a slow frame
      step(dt / 2);
      step(dt / 2);
      draw();
      raf = s.phase === "idle" ? 0 : requestAnimationFrame(frame);
    };

    const start = (b: GlassBeer, n: number) => {
      if (still.matches) {
        // reduced motion: the next beer is simply there
        cancelAnimationFrame(raf);
        raf = 0;
        colour(b);
        s.phase = "idle";
        s.y = LEVEL;
        s.f = HEAD;
        s.flow = 0;
        s.front = SPOUT;
        s.tail = SPOUT;
        s.bubbles.length = 0;
        s.spills.length = 0;
        s.drops.length = 0;
        s.tilt = 0;
        s.tiltV = 0;
        s.tiltTo = 0;
        s.dome = 0;
        h.fill(0);
        v.fill(0);
        draw();
        return;
      }
      s.next = b;
      // about one pour in three is lively; a hazy beer throws a bit more head anyway
      const lively = n > 0 && chance(`${b.id ?? b.color}:${n}`) < 0.34;
      s.head = (lively ? 7 : 1) * (b.hazy ? 1.2 : 1);
      s.open = false;
      s.phase = "drain";
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    // ---- the phone's lean. gamma is the roll in portrait; turned on its side it is beta.
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null || still.matches) return;
      const turn = window.screen.orientation?.angle ?? 0;
      const deg = turn === 90 ? e.beta : turn === 270 ? -e.beta : e.gamma;
      s.tiltTo = (Math.max(-TILT, Math.min(TILT, deg)) * Math.PI) / 180;
      // wake the model if the glass was at rest and the lean is worth answering
      if (!raf && Math.abs(s.tiltTo - s.tilt) > 0.012) {
        if (s.phase === "idle") s.phase = "settle";
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    let listening = false;
    const listen = () => {
      if (listening) return;
      listening = true;
      window.addEventListener("deviceorientation", onTilt);
    };
    // iOS hands the tilt over only after a tap and its own prompt; elsewhere it is simply there
    const Orientation = window.DeviceOrientationEvent as
      | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
      | undefined;
    const hero = root.closest(".tap-hero") ?? root;
    const ask = () => {
      Orientation?.requestPermission?.()
        .then((answer) => {
          if (answer === "granted") listen();
        })
        .catch(() => {
          // refused or unavailable: the glass simply stays level
        });
    };
    if (Orientation && !still.matches) {
      if (typeof Orientation.requestPermission === "function")
        hero.addEventListener("click", ask, { once: true });
      else listen();
    }

    model.current = {
      start,
      stop: () => {
        cancelAnimationFrame(raf);
        raf = 0;
        window.removeEventListener("deviceorientation", onTilt);
        hero.removeEventListener("click", ask);
      },
    };

    // on arrival: an empty glass under the tap, and the first beer pours itself
    if (!still.matches) {
      s.y = FLOOR + 8;
      s.f = 0;
      draw();
      root.dataset.sim = "run";
      start(first.current, 0);
    } else root.dataset.sim = "run";

    return () => model.current?.stop();
  }, []);

  // each later pour
  const seen = useRef(pour);
  useEffect(() => {
    if (seen.current === pour) return;
    seen.current = pour;
    model.current?.start(beer, pour);
  }, [pour, beer]);

  const b0 = first.current;
  return (
    <svg
      ref={svg}
      viewBox="38 -92 124 413"
      className={className ? `lglass ${className}` : "lglass"}
      data-sim="wait"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="lglass-inside">
          <path d={INSIDE} />
        </clipPath>
      </defs>

      {/* the stream, from the spout to the surface */}
      <path className="lglass__stream" d="" fill={b0.color} style={{ display: "none" }} />

      <g clipPath="url(#lglass-inside)" className="lglass__liquid">
        <path className="lglass__body" d={REST.body} fill={b0.color} />
        <path className="lglass__haze" d={REST.body} style={b0.hazy ? undefined : { display: "none" }} />
        <g className="lglass__bubbles">
          {Array.from({ length: MAX_BUBBLES }, (_, i) => `b${i}`).map((k) => (
            <circle key={k} r="1" style={{ display: "none" }} />
          ))}
        </g>
        <path className="lglass__foam" d={REST.foam} />
        <g className="lglass__head">
          {Array.from({ length: HEAD_BUBBLES }, (_, i) => `h${i}`).map((k) => (
            <circle key={k} r="4" style={{ display: "none" }} />
          ))}
        </g>
        <g className="lglass__drops">
          {Array.from({ length: MAX_DROPS }, (_, i) => `d${i}`).map((k) => (
            <circle key={k} r="1.5" fill={b0.color} style={{ display: "none" }} />
          ))}
        </g>
      </g>

      {/* the barley mark, printed on the bowl as on their glassware */}
      <svg x="85" y="92" width="30" height="85" viewBox={BARLEY_VIEWBOX} className="lglass__mark">
        {KERNELS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
      {/* one highlight down the bowl's left side */}
      <path d="M58.7 44C59.9 96 65.8 160 71.7 196" className="lglass__shine" />

      {/* head that went over the rim */}
      <g className="lglass__spills">
        {Array.from({ length: MAX_SPILLS }, (_, i) => `s${i}`).map((k) => (
          <path key={k} d="" style={{ display: "none" }} />
        ))}
      </g>
      <path className="lglass__dome" d="" style={{ display: "none" }} />

      <g className="lglass__line">
        <path d={GROUND_LINE} />
        <path d={ONE_LINE} className="lglass__one" />
        <path d={TAP_LINE} />
        <g className="lglass__handle">
          <path d="M128 -58L135 -78" />
          <circle cx="136.4" cy="-82" r="4.2" className="lglass__knob" />
        </g>
      </g>
    </svg>
  );
}
