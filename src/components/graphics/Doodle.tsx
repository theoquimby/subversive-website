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
  // ---- From the can labels (2026-11-18). Theo: the label art is "a whole huge source" for
  // the site, kept in "the hand drawn shel silverstein line style". A label's own art, in
  // full colour, stays on its can; here each label's motif is redrawn in the pen. Line
  // only, one weight, no fills. ----
  // Hoppy American Lager: the hop cone off its label, hanging from its stem, and an ear
  // of barley beside it; the cone swings a little
  hop: {
    box: "0 0 120 90",
    parts: [
      {
        d: "M49 15.1C47.4 10.3 49.8 5 55.5 2.2M43.4 26.9C41.6 20.1 45 15.6 49.5 15.1C54 14.5 58.4 18 58.3 25.1",
        move: "sway",
        at: [49, 15],
      },
      {
        d: "M37.4 27.6C38.2 33.7 44.1 36.8 45.2 37.3C47.1 36.4 52.1 32.5 51.3 25.9C51.7 33.1 57.5 35.1 59.8 36.6C60.5 34.8 65.5 30.8 64.7 24.3M32.5 38.3C33.3 45 39 48.4 40.1 49C42 48 46.7 43.8 45.9 36.7C46.8 44.4 52.4 46.7 54.7 48.3C55.4 46.4 60.1 42.2 59.3 35C60.1 41.7 65.8 45.1 66.9 45.7C68.8 44.7 73.5 40.5 72.7 33.4",
        move: "sway",
        at: [49, 15],
      },
      {
        d: "M34.5 49.1C35.4 55.8 40.8 59.2 41.9 59.8C43.8 58.9 48.3 54.7 47.4 47.6C48.4 55.3 53.7 57.7 56 59.2C56.7 57.3 61.2 53.1 60.4 46C61.2 52.6 66.6 56.1 67.7 56.7C69.6 55.7 74.1 51.5 73.3 44.4M42.3 59.3C43.2 65.9 48.6 69.4 49.7 69.9C51.6 69 56.1 64.8 55.2 57.7C56.2 65.4 61.5 67.8 63.8 69.3C64.5 67.4 69 63.2 68.1 56.1M50.1 69.4C51.2 77.7 56.6 81.3 58.3 82.5C59.6 80.9 64.1 76.1 63 67.8",
        move: "sway",
        at: [49, 15],
      },
      {
        d: "M37.4 27.6C34.8 31 32.8 34.2 32.5 38.3M64.7 24.3C68.6 26.8 71.3 29.5 72.6 33.4M32.5 38.3C32.6 42.3 33.3 46.3 34.5 49.1M72.6 33.4C73.5 37.3 73.8 41.3 73.3 44.4",
        move: "sway",
        at: [49, 15],
      },
      { d: "M85 84C88.2 68.9 90.6 53.5 96.2 35.4" },
      { d: "M90.5 62.3C85.3 57.7 83 51.9 84.1 46.9M90.5 62.3C97.1 60.2 101.5 55.9 102.6 50.8" },
      { d: "M92.6 52.2C87.5 47.6 86 42 87.1 37M92.6 52.2C99.2 50.1 102.8 45.6 103.9 40.5" },
      {
        d: "M94.8 42.1C90.4 37.7 89 32.1 90.9 27.2M94.8 42.1C100.5 39.8 104.1 35.3 104.4 30.1",
      },
      {
        d: "M90.9 27.2C89.8 20 89.2 14.6 89.4 9.3M96.2 35.4C98.4 25.3 100.6 18.7 103.1 11.4M104.4 30.1C108.3 23.9 111.9 19.4 114.5 15.5",
      },
    ] as Part[],
  },
  // Camp Comet: the comet coming down on the tent, its tail straight up behind it, a few
  // stars; one more star comes and goes
  comet: {
    box: "0 0 120 90",
    parts: [
      { d: GROUND },
      { d: "M22 79C26 68 30 59 35 51C52 50 68 51 85 50C90 59 95 69 99 79" },
      { d: "M35 51C43 46 52 41 60 36C68 41 77 46 85 50" },
      { d: "M60 37C55 51 50 65 46 79M60 37C65 51 70 65 75 79" },
      { d: "M51 31C51 19 69 19 69 31C69 36 65 40 60 40C55 40 51 36 51 31Z" },
      { d: "M53 19V9M60 16V2M67 19V7" },
      { d: "M20 20v6M17 23h6M98 14v6M95 17h6M36 8v.5M88 34v.5M105 40v.5M12 44v.5M82 6v.5" },
      {
        d: "M27 34v5M24.5 36.5h5",
        move: "twinkle",
      },
    ] as Part[],
  },
  // ¡Chinga La Migra!: one of its monarchs, on the wing
  monarch: {
    box: "0 0 120 90",
    parts: [
      {
        d: "M56.1 30.5C55.6 36.8 60 54.2 64.1 62.5C63.9 53.3 59.5 35.8 56.1 30.5Z",
        move: "bob",
      },
      {
        d: "M55.6 30.6C52.7 25.1 48.9 22 43.5 21.3M56.6 30.4C56.6 24.2 58.6 19.6 62.9 16.4",
        move: "bob",
      },
      {
        d: "M56.9 37.5C42.6 25.6 22.9 21.2 7.4 29.2C8.1 40.4 20 50.8 34.8 52.3C45.2 52.8 53.4 48.7 58.5 44.3",
        move: "bob",
      },
      {
        d: "M58.8 37C65.8 19.8 81.1 6.7 98.6 6.5C103.2 16.7 97.6 31.5 85.2 39.7C76.3 45 67 45.3 60.5 43.8",
        move: "bob",
      },
      {
        d: "M59 46.2C47.6 50.1 37.2 57.9 35.7 68.5C38.4 79.2 52 79.9 58 71.2C61 66.4 61.4 60.1 61.9 55.8",
        move: "bob",
      },
      {
        d: "M61 45.8C72.9 43.8 85.7 45.8 92 54.5C94.7 65.2 83 72.2 73.6 67.4C68.7 64.4 65.3 59.1 62.9 55.6",
        move: "bob",
      },
      {
        d: "M55.2 39C42.1 36 28 33.4 14.4 32.6M56.1 42.8C47.1 44.1 38.4 46.2 29.7 48.4M14.4 32.6C17.1 39.2 23.6 44.8 32.6 47.7",
        move: "bob",
      },
      {
        d: "M61 37.5C71.2 28.8 82.3 19.8 94 12.8M61.9 41.4C70.4 38.2 79.2 36.1 87.9 33.9M94 12.8C94.7 19.8 91.5 27.8 85 34.6",
        move: "bob",
      },
      {
        d: "M58.1 50.6C51.3 56.4 45.9 63.9 43.7 71.7M63.9 49.2C72.6 51.1 80.9 55.2 86.4 61.1",
        move: "bob",
      },
    ] as Part[],
  },
  // Cheap Dills: the pickle out for a stroll, a hand on its hip, raising its beer
  pickle: {
    box: "0 0 120 90",
    parts: [
      { d: "M20 82C44 80 76 83 100 81" },
      {
        d: "M48 23C48 11 58 5 66 8C74 11 77 20 76 32C76 44 75 54 68 60C60 65 50 62 47 52C45 42 47 32 48 23Z",
      },
      { d: "M56 27v4.5M66 27v4.5" },
      { d: "M53 38C57 44 66 44 70 37" },
      { d: "M55 13l1 3M69 16l-1 3M51 51l1 3M70 49l-1 3M61 53v3" },
      { d: "M47 39C40 39 36 45 39 49C41 52 45 51 47 50" },
      { d: "M53 62C52 68 49 73 45 79L38 79" },
      { d: "M65 62C66 68 69 72 73 77L80 75" },
      {
        d: "M76 38C82 39 86 36 88 31M84 15C84.5 21 85.5 26 86.5 31C89 31.5 92 31.5 94.5 31C95.5 26 96.5 21 97 15ZM83.5 15C82 10 87 8 89.5 10.5C91.5 7 98 9 97.5 15",
        move: "clink",
        at: [76, 38],
      },
    ] as Part[],
  },
  // Golden Lime: the calamansi branch, two fruits and their leaves
  calamansi: {
    box: "0 0 120 90",
    parts: [
      { d: "M106 5C92 7 78 11 66 18C58 23 52 28 47 34" },
      { d: "M47 34C45 36 44 38 43 40M80 12C81 16 81.5 19 82 22" },
      { d: "M43 40C32 39 24 47 25 57C26 67 35 74 45 73C55 72 62 63 61 54C60 46 52 40 43 40Z" },
      { d: "M82 22C73 22 66 29 67 38C68 47 75 53 84 52C93 51 99 44 98 36C97 28 90 22 82 22Z" },
      { d: "M38.5 43.5L43 40L47.5 43M43 40V45M78 25.5L82 22L86.5 25M82 22V27" },
      { d: "M47 34C40 22 26 17 12 22C20 33 34 38 47 34M47 34C36 30 25 26 15 23" },
      { d: "M66 18C60 9 50 4 38 5C44 14 54 19 66 18" },
      { d: "M92 8C102 12 110 20 113 31C102 29 95 20 92 8M92 8C98 15 105 23 112 30" },
      { d: "M32 60v.6M42 66v.6M52 57v.6M36 51v.6M76 42v.6M87 45v.6M90 34v.6" },
    ] as Part[],
  },
  // the way on to the next stop: a wandering line and an arrowhead
  trail: {
    box: "0 0 120 60",
    parts: [{ d: "M24 4C12 22 58 24 60 36S92 42 98 54" }, { d: "M88 50L98.5 54.5L100 43.5" }] as Part[],
  },
} as const;

export type DoodleName = keyof typeof DOODLES;

export function Doodle({
  name,
  className,
  drawn = false,
}: {
  name: DoodleName;
  className?: string;
  /** already inked, its loop running: for a drawing that arrives after the page has been
   *  looked over for things to draw in (one inside a sheet) */
  drawn?: boolean;
}) {
  const { box, parts } = DOODLES[name];
  return (
    <svg
      viewBox={box}
      className={className ? `pen doodle ${className}` : "pen doodle"}
      data-draw={drawn ? "in" : ""}
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
