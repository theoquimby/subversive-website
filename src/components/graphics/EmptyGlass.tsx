"use client";

// The 404 glass (2026-11-15): the house glass drawn empty, in the same hand as the `empty`
// drawing in home/Ways.tsx, with the last drop made real. It is a bead of beer at the
// bottom of the bowl that runs round the inside like a marble in a cup: one coordinate
// (distance along the bowl's inner curve), gravity resolved along the curve's tangent,
// rolling friction so it rocks back and settles. A phone's lean moves it; under a mouse the
// glass itself leans a little toward the pointer. It leaves a thin wet line on the wall
// that dries in about a second. With reduced motion or no script the bead sits at the
// bottom. Nothing renders per frame: two transforms and one dash are written directly.
import { type CSSProperties, useEffect, useRef } from "react";
import { createLoop } from "@/lib/motion/loop";
import { onTilt, tiltNow } from "@/lib/motion/tilt";

// The same strokes as DRAWINGS.empty in Ways.tsx, in the order they are drawn.
const GROUND = "M4 86C30 84 90 87 116 85";
const BOWL = "M38 12C40 46 44 66 60 66C76 66 80 46 82 12C68 7 52 7 38 12C52 17 68 17 82 12";
const STEM = "M60 66V79";
const FOOT = "M44 85C52 79 68 79 76 85C68 89 52 89 44 85";
// the bead about its own middle, a little flat where it sits on the glass (local +y)
const BEAD =
  "M-4.4 0.4C-4.5 -2.2 -2.3 -3.9 0.1 -3.8C2.6 -3.8 4.5 -2 4.4 0.5C4.3 2.8 2.4 3.8 0 3.8C-2.5 3.8 -4.3 2.7 -4.4 0.4Z";

// The bowl's wall, rim to bottom to rim: the first two curves of BOWL.
type Pt = readonly [number, number];
const WALL: readonly (readonly [Pt, Pt, Pt, Pt])[] = [
  [
    [38, 12],
    [40, 46],
    [44, 66],
    [60, 66],
  ],
  [
    [60, 66],
    [76, 66],
    [80, 46],
    [82, 12],
  ],
];
const BEAD_OFF = 5.1; // the bead's middle stands this far in from the wall's line
const WET_OFF = 1.9; // the wet line lies just inside the ink
const TOP = 25; // the bead's middle never rises above this (the rim's front edge is at 16)
const N = 72; // samples, evenly spaced along the bead's path

