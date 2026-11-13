// Seal (spec §3.1): a circular ink stamp with the barley mark at its centre and the
// name, town and year on a text path. Rotates one turn per 40 s when used as a decorative
// stamp; static in the favicon and OG images. Never says "Malting" (spec O10).
import { BARLEY_VIEWBOX, KERNELS } from "./BarleyMark";

const RING = "SUBVERSIVE · CATSKILL NY · EST. 2018 · ";
const R_TEXT = 76;
const CIRC = 2 * Math.PI * R_TEXT;

export function Seal({ spin = false, className }: { spin?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={["seal", spin ? "seal--spin" : "", className ?? ""].filter(Boolean).join(" ")}
      role="img"
      focusable="false"
    >
      <title>Subversive, Catskill NY, established 2018</title>
      <defs>
        <path id="seal-ring" d={`M100 ${100 - R_TEXT}a${R_TEXT} ${R_TEXT} 0 1 1 -0.01 0`} />
      </defs>
      <circle cx="100" cy="100" r="98" className="seal__disc" />
      <circle cx="100" cy="100" r="61" className="seal__ring" />
      <g className="seal__type">
        <text className="seal__text">
          <textPath href="#seal-ring" textLength={CIRC.toFixed(1)} lengthAdjust="spacing">
            {RING}
          </textPath>
        </text>
      </g>
      <svg x="77" y="54" width="46" height="92" viewBox={BARLEY_VIEWBOX} className="seal__mark">
        {KERNELS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </svg>
  );
}
