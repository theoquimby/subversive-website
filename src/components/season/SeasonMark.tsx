// The logo's holiday touch: a tiny hat or object on the barley mark, a few weeks before a
// holiday (src/lib/season/holidays.ts). An overlay in the mark's own units, laid on the
// mark: it takes no room, so the header does not move, and it is hidden from assistive
// tech, so the logo link's name stays the brewery's name. Styles: fx-season.css.
import { currentSeason } from "@/lib/season/current";
import { type Part, TOUCHES } from "./season-art";

export function SeasonParts({ parts }: { parts: readonly Part[] }) {
  return parts.map((p) => (
    <path
      key={p.d}
      d={p.d}
      className={`season-fill--${p.fill ?? "bg"}${p.ember ? " season-ink--ember" : ""}`}
    />
  ));
}

export function SeasonMark() {
  const theme = currentSeason()[0];
  if (!theme) return null;
  const t = TOUCHES[theme];
  return (
    <svg
      viewBox="-30 -50 120 100"
      className={`season-mark season-mark--${theme}`}
      aria-hidden="true"
      focusable="false"
    >
      <g transform={`translate(${t.at[0]} ${t.at[1]}) rotate(${t.turn}) scale(${t.scale})`}>
        <SeasonParts parts={t.parts} />
      </g>
    </svg>
  );
}
