// Motion curves as numbers (spec §2.6). The same values as the --ease-* tokens, so motion
// sheets plot and sample them exactly, and Motion (the library) can use them in JS.

export type Bezier = readonly [number, number, number, number];

export const CURVES = {
  out: { token: "--ease-out", values: [0.2, 0.8, 0.2, 1], job: "Entrances, reveals" },
  inOut: { token: "--ease-in-out", values: [0.65, 0, 0.35, 1], job: "Wipes, page transitions" },
  stamp: { token: "--ease-stamp", values: [0.3, 1.6, 0.5, 1], job: "Stickers and stamps overshoot" },
  fall: { token: "--ease-fall", values: [0.33, 0, 0.67, 0.33], job: "Under gravity, falling" },
  rise: { token: "--ease-rise", values: [0.33, 0.67, 0.67, 1], job: "Under gravity, rising" },
} as const satisfies Record<string, { token: string; values: Bezier; job: string }>;

export type CurveName = keyof typeof CURVES;

export const SPRINGS = {
  sticker: { stiffness: 420, damping: 22, mass: 0.9 },
  heavy: { stiffness: 180, damping: 26, mass: 1 },
} as const;

export const DURATIONS = { press: 120, control: 220, panel: 420, setPiece: 800 } as const;

export function curveCss(v: Bezier): string {
  return `cubic-bezier(${v.join(", ")})`;
}

/** Progress at time t (0..1) for a CSS cubic-bezier(x1, y1, x2, y2). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (s: number) => ((ax * s + bx) * s + cx) * s;
  const y = (s: number) => ((ay * s + by) * s + cy) * s;
  const dx = (s: number) => (3 * ax * s + 2 * bx) * s + cx;

  // Solve x(s) = t for s: Newton first, bisection if it stalls.
  const solve = (t: number) => {
    let s = t;
    for (let i = 0; i < 8; i++) {
      const err = x(s) - t;
      if (Math.abs(err) < 1e-7) return s;
      const d = dx(s);
      if (Math.abs(d) < 1e-6) break;
      s -= err / d;
    }
    let lo = 0;
    let hi = 1;
    s = t;
    while (hi - lo > 1e-7) {
      if (x(s) < t) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return s;
  };

  return (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : y(solve(t)));
}

/** n + 1 evenly spaced progress values from t = 0 to 1. */
export function sample(v: Bezier, n: number): number[] {
  const f = cubicBezier(...v);
  return Array.from({ length: n + 1 }, (_, i) => f(i / n));
}

export interface Spring {
  stiffness: number;
  damping: number;
  mass: number;
}

/**
 * A spring (0 → 1, at rest) simulated and sampled into a CSS linear() easing, so a spring
 * entrance needs no JavaScript. `duration` is when it settles within 0.1% and stops moving.
 */
export function springToLinear(s: Spring, samples = 48): { points: number[]; duration: number; css: string } {
  const dt = 1 / 1000;
  let x = 0;
  let v = 0;
  const trace: number[] = [0];
  for (let ms = 1; ms < 3000; ms++) {
    const a = (-s.stiffness * (x - 1) - s.damping * v) / s.mass;
    v += a * dt;
    x += v * dt;
    trace.push(x);
    if (ms > 50 && Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break;
  }
  const duration = trace.length - 1;
  const points = Array.from({ length: samples + 1 }, (_, i) => {
    if (i === samples) return 1;
    const p = trace[Math.round((i / samples) * duration)] ?? 1;
    return Math.round(p * 1000) / 1000;
  });
  return { points, duration, css: `linear(${points.join(", ")})` };
}
