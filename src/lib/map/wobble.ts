// The pen's wobble, drawn into the shapes themselves (2026-11-15).
//
// The map used to put its geography through a live SVG displacement filter so that an
// accurate outline read as drawn by hand. A live filter is recomputed for every frame of
// the camera's glide: in Safari's engine the map ran at about 25 frames a second with
// stalls of up to 360 ms. docs/motion-rules.md rule 7 already said it: roughness is baked
// into the shapes, not added by a filter. This does that: each point of an outline is
// nudged by a smooth, repeatable field (the same point always moves the same way), and
// the outline is then drawn as one soft line through the midpoints, as a pen would.

/** A smooth field in -1..1: nearby points get nearly the same value. */
function field(x: number, y: number): number {
  return (
    (Math.sin(x * 0.043 + 1.3) * Math.cos(y * 0.051 + 0.7) +
      0.6 * Math.sin(x * 0.118 + y * 0.094 + 2.1) +
      0.35 * Math.cos(x * 0.31 - y * 0.27)) /
    1.95
  );
}

/** One point, nudged by up to `amount` map units. */
export function nudge(x: number, y: number, amount: number): [number, number] {
  return [x + field(x, y) * amount, y + field(y + 31, x - 17) * amount];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Redraw an outline made of M, l/L and z commands (what scripts/build-ny-map.ts emits) as
 * a hand-drawn one: its points nudged, then joined by curves through their midpoints.
 */
export function wobblePath(d: string, amount = 3.2): string {
  const tokens = d.match(/[MmLlZz]|-?\d*\.?\d+/g) ?? [];
  const subpaths: { points: [number, number][]; closed: boolean }[] = [];
  let cmd = "";
  let x = 0;
  let y = 0;
  let current: { points: [number, number][]; closed: boolean } | null = null;
  for (let i = 0; i < tokens.length; ) {
    const t = tokens[i] as string;
    if (/[MmLlZz]/.test(t)) {
      cmd = t;
      i++;
      if (cmd === "Z" || cmd === "z") {
        if (current) current.closed = true;
        current = null;
      }
      continue;
    }
    const a = Number(t);
    const b = Number(tokens[i + 1]);
    i += 2;
    if (cmd === "M" || cmd === "L") {
      x = a;
      y = b;
    } else {
      x += a;
      y += b;
    }
    if (cmd === "M" || cmd === "m" || !current) {
      current = { points: [], closed: false };
      subpaths.push(current);
      // a move is followed by implicit lines
      cmd = cmd === "M" ? "L" : cmd === "m" ? "l" : cmd;
    }
    current.points.push(nudge(x, y, amount));
  }

  let out = "";
  for (const { points, closed } of subpaths) {
    const n = points.length;
    if (n < 3) continue;
    const mid = (p: [number, number], q: [number, number]) => [r1((p[0] + q[0]) / 2), r1((p[1] + q[1]) / 2)];
    if (closed) {
      // start at a midpoint so the join is as soft as every other corner
      const start = mid(points[n - 1] as [number, number], points[0] as [number, number]);
      out += `M${start[0]} ${start[1]}`;
      for (let k = 0; k < n; k++) {
        const p = points[k] as [number, number];
        const m = mid(p, points[(k + 1) % n] as [number, number]);
        out += `Q${r1(p[0])} ${r1(p[1])} ${m[0]} ${m[1]}`;
      }
      out += "Z";
    } else {
      const first = points[0] as [number, number];
      out += `M${r1(first[0])} ${r1(first[1])}`;
      for (let k = 1; k < n - 1; k++) {
        const p = points[k] as [number, number];
        const m = mid(p, points[k + 1] as [number, number]);
        out += `Q${r1(p[0])} ${r1(p[1])} ${m[0]} ${m[1]}`;
      }
      const last = points[n - 1] as [number, number];
      out += `L${r1(last[0])} ${r1(last[1])}`;
    }
  }
  return out;
}
