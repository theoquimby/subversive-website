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
  // the taproom: walls and roof in one stroke, the big door, smoke from the fire
  visit: [
    "M6 80C28 78 92 81 114 79",
    "M20 79C19 66 20 52 19 42C32 34 46 26 59 19C72 26 85 33 98 41C97 54 99 67 98 79",
    "M33 79C33 70 32 61 33 53C44 52 55 53 66 52C67 61 66 70 67 79",
    "M33 62C44 61 56 62 66 61M33 70C44 69 56 70 67 70",
    "M77 79C77 72 76 64 77 58C81 57 85 58 88 57C89 64 88 72 89 79",
    "M73 23C68 17 78 14 73 8C70 4 76 2 77 0",
  ],
  // the house glass, empty, with one last drop (the 404 page)
  empty: [
    "M4 86C30 84 90 87 116 85",
    "M38 12C40 46 44 66 60 66C76 66 80 46 82 12C68 7 52 7 38 12C52 17 68 17 82 12",
    "M60 66V79",
    "M44 85C52 79 68 79 76 85C68 89 52 89 44 85",
    "M60 36C56 42 56 46 60 47C64 46 64 42 60 36Z",
  ],
  // the street (Visit): the taproom, a string of lights, the heated tent
  street: [
    "M4 80C36 78 84 81 116 79",
    "M12 79C11 68 12 56 11 47C20 41 29 36 38 30C47 36 56 41 65 47C64 58 66 68 65 79",
    "M22 79C22 72 21 65 22 59C31 58 40 59 48 58C49 65 48 72 49 79M22 66C31 65 40 66 48 65M22 72C31 71 40 72 49 72",
    "M38 30C50 42 62 46 76 52M48 38v4M58 44v4M68 48v4",
    "M76 79C76 70 75 61 76 54C84 46 98 46 106 54C107 62 106 71 107 79",
    "M76 54C80 59 84 59 88 55C92 59 96 59 100 55C102 57 104 57 106 54",
    "M86 79V66C86 62 96 62 96 66V79",
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
  visit: { 5: { move: "float" } }, // smoke from the fire
  empty: { 4: { move: "drip" } }, // the last drop
  street: { 3: { move: "sway", at: [38, 30] } }, // the string of lights
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
