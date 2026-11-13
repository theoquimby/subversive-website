// Chevron band (spec §3.3): the barley kernel repeated as a lattice, 30 px tall — the
// herringbone of kernels painted on their tent wall, laid on its side. Kernel geometry is
// the barley mark's (22 wide, 25.5 tall sides, 12.5 slant), scaled so a kernel spans half
// the band: one kernel above the stem, the next below, every 34.8 px.
const S = 15 / 22; // kernel width → half the band
const SIDE = 25.5 * S;
const SLANT = 12.5 * S;
const PERIOD = SIDE * 2;
const r = (n: number) => Math.round(n * 100) / 100;

// Upper kernel: inner edge on the stem (y 15), outer edge at the top, leaning back by SLANT.
const UPPER = [
  [0, 15],
  [-SLANT, 1],
  [SIDE - SLANT, 1],
  [SIDE, 15],
];
const LOWER = UPPER.map(([x = 0, y = 0]) => [x + SIDE, 30 - y]);
const toPath = (pts: number[][]) => `M${pts.map(([x = 0, y = 0]) => `${r(x)} ${r(y)}`).join("L")}Z`;
// Draw each kernel at its own position and one period to the right, so the tile wraps.
const D = [UPPER, LOWER, UPPER.map(([x = 0, y = 0]) => [x + PERIOD, y])].map(toPath).join("");

export function Chevrons({ tone = "fg", className }: { tone?: "fg" | "accent" | "bg"; className?: string }) {
  const id = `chevrons-${tone}`;
  return (
    <svg
      className={["chevrons", className ?? ""].filter(Boolean).join(" ")}
      data-tone={tone}
      aria-hidden="true"
      focusable="false"
      height="30"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id={id} width={r(PERIOD)} height="30" patternUnits="userSpaceOnUse">
          <path d={D} />
        </pattern>
      </defs>
      <rect width="100%" height="30" fill={`url(#${id})`} />
    </svg>
  );
}
