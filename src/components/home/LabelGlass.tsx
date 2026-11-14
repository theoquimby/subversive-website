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
  "S-40 292 -22 302S6 314 22 317S44 318 54 314",
  // the foot's near edge, up the stem (with its knop), the bowl's left side
  "C82 309 97 306 97 298V268C93 266 93 260 97 258V249C80 247 64.6 236 59.9 212C52.8 176 45.7 96 43.4 14",
  // round the rim, down the right side, the stem again, and the foot
  "A56.6 4.5 0 0 0 156.6 14A56.6 4.5 0 0 0 43.4 14A56.6 4.5 0 0 0 156.6 14",
  "C154.3 96 147.2 176 140.1 212C135.4 236 120 247 103 249V258C107 260 107 266 103 268V298",
  "C103 306 118 309 146 313A46 6.5 0 0 1 54 314",
].join("");
const TAP_LINE = "M4000 -58H132C112 -58 100 -54 100 -44V-34M92 -34H108";

const N = 17; // surface springs
const X0 = 36;
const X1 = 164;
const MAX_BUBBLES = 16;
const MAX_SPILLS = 6;

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
    const stream = q<SVGRectElement>(".lglass__stream");
    const handle = q<SVGGElement>(".lglass__handle");
    const bubbleEls = [...root.querySelectorAll<SVGCircleElement>(".lglass__bubbles circle")];
    const spillEls = [...root.querySelectorAll<SVGCircleElement>(".lglass__spills circle")];
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
      bubbles: [] as { x: number; y: number; r: number; vy: number; ph: number }[],
      spills: [] as { y: number; vy: number; r: number; side: 1 | -1 }[],
    };
    let raf = 0;
    let last = 0;

    const colour = (b: GlassBeer) => {
      body.setAttribute("fill", b.color);
      stream.setAttribute("fill", b.color);
      haze.style.display = b.hazy ? "" : "none";
    };

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
        stream.setAttribute("x", (100 - w / 2 + Math.sin(s.t * 31) * 0.35).toFixed(2));
        stream.setAttribute("width", w.toFixed(2));
        stream.setAttribute("y", a.toFixed(1));
        stream.setAttribute("height", (b - a).toFixed(1));
        stream.style.display = "";
      } else stream.style.display = "none";
      handle.setAttribute("transform", `rotate(${(-34 * s.flow).toFixed(1)} 128 -58)`);
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
        // down the outside of the bowl, then straight to the ground
        const edge = sp.y < 212 ? 57.6 - (sp.y - 14) * 0.086 : 40;
        el.style.display = "";
        el.setAttribute("cx", (100 + sp.side * (edge + 2.5)).toFixed(1));
        el.setAttribute("cy", sp.y.toFixed(1));
        el.setAttribute("r", sp.r.toFixed(2));
      });
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
        const kick = (0.6 + Math.random() * 0.8) * 620 * landing * dt;
        v[mid] = (v[mid] ?? 0) + kick;
        v[mid - 1] = (v[mid - 1] ?? 0) + kick * 0.5;
        v[mid + 1] = (v[mid + 1] ?? 0) + kick * 0.5;
      }

      // the head settles back into beer, quickly while the tap waits
      const settle = s.phase === "rest" ? 1.5 : s.f > HEAD ? 0.22 : 0.02;
      const lost = s.f * settle * dt;
      s.f -= lost;
      s.y = Math.max(LEVEL - 1, s.y - lost * 0.12);

      // too much head: it domes over the rim and runs down the outside of the glass
      const crest = s.y - s.f;
      if (crest < RIM + 1) {
        s.f -= Math.min(s.f, 34 * dt + Math.max(0, RIM - 7 - crest));
        if (s.spills.length < MAX_SPILLS && Math.random() < 14 * dt)
          s.spills.push({ y: 13, vy: 30, r: 4.6 + Math.random() * 3.2, side: Math.random() < 0.5 ? 1 : -1 });
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

      // the surface: springs that pull back to level and pass their motion along
      for (let i = 0; i < N; i++) {
        const acc = -150 * (h[i] ?? 0) - 3.4 * (v[i] ?? 0);
        v[i] = (v[i] ?? 0) + acc * dt;
        h[i] = Math.max(-11, Math.min(11, (h[i] ?? 0) + (v[i] ?? 0) * dt));
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
      if (s.y < FLOOR - 24 && s.bubbles.length < MAX_BUBBLES && Math.random() < lively * 16 * dt)
        s.bubbles.push({
          x: 76 + Math.random() * 48,
          y: 236 - Math.random() * 14,
          r: 0.8 + Math.random() * 1.3,
          vy: 16 + Math.random() * 14,
          ph: Math.random() * 6,
        });
      for (let i = s.bubbles.length - 1; i >= 0; i--) {
        const b = s.bubbles[i];
        if (!b) continue;
        b.vy += 46 * dt;
        b.y -= b.vy * dt;
        b.x += Math.sin(s.t * 6 + b.ph) * 7 * dt;
        b.r += 0.25 * dt;
        if (b.y <= s.y + 3) s.bubbles.splice(i, 1);
      }
      for (let i = s.spills.length - 1; i >= 0; i--) {
        const sp = s.spills[i];
        if (!sp) continue;
        sp.vy += (sp.y < 212 ? 260 : 900) * dt;
        sp.y += sp.vy * dt;
        if (sp.y > 212) sp.r *= 1 - 1.2 * dt;
        if (sp.y >= GROUND - 2) s.spills.splice(i, 1);
      }

      if (s.phase === "settle") {
        let moving = s.flow > 0.01 || s.tail > SPOUT || s.spills.length > 0 || s.bubbles.length > 0;
        for (let i = 0; i < N && !moving; i++)
          if (Math.abs(h[i] ?? 0) > 0.08 || Math.abs(v[i] ?? 0) > 0.4) moving = true;
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

    model.current = {
      start,
      stop: () => {
        cancelAnimationFrame(raf);
        raf = 0;
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
      <rect
        className="lglass__stream"
        x="97.5"
        y={SPOUT}
        width="5"
        height="0"
        rx="2"
        fill={b0.color}
        style={{ display: "none" }}
      />

      <g clipPath="url(#lglass-inside)" className="lglass__liquid">
        <path className="lglass__body" d={REST.body} fill={b0.color} />
        <path className="lglass__haze" d={REST.body} style={b0.hazy ? undefined : { display: "none" }} />
        <g className="lglass__bubbles">
          {Array.from({ length: MAX_BUBBLES }, (_, i) => `b${i}`).map((k) => (
            <circle key={k} r="1" style={{ display: "none" }} />
          ))}
        </g>
        <path className="lglass__foam" d={REST.foam} />
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
          <circle key={k} r="3" style={{ display: "none" }} />
        ))}
      </g>

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
