"use client";

// A delivery truck on the map. When a town is chosen and its pen road has drawn itself,
// a little van sets off from the town, drives the road and pulls up short of the taproom.
//
// Cartoon drawing, real physics:
// - along the road it is a mass with a throttle and a brake: it accelerates to a cruising
//   speed, brakes at a constant rate so as to arrive, and stops;
// - the box is a mass on a spring and damper above the wheels, in heave and in pitch. The
//   wheels follow small bumps in the road (base excitation), and the truck's own
//   acceleration tips the box (squat setting off, dive under braking), so the box wobbles
//   a beat behind the wheels and rocks back when it stops.
//
// The road is read once (the route's own geometry, sampled), so a frame costs two
// transform writes and nothing else. No React render per frame. With reduced motion the
// truck simply stands at the taproom end of the road.
//
// It finds the route as its sibling `.smap__route`; SourceMap keys it by the chosen
// source, so choosing another removes this truck and starts a new one.
import { useEffect, useRef } from "react";
import { createLoop } from "@/lib/motion/loop";

const SAMPLES = 96;
/** seconds after the choice: the road finishes drawing at about 1.66 s (home.css) */
const SET_OFF = 1.6;
/** the truck's centre stops this far (on-screen units) before the road's end, clear of the mark */
const SHORT = 14;
/** roads shorter than this on screen are not worth a drive */
const MIN_TRIP = 60;
/** half the wheelbase, on-screen units (the drawing is about twice its design size) */
const AXLE = 15;
const MAX_TILT = 25;
const DEG = 180 / Math.PI;

// the springs: natural frequency (rad/s) and damping ratio, loose enough to see
const HEAVE_W = 2 * Math.PI * 3.4;
const HEAVE_Z = 0.24;
const PITCH_W = 2 * Math.PI * 2.6;
const PITCH_Z = 0.22;
/** how far the box squats (degrees) under the full throttle */
const SQUAT = 6;

