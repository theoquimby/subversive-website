// Time-by-progress plot of one cubic-bezier, with its four values printed (spec §3A review
// loop, item 2). Coordinates are computed from the curve, never eyeballed.
interface Props {
  name: string;
  values: readonly [number, number, number, number];
  job: string;
}

const W = 160;
const H = 120;
const PAD = 76; // headroom for the largest overshoot (ease-stamp reaches y = 1.6 → 0.6 × H + 4)

export function CurvePlot({ name, values, job }: Props) {
  const [x1, y1, x2, y2] = values;
  const px = (x: number) => x * W;
  const py = (y: number) => PAD + H - y * H;
  const d = `M ${px(0)} ${py(0)} C ${px(x1)} ${py(y1)}, ${px(x2)} ${py(y2)}, ${px(1)} ${py(1)}`;

  return (
    <figure className="kit-curve">
      <svg viewBox={`-2 0 ${W + 4} ${H + PAD + 8}`} role="img" aria-labelledby={`curve-${name}`}>
        <title id={`curve-${name}`}>{`${name}: cubic-bezier(${values.join(", ")})`}</title>
        <rect x={0} y={PAD} width={W} height={H} className="kit-curve__frame" />
        <line x1={0} y1={py(1)} x2={W} y2={py(1)} className="kit-curve__target" />
        <line x1={px(0)} y1={py(0)} x2={px(x1)} y2={py(y1)} className="kit-curve__handle" />
        <line x1={px(1)} y1={py(1)} x2={px(x2)} y2={py(y2)} className="kit-curve__handle" />
        <circle cx={px(x1)} cy={py(y1)} r={3} className="kit-curve__knob" />
        <circle cx={px(x2)} cy={py(y2)} r={3} className="kit-curve__knob" />
        <path d={d} className="kit-curve__line" />
      </svg>
      <figcaption>
        <span className="kit-label">{name}</span>
        <code className="kit-code tabular">{values.join(", ")}</code>
        <span className="kit-note">{job}</span>
      </figcaption>
    </figure>
  );
}
