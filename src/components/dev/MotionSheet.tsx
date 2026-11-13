// Motion sheet (spec §3A review loop, item 2): seven evenly timed ghost frames of one set
// piece, each frame's value and the step to the next labelled, beside the easing plotted.
// Every number is computed from the same curve or spring the CSS uses.
import type { ReactNode } from "react";
import { type Bezier, cubicBezier } from "@/lib/motion/curves";
import { CurvePlot } from "./CurvePlot";

export interface SheetSpec {
  name: string;
  job: string;
  durationMs: number;
  /** A cubic-bezier, or a sampled spring (progress values from t = 0 to 1). */
  easing: { bezier: Bezier; token: string } | { spring: number[]; token: string };
  /** Value at progress p (0 → 1, may overshoot), with its unit. */
  value: (p: number) => number;
  unit: string;
  /** Draw the object at progress p. */
  draw: (p: number) => ReactNode;
}

const FRAMES = 7;

function progressAt(spec: SheetSpec, t: number): number {
  if ("bezier" in spec.easing) return cubicBezier(...spec.easing.bezier)(t);
  const pts = spec.easing.spring;
  const x = t * (pts.length - 1);
  const i = Math.floor(x);
  const a = pts[i] ?? 1;
  const b = pts[Math.min(i + 1, pts.length - 1)] ?? 1;
  return a + (b - a) * (x - i);
}

const fmt = (n: number) => (Math.abs(n) >= 10 ? n.toFixed(0) : n.toFixed(2));

export function MotionSheet({ spec }: { spec: SheetSpec }) {
  const frames = Array.from({ length: FRAMES }, (_, i) => {
    const t = i / (FRAMES - 1);
    const p = progressAt(spec, t);
    return { t, p, ms: Math.round(t * spec.durationMs), v: spec.value(p) };
  });
  return (
    <figure className="motion-sheet">
      <figcaption className="motion-sheet__head">
        <span className="kit-label">{spec.name}</span>
        <span className="kit-note">
          {spec.job} · {spec.durationMs} ms · {spec.easing.token}
        </span>
      </figcaption>
      {/* scrolls sideways on phones, so it takes keyboard focus (axe: scrollable-region-focusable) */}
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard */}
      <ol className="motion-sheet__strip" tabIndex={0} aria-label={`${spec.name}, seven frames`}>
        {frames.map((f, i) => {
          const next = frames[i + 1];
          return (
            <li key={f.ms} className="motion-sheet__frame">
              <span className="motion-sheet__stage">{spec.draw(f.p)}</span>
              <span className="kit-code tabular">{f.ms} ms</span>
              <span className="kit-code tabular">
                {fmt(f.v)}
                {spec.unit}
              </span>
              {next ? (
                <span className="motion-sheet__gap tabular">
                  Δ {fmt(next.v - f.v)}
                  {spec.unit}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      {"bezier" in spec.easing ? (
        <CurvePlot name={spec.easing.token} values={spec.easing.bezier} job="" />
      ) : (
        <SpringPlot points={spec.easing.spring} token={spec.easing.token} />
      )}
    </figure>
  );
}

function SpringPlot({ points, token }: { points: number[]; token: string }) {
  const W = 160;
  const H = 120;
  const PAD = 24;
  const d = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${((i / (points.length - 1)) * W).toFixed(1)} ${(PAD + H - p * H).toFixed(1)}`,
    )
    .join("");
  return (
    <figure className="kit-curve">
      <svg viewBox={`-2 0 ${W + 4} ${H + PAD + 8}`} role="img" aria-label={`${token}, sampled spring`}>
        <rect x={0} y={PAD} width={W} height={H} className="kit-curve__frame" />
        <line x1={0} y1={PAD} x2={W} y2={PAD} className="kit-curve__target" />
        <path d={d} className="kit-curve__line" />
      </svg>
      <figcaption>
        <span className="kit-label">{token}</span>
      </figcaption>
    </figure>
  );
}
