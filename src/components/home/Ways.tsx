// The ways onward from Home: four small pen drawings, each a link to a page. Drawn loose,
// in one weight of ink, a little wobbly on purpose (the reference Theo gave: Shel
// Silverstein's line). Each drawing inks itself in, stroke by stroke, when it scrolls into
// view (StampIn sets data-draw), and leans a little under a pointer.
import type { CSSProperties } from "react";
import { Link } from "../ui/Link";

// On a 120 × 90 sheet. Each string is one pen stroke, in the order it is drawn.
const DRAWINGS = {
  // a burger with a flag in it, and the house glass
  menu: [
    "M10 46C9 26 28 15 44 16C60 15 79 26 78 46C73 51 69 44 63 49S52 45 46 50S35 45 29 50S17 45 10 46",
    "M13 57C30 62 58 62 75 57",
    "M11 64C12 74 24 78 44 78C64 78 76 74 77 64",
    "M46 16V3l10 4l-10 4M31 28l3 2M56 29l3 2",
    "M90 26C91 44 93 56 101 56C109 56 111 44 112 26C106 23 96 23 90 26C96 29 106 29 112 26",
    "M101 56V74M92 77C96 73 106 73 110 77C106 80 96 80 92 77",
  ],
  // a ticket, a little bowed, with its lines scribbled in
  events: [
    "M12 33C40 29 78 30 108 27L110 41C103 43 104 55 111 56L112 70C80 73 44 73 15 76L13 62C20 60 19 48 12 47Z",
    "M40 33L41 38M41 43L42 48M42 53L43 58M43 63L44 69",
    "M54 43C62 41 74 42 96 40",
    "M55 52C66 50 78 51 92 49",
    "M56 61C62 60 70 60 78 59",
  ],
  // the taproom, front on (2026-11-16, drawn from the photographs): long, low, a flat roof
  // under a thin cap; two glass roll-up doors side by side under the sign; the barley mark
  // painted beside them; a plain side door, a small square window; lights along the roof
  visit: [
    "M4 80C30 78 90 81 116 79",
    "M9 79C8 64 9 50 8 36C40 35.4 80 36.2 112 35.6C111 50 113 64 112 79",
    "M7 37L6 32.6C40 31.8 82 32.6 114 31.8L113 36",
    "M30 79V51.6C36 51.2 44 51.5 50 51.2V79M53 79V51.2C59 51.5 66 51.1 73 51.4V79M40 51.4V79M63 51.3V79M30 58.4C37 58 44 58.4 50 58.1M53 58.1C60 58.4 66 58 73 58.3M30 65.2C37 64.9 44 65.3 50 65M53 65C60 65.3 66 64.9 73 65.2M30 72C37 71.7 44 72.1 50 71.8M53 71.8C60 72.1 66 71.7 73 72",
    "M33 46.6C38 46 44 46.4 49 46.1M51.5 44.8V48M49.9 46.4H53.1M54.5 46.1C60 45.8 66 46.4 70 46",
    "M81 45L83.6 48.4L81 51.8L78.4 48.4ZM77.6 54.4L81 57.8L84.4 54.4M77.6 60.8L81 64.2L84.4 60.8M77.6 67.2L81 70.6L84.4 67.2M77.6 73.6L81 77L84.4 73.6",
    "M15 79V58C18 57.7 21 57.9 24 57.7V79M21.4 68.6v1.2",
    "M93 48C96.5 47.7 100.5 48 104 47.8C104.2 51 104 54.4 104.2 58C100.5 58.2 96.5 57.9 93 58.1C93.2 54.6 93 51.2 93 48ZM98.6 48V58",
    "M8 37.4C16 41.6 26 41.6 34 37.4C42 41.6 52 41.6 60 37.4C68 41.6 78 41.6 86 37.4C94 41.6 104 41.6 112 37.4M21 40.9v1.4M47 40.9v1.4M73 40.9v1.4M99 40.9v1.4",
  ],
  // the house glass, empty, with one last drop (the 404 page)
  empty: [
    "M4 86C30 84 90 87 116 85",
    "M38 12C40 46 44 66 60 66C76 66 80 46 82 12C68 7 52 7 38 12C52 17 68 17 82 12",
    "M60 66V79",
    "M44 85C52 79 68 79 76 85C68 89 52 89 44 85",
    "M60 36C56 42 56 46 60 47C64 46 64 42 60 36Z",
  ],
  // the street (Visit): the same taproom from the corner of the yard, its short side with
  // the side door and window, the long front with the doors and the barley mark; the lights
  // run along the roof and out to an umbrella over a picnic table
  street: [
    "M4 80C36 78 84 81 116 79",
    "M8 79C7 67 8 55 7.6 43.4C15 41 22 38.8 30 36.6C50 38 70 40 88 42C87 54 89 67 88 79M30 36.6C29.4 50 30.6 66 30 80",
    "M6.6 44.6L6 41.2L30 34L90 39.6L89.4 43",
    "M40 79.6V53.8C45 53.6 50 53.9 54 54V79.4M57 79.3V54.2C62 54.4 67 54.6 71 54.9V79.2M47 53.8V79.5M64 54.5V79.3M40 60C45 59.9 50 60.1 54 60.2M57 60.3C62 60.5 67 60.6 71 60.8M40 66.4C45 66.3 50 66.5 54 66.5M57 66.6C62 66.7 67 66.8 71 67M40 72.8C45 72.8 50 72.9 54 72.9M57 73C62 73 67 73.1 71 73.2",
    "M41 49C45 48.8 49 49.1 52.5 49.2M55 47.6V50.8M53.4 49.3H56.6M58.5 49.3C62 49.4 66 49.7 69 49.9M79.5 49L81.8 52L79.5 55L77.2 52ZM76.6 57L79.5 60L82.4 57M76.6 62.6L79.5 65.6L82.4 62.6M76.6 68.2L79.5 71.2L82.4 68.2M76.6 73.8L79.5 76.8L82.4 73.8",
    "M13 79V60.4C15.4 60 17.6 59.8 20 59.4V79.2M18 69.6v1.2M23 48.6L27.6 47.6L27.8 53.6L23.2 54.4Z",
    "M8 44.8C13 48.4 21 46.6 30 38.6C38 44.4 48 45 58 41.4C66 46.4 78 46.8 88 43.6C93 47.6 99 47.4 105 44.6M17.5 46.6v1.3M43.3 44v1.3M72.3 46.1v1.3M96.1 47.2v1.3",
    "M93 50C98 43.4 112 43.4 117 50C115 51.4 112.6 51.4 111 50C109 51.4 107 51.4 105 50C103 51.4 101 51.4 99 50C97 51.4 94.6 51.4 93 50M99 50C100 47.6 102 45.6 105 45M111 50C110 47.6 108 45.6 105 45M105 42.6V45",
    "M105 50V79.4M94 66.2C101 65.8 109 66.2 116 65.8M97.4 66.4L95 79.4M112.8 66.2L115.2 79.4M91.6 72.4C94 72.2 97 72.4 99 72.3M111 72.3C113 72.4 116 72.2 118 72.4",
  ],
  // the barn it began in (About): a gambrel roof, the crossed door, a silo, two birds
  barn: [
    "M6 80C36 78 84 81 114 79",
    "M22 79C21 70 22 60 21 51C24 45 27 39 30 34C35 30 40 27 44 24C49 27 54 31 58 34C61 39 64 45 67 51C66 60 68 70 67 79",
    "M35 79C35 72 34 65 35 59C41 58 47 59 53 58C54 65 53 72 54 79M35 59C41 66 47 72 54 79M53 58C47 65 41 72 35 79",
    "M40 42C43 41 46 41 48 42",
    "M76 79C76 68 75 56 76 46C76 37 92 37 92 46C93 57 92 68 93 79M76 52C82 51 87 52 92 51M76 62C82 61 87 62 93 61",
    "M94 20C97 16 100 16 102 20C104 16 107 16 110 20M84 12C86 9 88 9 90 12C92 9 94 9 96 12",
  ],
  // an ear of barley: paired kernels like the brand's mark, long awns
  beer: [
    "M60 88C60 70 59 52 61 30",
    "M61 62C54 58 50 52 50 46M61 62C68 58 72 52 72 46",
    "M61 50C54 46 51 40 51 34M61 50C68 46 71 40 71 34",
    "M61 38C55 34 52 28 53 22M61 38C67 34 70 28 69 22",
    "M53 22C50 14 48 8 47 2M61 30C61 18 62 10 63 1M69 22C72 14 75 8 77 3",
    "M60 78C52 74 46 74 40 78",
  ],
} as const;

