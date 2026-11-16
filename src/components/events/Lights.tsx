"use client";

// A string of lights across the top of the night pages (2026-11-15): the wire swags
// between hooks, a bulb hangs at each low point and each rise, and the bulbs glow in the
// menu's yellow. It is the tent's string of lights from the Visit drawing, hung where
// "the lights dim". One short unit repeated; no images.
//
// The bulbs hang as pendulums. Each has its own stem, so its own length and its own period
// (about 1.7 to 2.3 seconds), and loses its swing slowly. Three things set them going:
// the phone's lean, which moves where "down" is; a fast scroll, which kicks them in
// proportion to its speed; and a soft gust now and then that travels along the string.
// The wire leans a hair with the bulbs it carries. Only the units inside the viewport are
// worked out and written; the loop sleeps when every bulb is all but still.
// Decorative, hidden from assistive tech; hangs still with reduced motion.

import { useEffect, useRef } from "react";
import { createLoop } from "@/lib/motion/loop";
import { onTilt } from "@/lib/motion/tilt";

const UNIT_COUNT = 14;
const UNIT_W = 132; // the unit's width in its own drawing units
const HOOK_Y = 7; // the wire is fixed at this height; it leans about this line
const GLASS = "M0 0C-2.8 1.8 -3.4 6.4 0 9.2C3.4 6.4 2.8 1.8 0 0Z";
/** where each of a unit's three bulbs hangs from the wire */
const HANG = [
  { x: 22, y: 23.5 },
  { x: 66, y: 8.5 },
  { x: 108, y: 24 },
] as const;

/** a fixed scatter in 0..1, the same on the server and in the browser */
function scatter(i: number, salt: number): number {
  return (Math.imul(i + 1 + salt * 101, 0x9e3779b1) >>> 0) / 4294967296;
}

const BULBS = Array.from({ length: UNIT_COUNT * 3 }, (_, i) => {
  const hang = HANG[i % 3] ?? HANG[0];
  const stem = 2 + Math.round(scatter(i, 0) * 12) / 2; // 2 to 8, in halves
  const length = stem + 6; // to about the middle of the glass
  return {
    x: hang.x,
    y: hang.y,
    stem,
    /** how far along the whole string, for the gust that travels */
    along: Math.floor(i / 3) * UNIT_W + hang.x,
    /** angular frequency: a period of 2 s at the middle length, by the root of the length */
    w: (2 * Math.PI) / (2 * Math.sqrt(length / 11)),
    /** damping ratio: light, so a swing takes a good few seconds to die */
    z: 0.04 + scatter(i, 1) * 0.02,
    /** how much of a scroll kick this bulb takes */
    gain: 0.55 + scatter(i, 2) * 0.45,
  };
});
const UNITS = Array.from({ length: UNIT_COUNT }, (_, u) => ({
  key: `u${u}`,
  bulbs: BULBS.slice(u * 3, u * 3 + 3),
}));

const WIRE_LEAN = 0.15; // how much of the bulbs' mean angle the wire takes up
const KICK_FROM = 500; // px/s: slower scrolling leaves the string alone
const KICK_SPAN = 3500; // px/s above that for the full kick
const KICK_MAX = 0.9; // rad/s
const GUST_MS = 2200;
const GUST_SPEED = 0.26; // px per ms along the string
const STILL_ANGLE = 0.002;
const STILL_SPEED = 0.004;