// The inner curve as a table, evenly spaced by distance: where the bead's middle is, which
// way the curve runs there (unit tangent, left to right), and how far along the wet line.
const CURVE = (() => {
  const dense: { x: number; y: number; tx: number; ty: number; wx: number; wy: number; s: number }[] = [];
  const STEPS = 240;
  for (let k = 0; k <= STEPS * 2; k++) {
    const seg = WALL[k < STEPS ? 0 : 1];
    if (!seg) continue;
    const t = k < STEPS ? k / STEPS : (k - STEPS) / STEPS;
    const u = 1 - t;
    const [p0, p1, p2, p3] = seg;
    const at = (i: 0 | 1) =>
      u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i];
    const d = (i: 0 | 1) =>
      3 * u * u * (p1[i] - p0[i]) + 6 * u * t * (p2[i] - p1[i]) + 3 * t * t * (p3[i] - p2[i]);
    const len = Math.sqrt(d(0) * d(0) + d(1) * d(1)) || 1;
    const tx = d(0) / len;
    const ty = d(1) / len;
    // the inward normal of a curve running left to right under the bowl is (ty, -tx)
    const x = at(0) + ty * BEAD_OFF;
    const y = at(1) - tx * BEAD_OFF;
    if (y < TOP) continue;
    const prev = dense[dense.length - 1];
    const s = prev ? prev.s + Math.sqrt((x - prev.x) ** 2 + (y - prev.y) ** 2) : 0;
    dense.push({ x, y, tx, ty, wx: at(0) + ty * WET_OFF, wy: at(1) - tx * WET_OFF, s });
  }
  const total = dense[dense.length - 1]?.s ?? 1;
  const X: number[] = [];
  const Y: number[] = [];
  const TX: number[] = [];
  const TY: number[] = [];
  const WET: number[] = []; // distance along the wet line at each sample
  const points: string[] = [];
  let j = 0;
  let wx0 = 0;
  let wy0 = 0;
  for (let i = 0; i < N; i++) {
    const s = (total * i) / (N - 1);
    while (j < dense.length - 2 && (dense[j + 1]?.s ?? 0) < s) j++;
    const a = dense[j];
    const b = dense[j + 1];
    if (!a || !b) continue;
    const f = Math.min(1, Math.max(0, (s - a.s) / (b.s - a.s || 1)));
    X.push(a.x + (b.x - a.x) * f);
    Y.push(a.y + (b.y - a.y) * f);
    TX.push(a.tx + (b.tx - a.tx) * f);
    TY.push(a.ty + (b.ty - a.ty) * f);
    // rounded here so the length is measured along the line exactly as it is drawn
    const wx = Number((a.wx + (b.wx - a.wx) * f).toFixed(2));
    const wy = Number((a.wy + (b.wy - a.wy) * f).toFixed(2));
    const before = WET[i - 1] ?? 0;
    WET.push(i === 0 ? 0 : before + Math.sqrt((wx - wx0) ** 2 + (wy - wy0) ** 2));
    wx0 = wx;
    wy0 = wy;
    points.push(`${wx},${wy}`);
  }
  return { X, Y, TX, TY, WET, points: points.join(" "), total, half: total / 2 };
})();

/** Read one column of the table at s (distance from the bottom; right is positive). */
function read(col: readonly number[], s: number): number {
  const f = ((s + CURVE.half) / CURVE.total) * (N - 1);
  const i = Math.min(N - 2, Math.max(0, Math.floor(f)));
  const a = col[i] ?? 0;
  const b = col[i + 1] ?? a;
  return a + (b - a) * Math.min(1, Math.max(0, f - i));
}

function beadAt(s: number, stretch = 1): string {
  const angle = (Math.atan2(read(CURVE.TY, s), read(CURVE.TX, s)) * 180) / Math.PI;
  const at = `translate(${read(CURVE.X, s).toFixed(2)} ${read(CURVE.Y, s).toFixed(2)}) rotate(${angle.toFixed(1)})`;
  return stretch === 1 ? at : `${at} scale(${stretch.toFixed(3)} ${(1 / stretch).toFixed(3)})`;
}

// One drawing unit is about 2 mm of a real glass. Gravity is a little under life size so
// the rocking can be followed on a drawing an inch wide; a rolling ball keeps 5/7 of it.
const G = 2400 * (5 / 7);
const DRAG = 1.5; // per second: the beer drags on the glass
const GRIP = 0.03; // rolling friction, as a share of gravity: what finally stops it
// The wall is steep, so a true 26 degree lean would move the bead a few millimetres. The
// lean is taken as three times what it is: a hard one sends the bead up to the rim, where
// it stops, and it settles half way up the wall.
const PHONE_GAIN = 3;
const LEAN_MAX = 0.24; // radians the glass itself leans under a pointer
const LEAN_GAIN = 5; // and how much steeper the bead takes that lean to be
const DRY = 0.3; // seconds for the wet line's far end to catch up
const PIVOT = "60 85"; // the glass leans about its foot