export type WayKey = keyof typeof DRAWINGS;

// One living part in a drawing (2026-11-15): which stroke moves, how, and about which
// point. The loops are in graphics.css (.mv); they are small and stop with reduced motion.
const MOVES: Partial<Record<WayKey, Record<number, { move: string; at?: [number, number] }>>> = {
  visit: { 8: { move: "sway", at: [60, 37] } }, // the lights along the roof
  empty: { 4: { move: "drip" } }, // the last drop
  street: { 6: { move: "sway", at: [56, 41] } }, // the lights, roof to umbrella
  barn: { 5: { move: "bob" } }, // the two birds
};
// a whole drawing that moves: the barley in a breeze, the ticket rocking a little
const WHOLE: Partial<Record<WayKey, string>> = { beer: "pen--sway", events: "pen--rock" };

export function Drawing({ name, className }: { name: WayKey; className?: string }) {
  const moves = MOVES[name] ?? {};
  return (
    <svg
      viewBox="0 0 120 90"
      className={["pen", WHOLE[name] ?? "", className ?? ""].filter(Boolean).join(" ")}
      data-draw=""
      aria-hidden="true"
      focusable="false"
    >
      {DRAWINGS[name].map((d, i) => {
        const m = moves[i];
        const path = <path key="line" d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />;
        return m ? (
          <g
            key={d}
            className={`mv mv--${m.move}`}
            style={m.at ? { transformOrigin: `${m.at[0]}px ${m.at[1]}px` } : undefined}
          >
            {path}
          </g>
        ) : (
          <g key={d}>{path}</g>
        );
      })}
    </svg>
  );
}

export function Ways({ items }: { items: { key: WayKey; href: string; label: string }[] }) {
  return (
    <ul className="ways">
      {items.map((it) => (
        <li key={it.key}>
          <Link href={it.href} className="ways__link">
            <Drawing name={it.key} className="ways__art" />
            <span className="ways__name">{it.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