export function Lights({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const bulbs = Array.from(root.querySelectorAll<SVGGElement>(".lights__bulb"));
    const wires = Array.from(root.querySelectorAll<SVGPathElement>(".lights__wire"));
    const total = BULBS.length;
    if (bulbs.length !== total) return;

    const angle = new Float32Array(total);
    const speed = new Float32Array(total);
    const shown = new Float32Array(total); // the angle last written to each bulb
    let units = 0; // how many units are inside the viewport
    let tilt = 0;
    let gustAt = 0;
    let gustEnd = 0;
    let gustPush = 0;

    const hangStill = (from: number) => {
      for (let i = from * 3; i < total; i++) {
        angle[i] = 0;
        speed[i] = 0;
        shown[i] = 0;
        bulbs[i]?.style.removeProperty("transform");
      }
      for (let u = from; u < UNIT_COUNT; u++) wires[u]?.style.removeProperty("transform");
    };

    const frame = (dt: number, now: number) => {
      const gusting = now < gustEnd;
      let moving = gusting;
      for (let u = 0; u < units; u++) {
        let sum = 0;
        for (let i = u * 3; i < u * 3 + 3; i++) {
          const b = BULBS[i];
          if (!b) continue;
          let push = 0;
          if (gusting) {
            const p = (now - gustAt - b.along / GUST_SPEED) / GUST_MS;
            if (p > 0 && p < 1) push = gustPush * Math.sin(Math.PI * p) ** 2;
          }
          // a turn clockwise carries the bulb to the left, so a lean of the phone to the
          // right (positive tilt) puts "down" at an angle of minus the tilt
          let v = speed[i] ?? 0;
          let a = angle[i] ?? 0;
          v += (-b.w * b.w * Math.sin(a + tilt) - 2 * b.z * b.w * v + push) * dt;
          v = Math.max(-3, Math.min(3, v));
          a += v * dt;
          speed[i] = v;
          angle[i] = a;
          sum += a;
          if (Math.abs(v) > STILL_SPEED || Math.abs(a + tilt) > STILL_ANGLE) moving = true;
        }
        // the wire leans with what hangs on it; its hooks stay put
        const lean = (-WIRE_LEAN * sum) / 3;
        let drawn = false;
        for (let i = u * 3; i < u * 3 + 3; i++) {
          const b = BULBS[i];
          const g = bulbs[i];
          const a = angle[i] ?? 0;
          // nothing to see in a change this small (a hundredth of a pixel at the glass)
          if (!b || !g || Math.abs(a - (shown[i] ?? 0)) < 0.0005) continue;
          shown[i] = a;
          drawn = true;
          const dx = lean * (b.y - HOOK_Y);
          g.style.transform = `translate(${dx.toFixed(2)}px,0) rotate(${a.toFixed(4)}rad)`;
        }
        const wire = wires[u];
        if (drawn && wire) wire.style.transform = `matrix(1,0,${lean.toFixed(4)},1,0,0)`;
      }
      return moving;
    };

    let loop: ReturnType<typeof createLoop> | null = null;
    let offTilt = () => {};
    let gustTimer = 0;
    let lastY = 0;
    let lastT = 0;
    let peak = 0;

    const measure = () => {
      const box = root.getBoundingClientRect();
      const unit = root.firstElementChild?.getBoundingClientRect().width || UNIT_W;
      const right = Math.min(box.right, window.innerWidth);
      const next = Math.max(0, Math.min(UNIT_COUNT, Math.ceil((right - box.left) / unit)));
      if (next < units) hangStill(next);
      units = next;
      loop?.wake();
    };

    // a fast scroll kicks the string, once per burst, by the burst's top speed
    const onScroll = (e: Event) => {
      const y = window.scrollY;
      const gap = e.timeStamp - lastT;
      if (gap < 8) return;
      const pace = gap > 200 ? 0 : ((y - lastY) / gap) * 1000;
      if (gap > 200) peak = 0;
      lastY = y;
      lastT = e.timeStamp;
      const fast = Math.abs(pace);
      if (!loop?.seen || fast <= peak) return;
      const share = (s: number) => Math.max(0, Math.min(1, (s - KICK_FROM) / KICK_SPAN));
      const kick = (share(fast) - share(peak)) * KICK_MAX * Math.sign(pace);
      peak = fast;
      if (kick === 0) return;
      for (let i = 0; i < units * 3; i++) speed[i] = (speed[i] ?? 0) + kick * (BULBS[i]?.gain ?? 1);
      loop.wake();
    };

    // a soft gust now and then, from either side, so the string is never dead
    const gust = (wait: number) => {
      gustTimer = window.setTimeout(() => {
        if (loop?.seen && !document.hidden && units > 0) {
          gustAt = performance.now();
          gustEnd = gustAt + GUST_MS + (units * UNIT_W) / GUST_SPEED;
          gustPush = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.45);
          loop.wake();
        }
        gust(7000 + Math.random() * 8000);
      }, wait);
    };

    const start = () => {
      if (loop || calm.matches) return;
      loop = createLoop(root, frame);
      measure();
      offTilt = onTilt((radians) => {
        tilt = radians;
        loop?.wake();
      });
      lastY = window.scrollY;
      window.addEventListener("scroll", onScroll, { passive: true });
      gust(1400);
    };
    const end = () => {
      loop?.stop();
      loop = null;
      offTilt();
      offTilt = () => {};
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(gustTimer);
      tilt = 0;
      gustEnd = 0;
      hangStill(0);
    };
    const onCalm = () => (calm.matches ? end() : start());

    const sizes = new ResizeObserver(() => {
      if (loop) measure();
    });
    sizes.observe(root);
    calm.addEventListener("change", onCalm);
    start();
    return () => {
      calm.removeEventListener("change", onCalm);
      sizes.disconnect();
      end();
    };
  }, []);

  return (
    <div ref={ref} className={className ? `lights ${className}` : "lights"} aria-hidden="true">
      {UNITS.map((unit) => (
        <svg key={unit.key} viewBox="0 0 132 46" className="lights__unit" focusable="false">
          {/* the wire: hook to hook, sagging a little differently on each side of the middle */}
          <path className="lights__wire" d="M0 7C22 29 44 30 66 8C88 30 112 28 132 7" />
          {/* three bulbs: a stem of its own length and a drop of glass */}
          {unit.bulbs.map((b) => (
            <g key={b.x} className="lights__bulb" style={{ transformOrigin: `${b.x}px ${b.y}px` }}>
              <path className="lights__stem" d={`M${b.x} ${b.y}V${b.y + b.stem}`} />
              <path d={GLASS} transform={`translate(${b.x} ${b.y + b.stem})`} />
            </g>
          ))}
        </svg>
      ))}
    </div>
  );
}
