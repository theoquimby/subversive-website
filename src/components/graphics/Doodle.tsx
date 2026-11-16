// Small pen drawings with one living part each (2026-11-15): a dog whose tail wags, a
// tent whose flag flutters, a car that putters. Drawn in the same hand as the drawings in
// home/Ways.tsx (same `.pen` strokes, same draw-on when they scroll into view); a part
// that moves sits in its own group so the draw-on and the loop do not fight.
// The loops are a few degrees or a couple of pixels, never more, and stop with reduced
// motion. Styles: graphics.css (.mv). Decorative, hidden from assistive tech.
import type { CSSProperties } from "react";

export type Move =
  | "wag"
  | "flutter"
  | "clink"
  | "twinkle"
  | "putter"
  | "puff"
  | "bob"
  | "bounce"
  | "float"
  | "sway"
  | "drip";

interface Part {
  d: string;
  move?: Move;
  /** the point a turning part turns about, in the drawing's own units */
  at?: [number, number];
}

const GROUND = "M6 80C36 78 84 81 114 79";
const wheel = (x: number) =>
  `M${x - 9} 69a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M${x - 1.5} 69a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0`;

export const DOODLES = {
  // seating: a picnic table and two of the house glasses; one tips to the other
  table: {
    box: "0 0 120 90",
    parts: [
      { d: GROUND },
      { d: "M22 51C46 50 74 52 98 51" },
      { d: "M34 52L26 79M86 52L94 79M30 67C50 66 70 67 90 67" },
      { d: "M10 67C17 66 23 67 30 66M90 66C97 67 103 66 110 67" },
      {
        d: "M44 28C44.6 37 46.4 42 49 42C51.6 42 53.4 37 54 28C51 26.6 47 26.6 44 28ZM49 42V50M45.5 50H52.5",
      },
      {
        d: "M64 28C64.6 37 66.4 42 69 42C71.6 42 73.4 37 74 28C71 26.6 67 26.6 64 28ZM69 42V50M65.5 50H72.5",
        move: "clink",
        at: [69, 50],
      },
      { d: "M59 21V15M55 23L51.5 19.5M63 23L66.5 19.5", move: "twinkle" },
    ] as Part[],
  },
  // the tent: scalloped edge, a door, a little flag in the wind
  tent: {
    box: "0 0 120 90",
    parts: [
      { d: GROUND },
      { d: "M21 79C21 68 20 58 21 50C40 30 80 30 99 50C100 60 99 70 100 79" },
      {
        d: "M21 50C27 56 33 56 39 51C45 56 51 56 57 51C63 56 69 56 75 51C81 56 87 56 93 51C95 53 97 52 99 50",
      },
      { d: "M52 79V65C52 58 68 58 68 65V79" },
      { d: "M60 35.5V20" },
      { d: "M60 20C65 18 68 23 74 21L73 28C68 30 65 26 60 28", move: "flutter", at: [60, 24] },
    ] as Part[],
  },
  // parking: a small car that has just pulled in, still puttering
  car: {
    box: "0 0 120 90",
    parts: [
      { d: GROUND },
      {
        d: "M18 69C17 61 20 56 30 55L40 41C52 38 68 38 78 42L88 55C98 56 104 60 103 69",
        move: "putter",
      },
      {
        d: "M44 54L49 44C54 42.6 58 42.4 60 42.4V54ZM65 54V42.4C70 42.6 74 43.4 76 45L82 54Z",
        move: "putter",
      },
      { d: "M18 69H28M46 69H74M92 69H103", move: "putter" },
      { d: wheel(37) },
      { d: wheel(83) },
      { d: "M11 62C7 62 7 56 11 57C11 53 17 54 16 58", move: "puff" },
    ] as Part[],
  },
  // dogs: a long one, with a tail that will not keep still
  dog: {
    box: "0 0 120 90",
    parts: [
      { d: GROUND },
      { d: "M31 53C51 50 75 50 93 53C97 59 96 63 93 65C73 67 51 67 31 65" },
      { d: "M31 53C27 46 18 46 14 51C10 52 8 56 12 59C16 63 24 64 31 65" },
      { d: "M23 47C20 53 21 59 25.5 59" },
      { d: "M16.4 52.4v.8M9.6 55.6v.5" },
      { d: "M37 66V77M45 66V77M81 66V77M89 66V77" },
      { d: "M94 55C101 51 105 45 104 38", move: "wag", at: [94, 55] },
    ] as Part[],
  },
  // gift cards: a card with a bow on it
  gift: {
    box: "0 0 120 90",
    parts: [
      { d: "M21 35C46 33 76 34 99 35C100 47 100 59 99 71C74 72 46 72 21 71C20 59 20 47 21 35Z" },
      { d: "M47 35V71" },
      { d: "M59 49C68 48 78 49 89 48M59 58C66 57 72 58 80 57" },
      {
        d: "M47 35C41 24 32 26 36 32.5C38.5 36 43.5 36 47 35C50.5 36 55.5 36 58 32.5C62 26 53 24 47 35",
        move: "bob",
      },
    ] as Part[],
  },
  // the way on to the next stop: a wandering line and an arrowhead
  trail: {
    box: "0 0 120 60",
    parts: [{ d: "M24 4C12 22 58 24 60 36S92 42 98 54" }, { d: "M88 50L98.5 54.5L100 43.5" }] as Part[],
  },
} as const;

export type DoodleName = keyof typeof DOODLES;

export function Doodle({ name, className }: { name: DoodleName; className?: string }) {
  const { box, parts } = DOODLES[name];
  return (
    <svg
      viewBox={box}
      className={className ? `pen doodle ${className}` : "pen doodle"}
      data-draw=""
      aria-hidden="true"
      focusable="false"
    >
      {parts.map((p, i) => {
        const path = <path key="line" d={p.d} pathLength={1} style={{ "--i": i } as CSSProperties} />;
        return p.move ? (
          <g
            key={p.d}
            className={`mv mv--${p.move}`}
            style={p.at ? { transformOrigin: `${p.at[0]}px ${p.at[1]}px` } : undefined}
          >
            {path}
          </g>
        ) : (
          <g key={p.d}>{path}</g>
        );
      })}
    </svg>
  );
}