/** the road's surface under a wheel, in design units, by distance along the road */
const bump = (s: number) =>
  0.45 * Math.sin((2 * Math.PI * s) / 64) + 0.25 * Math.sin((2 * Math.PI * s) / 27 + 1.3);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function MapTruck({ k }: { k: number }) {
  const root = useRef<SVGGElement>(null);
  const box = useRef<SVGGElement>(null);
  const puffs = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = root.current;
    const boxEl = box.current;
    const puffEl = puffs.current;
    const route = el?.parentElement?.querySelector<SVGPathElement>(".smap__route");
    if (!el || !boxEl || !puffEl || !route) return;

    // the road, read once: map units
    const total = route.getTotalLength();
    const travel = Math.max(0, total - SHORT * k);
    if (!(total > 0)) {
      el.style.display = "none";
      return;
    }
    const xs = new Float32Array(SAMPLES + 1);
    const ys = new Float32Array(SAMPLES + 1);
    for (let i = 0; i <= SAMPLES; i++) {
      const p = route.getPointAtLength((travel * i) / SAMPLES);
      xs[i] = p.x;
      ys[i] = p.y;
    }
    const trip = travel / k; // the same road in on-screen units

    // where the truck is and which way the road runs, a fraction u of the way along
    let x = 0;
    let y = 0;
    let heading = 0;
    const locate = (u: number) => {
      const f = clamp(u, 0, 1) * SAMPLES;
      const i = Math.min(SAMPLES - 1, Math.floor(f));
      const x0 = xs[i] ?? 0;
      const y0 = ys[i] ?? 0;
      const dx = (xs[i + 1] ?? x0) - x0;
      const dy = (ys[i + 1] ?? y0) - y0;
      x = x0 + dx * (f - i);
      y = y0 + dy * (f - i);
      if (dx || dy) heading = Math.atan2(dy, dx);
    };
    // the truck never drives upside down: it faces left or right and leans with the road
    let dir = 1;
    const lean = () => {
      let deg = heading * DEG - (dir < 0 ? 180 : 0);
      if (deg > 180) deg -= 360;
      if (deg < -180) deg += 360;
      return clamp(deg, -MAX_TILT, MAX_TILT);
    };
    let tilt = 0;
    let face = 1;
    const draw = () => {
      el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${tilt.toFixed(2)}deg) scale(${face.toFixed(3)},1)`;
    };
    const stand = (u: number) => {
      locate(u);
      dir = Math.cos(heading) >= 0 ? 1 : -1;
      face = dir;
      tilt = lean();
      draw();
    };

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || trip < MIN_TRIP) {
      stand(1);
      el.dataset.parked = "";
      return;
    }

    // the drive: a trapezoid of speed, sized so a long road takes a little longer
    const time = clamp(1.5 + trip / 350, 1.7, 3);
    const cruise = trip / (time - (0.7 + 0.55) / 2);
    const throttle = cruise / 0.7;
    const brake = cruise / 0.55;
    const creep = cruise * 0.05;
    const tip = (SQUAT * PITCH_W * PITCH_W) / throttle;

    let t = 0;
    let s = 0;
    let v = 0;
    let off = false;
    let arrived = false;
    // the box starts at rest on its springs
    let z = (bump(AXLE) + bump(-AXLE)) / 2;
    let zv = 0;
    let pitch = ((bump(-AXLE) - bump(AXLE)) / AXLE) * DEG; // nose down is positive
    let pv = 0;

    stand(0);
    puffEl.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${tilt.toFixed(2)}deg) scale(${dir},1)`;

    const loop = createLoop(el, (dt) => {
      t += dt;
      if (t < SET_OFF) return true;
      if (!off) {
        off = true;
        puffEl.dataset.go = "";
      }

      // along the road
      let a = 0;
      if (!arrived) {
        const v0 = v;
        const left = trip - s;
        v =
          left <= (v * v) / (2 * brake) + v * dt
            ? Math.max(creep, v - brake * dt)
            : Math.min(cruise, v + throttle * dt);
        s += v * dt;
        if (s >= trip) {
          s = trip;
          v = 0;
          arrived = true;
        }
        // the last jolt is a real one, but kept to a nudge
        a = clamp((v - v0) / dt, -3 * brake, throttle);
        locate(s / trip);
        const c = Math.cos(heading);
        if (dir > 0 ? c < -0.2 : c > 0.2) dir = -dir;
      }
      tilt += (lean() - tilt) * Math.min(1, dt * 10);
      face += (dir - face) * Math.min(1, dt * 14);
      if (Math.abs(dir - face) < 0.01) face = dir;

      // the box on its springs: the wheels carry the road up into it, and the truck's own
      // acceleration tips it
      const front = bump(s + AXLE);
      const rear = bump(s - AXLE);
      const zRoad = (front + rear) / 2;
      const pRoad = ((rear - front) / AXLE) * DEG;
      zv += (-HEAVE_W * HEAVE_W * (z - zRoad) - 2 * HEAVE_Z * HEAVE_W * zv) * dt;
      z += zv * dt;
      pv += (-PITCH_W * PITCH_W * (pitch - pRoad) - 2 * PITCH_Z * PITCH_W * pv - tip * a) * dt;
      pitch += pv * dt;

      const settled =
        arrived &&
        face === dir &&
        Math.abs(z - zRoad) < 0.03 &&
        Math.abs(zv) < 0.3 &&
        Math.abs(pitch - pRoad) < 0.1 &&
        Math.abs(pv) < 1;
      if (settled) {
        z = zRoad;
        pitch = pRoad;
        tilt = lean();
      }
      draw();
      boxEl.style.transform = `translate(0,${(-z).toFixed(2)}px) rotate(${pitch.toFixed(2)}deg)`;
      return !settled;
    });
    loop.wake();
    return () => loop.stop();
  }, [k]);

  return (
    <>
      {/* a puff or two of exhaust, left behind where it set off */}
      <g ref={puffs} className="smap__puffs">
        <g className="smap__truck-k">
          <circle cx="-16" cy="-3.5" r="1.9" className="smap__puff" />
          <circle cx="-17.5" cy="-5" r="2.5" className="smap__puff" />
        </g>
      </g>
      {/* the truck: drawn facing right, its wheels on 0,0; about 28 units long */}
      <g ref={root} className="smap__truck">
        <g className="smap__truck-k">
          <g ref={box} className="smap__truck-box">
            <path d="M-13.2 -4.1L-13 -15.4L3.2 -15.8L3 -4Z" />
            <path d="M3 -4L3.1 -12.3L8.3 -12.5L11.5 -8.3L13.1 -7.7L13 -4Z" />
            <path d="M5.2 -10.6L7.7 -10.7L9.6 -8.1L5.2 -8Z" className="smap__truck-glass" />
          </g>
          <circle cx="-7.5" cy="-2.8" r="2.8" className="smap__truck-wheel" />
          <circle cx="7.5" cy="-2.8" r="2.8" className="smap__truck-wheel" />
        </g>
      </g>
    </>
  );
}
