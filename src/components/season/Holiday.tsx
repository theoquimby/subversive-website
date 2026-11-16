// The holiday touches, a few weeks before each holiday (src/lib/season/holidays.ts):
//   HolidaySlash  the wordmark's slash becomes the holiday's object (Header).
//   HolidayScene  a small scene standing on the footer's ground line (Footer), on the
//                 line's first crest on a phone and on its last crest from 48rem.
// Decorative only: inside SVGs already hidden from assistive tech, no pointer caught.
// Styles: fx-season.css. Drawings: season-draw.tsx.
import { currentSeason } from "@/lib/season/current";
import { SLASH_POINTS } from "../graphics/Wordmark";
import { groundTilt, groundY } from "../layout/ground";
import { SCENES, SlashArt } from "./season-draw";

/** the slash for the nearest holiday, or undefined for the plain one */
export function HolidaySlash() {
  const theme = currentSeason()[0];
  return theme ? <SlashArt theme={theme} outline={SLASH_POINTS} /> : undefined;
}

// where the scene stands, in the ground SVG's units (1200 × 60): the crests of the line
const SPOTS = [
  { at: 182, scale: 1.3, className: "season-scene season-scene--phone" },
  { at: 958, scale: 1, className: "season-scene season-scene--wide" },
] as const;

export function HolidayScene() {
  const theme = currentSeason()[0];
  if (!theme) return null;
  const pieces = SCENES[theme];
  return SPOTS.map((spot) => (
    <g key={spot.className} className={`${spot.className} season-scene--${theme}`}>
      {pieces.map((p, i) => {
        const x = spot.at + p.dx * spot.scale;
        const y = groundY(x) - (p.lift ?? 0) * spot.scale;
        // a thing on the ground leans with the ground under it; a thing in the air doesn't
        const turn = (p.lift ? 0 : groundTilt(x)) + (p.turn ?? 0);
        return (
          <g
            // biome-ignore lint/suspicious/noArrayIndexKey: a scene's pieces never reorder
            key={i}
            transform={`translate(${x.toFixed(1)} ${(y + 0.6).toFixed(1)}) rotate(${turn.toFixed(1)}) scale(${spot.scale})`}
          >
            {p.art}
          </g>
        );
      })}
    </g>
  ));
}
