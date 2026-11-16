// A few small drawings for the holiday that is near (src/lib/season/holidays.ts): two or
// three stand just above the footer's ground line, and on wide screens two more sit in the
// side margins. They ink themselves in like the other pen drawings (StampIn sets
// data-draw) and each has at most one small stepped loop, still with reduced motion.
// Decorative: hidden from assistive tech, never in the way of a pointer, not printed.
// Styles: fx-season.css.
import type { CSSProperties } from "react";
import { currentSeason } from "@/lib/season/current";
import { ITEM_ART, scatterFor } from "./season-art";

export function SeasonScatter() {
  const themes = currentSeason();
  const items = scatterFor(themes);
  if (items.length === 0) return null;
  return (
    <div className={`season-scatter season-scatter--${themes[0]}`} aria-hidden="true">
      {items.map((name, slot) => {
        const art = ITEM_ART[name];
        return (
          <svg
            // biome-ignore lint/suspicious/noArrayIndexKey: the slot is the item's place
            key={slot}
            viewBox="0 0 48 48"
            className={`pen season-item season-item--${slot + 1}`}
            data-draw=""
            focusable="false"
          >
            <g className={art.loop ? `season-loop season-loop--${art.loop}` : undefined}>
              {art.parts.map((p, i) => (
                <path
                  key={p.d}
                  d={p.d}
                  pathLength={1}
                  className={`season-fill--${p.fill ?? "none"}${p.ember ? " season-ink--ember" : ""}`}
                  style={{ "--i": i } as CSSProperties}
                />
              ))}
            </g>
          </svg>
        );
      })}
    </div>
  );
}
