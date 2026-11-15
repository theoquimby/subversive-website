// The ways onward from Home: four small pen drawings, each a link to a page. Drawn loose,
// in one weight of ink, a little wobbly on purpose (the reference Theo gave: Shel
// Silverstein's line). Each drawing inks itself in, stroke by stroke, when it scrolls into
// view (StampIn sets data-draw), and leans a little under a pointer.
import type { CSSProperties } from "react";
import { Link } from "../ui/Link";

// On a 120 × 90 sheet. Each string is one pen stroke, in the order it is drawn.
const DRAWINGS = {
  // a burger with a flag in it, and a pint
  menu: [
    "M11 45C9 28 25 16 43 17C61 16 76 29 74 45",
    "M9 49C14 53 19 45 24 50S33 46 38 51S47 46 52 51S61 46 66 50S73 47 78 49",
    "M12 57C30 61 58 61 76 56",
    "M11 63C12 73 22 77 44 77C66 77 75 72 77 62",
    "M30 28l3 2M43 24l3 1M56 29l3 2M38 34l3 1",
    "M46 17V4l11 4l-11 4",
    "M88 31L92 77H108L112 30",
    "M86 31C87 24 93 27 96 23C99 19 105 21 106 25C111 23 115 27 113 31Z",
  ],
  // a ticket with a star on it
  events: [
    "M13 29H107V42C100 43 100 57 107 58V71H13V58C20 57 20 43 13 42Z",
    "M39 33V37M39 42V46M39 51V55M39 60V64",
    "M73 37l3.4 7.4l8 .9l-6 5.4l1.7 7.9l-7.1 -4l-7.1 4l1.7 -7.9l-6 -5.4l8 -.9z",
    "M21 44H31M21 50H31M21 56H28",
  ],
  // the taproom: a roof, the garage door, a signpost, smoke from the fire
  visit: [
    "M7 79C30 77 90 80 113 78",
    "M19 78V41L58 18L97 40V78",
    "M33 78V52H66V78M33 61H66M33 69H66",
    "M76 78V57H88V78M85 68h.5",
    "M72 22C68 16 77 14 73 8C71 5 75 3 76 1",
    "M106 78V56M100 56h12l4 4l-4 4h-12z",
  ],
  // a stalk of barley, leaning
  beer: [
    "M57 86C58 62 56 44 65 22",
    "M60 62C50 61 45 53 47 46C55 47 60 54 60 62Z",
    "M60 52C70 50 75 42 73 35C65 37 60 44 60 52Z",
    "M61 42C51 40 47 32 50 25C57 27 61 34 61 42Z",
    "M63 32C73 29 77 21 75 14C67 17 63 24 63 32Z",
    "M65 22L71 5M65 22L59 7M65 22L66 3",
    "M57 86C50 80 44 80 38 84M58 76C64 72 70 73 75 77",
  ],
} as const;

export type WayKey = keyof typeof DRAWINGS;

export function Drawing({ name, className }: { name: WayKey; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 90"
      className={className ? `pen ${className}` : "pen"}
      data-draw=""
      aria-hidden="true"
      focusable="false"
    >
      {DRAWINGS[name].map((d, i) => (
        <path key={d} d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />
      ))}
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
