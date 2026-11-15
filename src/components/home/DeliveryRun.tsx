// "Where it comes from" as a delivery run (redesign 2026-11-14). The ink line from the
// first screen carries on as a route: one stop for each source in site.json, each a small
// drawing in the same stroke with what it is, who makes it and where, and the route ends
// at the taproom, where the line becomes a glass again. On a phone the line runs down the
// left; on a wide screen it runs across. It draws as the section scrolls into view and
// each stop inks in as the line reaches it (CSS only; static without scroll timelines or
// with reduced motion). Every word comes from site.json.
import type { CSSProperties } from "react";
import type { Site } from "@/lib/site/schema";
import { BARLEY_VIEWBOX, KERNELS } from "../graphics/BarleyMark";

// One small drawing per kind of thing, on a 48 × 48 grid, in the hero's hand.
const DOODLES: Record<string, string[]> = {
  beef: [
    "M10 15C6 11 6 6 9 5C10 10 14 13 19 14C22 12 26 12 29 14C34 13 38 10 39 5C42 6 42 11 38 15C40 19 39 25 36 30C34 36 30 41 24 41C18 41 14 36 12 30C9 25 8 19 10 15Z",
    "M20 33C20 35 22 35 22 33M26 33C26 35 28 35 28 33",
  ],
  buns: [
    "M8 27C8 15 16 9 24 9C32 9 40 15 40 27Z",
    "M8 32H40C40 37 37 39 34 39H14C11 39 8 37 8 32Z",
    "M19 16L21 17M27 15L29 16M23 21L25 22",
  ],
  cider: [
    "M24 17C20 11 9 12 9 24C9 34 17 41 24 38C31 41 39 34 39 24C39 12 28 11 24 17Z",
    "M24 17C24 12 25 9 29 6M27 9C31 7 34 9 34 12C31 13 28 12 27 9Z",
  ],
  wine: [
    "M19 21A4.5 4.5 0 1 0 18.9 21ZM29 21A4.5 4.5 0 1 0 28.9 21ZM14 29A4.5 4.5 0 1 0 13.9 29ZM24 29A4.5 4.5 0 1 0 23.9 29ZM34 29A4.5 4.5 0 1 0 33.9 29ZM19 37A4.5 4.5 0 1 0 18.9 37ZM29 37A4.5 4.5 0 1 0 28.9 37Z",
    "M24 12C24 8 26 6 30 5",
  ],
  spirits: ["M21 5H27V13C27 17 33 19 33 25V41H15V25C15 19 21 17 21 13Z", "M15 29H33"],
  taproom: ["M14 7C14 23 17 31 24 31C31 31 34 23 34 7Z", "M24 31V41M16 42H32", "M15 13H33"],
};

function Doodle({ kind }: { kind: string }) {
  if (kind === "grain") {
    return (
      <svg
        viewBox={BARLEY_VIEWBOX}
        className="run__doodle run__doodle--mark"
        aria-hidden="true"
        focusable="false"
      >
        {KERNELS.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }
  const paths = DOODLES[kind];
  return (
    <svg viewBox="0 0 48 48" className="run__doodle" aria-hidden="true" focusable="false">
      {paths ? paths.map((d) => <path key={d} d={d} />) : <circle cx="24" cy="24" r="6" />}
    </svg>
  );
}

export function DeliveryRun({ site }: { site: Site }) {
  const stops = [
    ...site.sourcing.map((s) => ({ kind: s.what.toLowerCase(), what: s.what, who: s.who, where: s.where })),
    // the end of the run: the taproom itself
    {
      kind: "taproom",
      what: `${site.address.city}, ${site.address.state}`,
      who: site.name,
      where: site.address.street,
    },
  ];
  return (
    <ol className="run" style={{ "--stops": stops.length } as CSSProperties}>
      {stops.map((s, i) => (
        <li key={s.what} className="run__stop" data-kind={s.kind} style={{ "--i": i } as CSSProperties}>
          <span className="run__pin">
            <Doodle kind={s.kind} />
          </span>
          <span className="run__text">
            <span className="run__what">{s.what}</span>
            <span className="run__who">{s.who}</span>
            <span className="run__where">{s.where}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