export function EmptyGlass({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const glass = useRef<SVGGElement>(null);
  const bead = useRef<SVGGElement>(null);
  const wet = useRef<SVGPolylineElement>(null);

  useEffect(() => {
    const root = svg.current;
    const glassEl = glass.current;
    const beadEl = bead.current;
    const wetEl = wet.current;
    if (!root || !glassEl || !beadEl || !wetEl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const reach = CURVE.half;
    let s = 0; // the bead: distance along the curve from the bottom
    let v = 0;
    let tail = 0; // the far end of the wet line, chasing the bead
    let phone = tiltNow();
    let lean = 0; // the glass's lean under a pointer, and where it is heading
    let leanTo = 0;
    let box: DOMRect | null = null;

    const step = (dt: number, theta: number) => {
      const pull = G * (read(CURVE.TX, s) * Math.sin(theta) + read(CURVE.TY, s) * Math.cos(theta));
      const grip = G * GRIP;
      if (Math.abs(v) < 1 && Math.abs(pull) <= grip) {
        v = 0;
        return;
      }
      const against = Math.abs(v) < 1 ? Math.sign(pull) : Math.sign(v);
      v += (pull - against * grip - DRAG * v) * dt;
      s += v * dt;
      // the top of its run: it stops dead there, it never leaves the glass
      if (s > reach) {
        s = reach;
        if (v > 0) v = 0;
      } else if (s < -reach) {
        s = -reach;
        if (v < 0) v = 0;
      }
    };

    const loop = createLoop(root, (dt) => {
      lean += (leanTo - lean) * (1 - Math.exp(-dt * 9));
      if (Math.abs(leanTo - lean) < 0.0005) lean = leanTo;
      const theta = phone * PHONE_GAIN + lean * LEAN_GAIN;
      for (let i = 0; i < 4; i++) step(dt / 4, theta);
      tail += (s - tail) * (1 - Math.exp(-dt / DRY));
      const a = read(CURVE.WET, Math.min(s, tail));
      const long = read(CURVE.WET, Math.max(s, tail)) - a;

      glassEl.setAttribute("transform", `rotate(${((lean * 180) / Math.PI).toFixed(2)} ${PIVOT})`);
      // a bead of liquid lengthens a little along its run when it is moving fast
      beadEl.setAttribute("transform", beadAt(s, 1 + Math.min(0.14, Math.abs(v) / 900)));
      wetEl.style.strokeDasharray = `0 ${a.toFixed(2)} ${long.toFixed(2)} 400`;
      wetEl.style.opacity = Math.min(1, long / 8).toFixed(2);

      const moving = v !== 0 || lean !== leanTo || long > 0.3;
      if (!moving) {
        tail = s;
        wetEl.style.opacity = "0";
      }
      return moving;
    });

    const offTilt = onTilt((radians) => {
      phone = radians;
      loop.wake();
    });

    // a mouse or a pen only: a phone has its own lean, and a finger is on its way elsewhere
    const over = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      box ??= root.getBoundingClientRect();
      const across = (e.clientX - box.left) / (box.width || 1);
      leanTo = Math.min(1, Math.max(-1, across * 2 - 1)) * LEAN_MAX;
      loop.wake();
    };
    const away = () => {
      box = null;
      leanTo = 0;
      loop.wake();
    };
    root.addEventListener("pointermove", over);
    root.addEventListener("pointerleave", away);
    root.addEventListener("pointercancel", away);

    return () => {
      offTilt();
      loop.stop();
      root.removeEventListener("pointermove", over);
      root.removeEventListener("pointerleave", away);
      root.removeEventListener("pointercancel", away);
    };
  }, []);

  const order = (i: number) => ({ "--i": i }) as CSSProperties;
  return (
    <svg
      ref={svg}
      viewBox="0 0 120 90"
      className={["pen", "empty-glass", className ?? ""].filter(Boolean).join(" ")}
      data-draw=""
      aria-hidden="true"
      focusable="false"
    >
      <g>
        <path d={GROUND} pathLength={1} style={order(0)} />
      </g>
      <g ref={glass}>
        <path d={BOWL} pathLength={1} style={order(1)} />
        <path d={STEM} pathLength={1} style={order(2)} />
        <path d={FOOT} pathLength={1} style={order(3)} />
        <polyline ref={wet} className="empty-glass__wet" points={CURVE.points} />
        <g ref={bead} transform={beadAt(0)}>
          <path className="empty-glass__bead" d={BEAD} pathLength={1} style={order(4)} />
        </g>
      </g>
    </svg>
  );
}
