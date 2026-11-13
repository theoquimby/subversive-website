"use client";

// Home's first screen (direction contract: "The label, poured"). The tap list as one
// glass: tap or swipe it and the next beer pours over the last, in its real colour, with
// its name, style and ABV beside it. Arrow buttons and a count give the same thing to a
// keyboard; a screen reader hears each new beer from a quiet live line.
//
// The server renders the first beer, so the screen is complete without JavaScript and
// paints with the page (no image above the fold). The first pour is pure CSS.
import { homeLabels } from "@content/microcopy";
import { useRef, useState } from "react";
import { Icon } from "../graphics/Icon";
import { Link } from "../ui/Link";
import { LabelGlass } from "./LabelGlass";

export interface TapBeer {
  id: string;
  name: string;
  style: string;
  abv: number;
  color: string;
  hazy?: boolean;
  description?: string;
}

const SWIPE = 36; // px of sideways travel that counts as a swipe
const LONG = 17; // a name longer than this sets a size down, so it still fits two lines

export function TapHero({ beers }: { beers: TapBeer[] }) {
  const [at, setAt] = useState(0);
  const [from, setFrom] = useState<number | null>(null);
  const [pour, setPour] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const beer = beers[at];
  if (!beer) return null;
  const under = from === null ? undefined : beers[from];
  const meta = `${beer.style} · ${beer.abv.toFixed(1)}%`;

  const go = (step: number) => {
    const next = (at + step + beers.length) % beers.length;
    setFrom(at);
    setAt(next);
    setPour((n) => n + 1);
  };

  return (
    <div className="tap-hero" data-pours={pour}>
      <div className="tap-hero__head">
        <h2
          key={`n-${pour}`}
          className={beer.name.length > LONG ? "tap-hero__name tap-hero__name--long" : "tap-hero__name"}
        >
          <span>{beer.name}</span>
        </h2>
      </div>

      <div className="tap-hero__side">
        <p className="tap-hero__meta tabular" key={`m-${pour}`}>
          {meta}
        </p>
        {/* the line stays (empty) for a beer without one, so nothing below it moves */}
        <p className="tap-hero__desc" key={`d-${pour}`}>
          {beer.description ?? ""}
        </p>
        <Link href={`/menu#${beer.id}`} className="tap-hero__more">
          {homeLabels.tap.onTheMenu}
        </Link>
        <div className="tap-hero__controls">
          <button type="button" className="tap-hero__arrow" onClick={() => go(-1)}>
            <Icon name="arrow" className="tap-hero__arrow-icon tap-hero__arrow-icon--back" />
            <span className="sr-only">{homeLabels.tap.previous}</span>
          </button>
          <p className="tap-hero__count tabular" aria-hidden="true">
            {String(at + 1).padStart(2, "0")} / {String(beers.length).padStart(2, "0")}
          </p>
          <button type="button" className="tap-hero__arrow" onClick={() => go(1)}>
            <Icon name="arrow" className="tap-hero__arrow-icon" />
            <span className="sr-only">{homeLabels.tap.next}</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        className="tap-hero__glass"
        aria-label={homeLabels.tap.pour}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY };
          swiped.current = false;
        }}
        onPointerUp={(e) => {
          const s = start.current;
          start.current = null;
          if (!s) return;
          const dx = e.clientX - s.x;
          if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
            swiped.current = true;
            go(dx < 0 ? 1 : -1);
          }
        }}
        onClick={() => {
          // a swipe has already poured; a plain tap or a key press pours the next
          if (swiped.current) {
            swiped.current = false;
            return;
          }
          go(1);
        }}
      >
        <span className="tap-hero__hint" aria-hidden="true">
          {homeLabels.tap.hint}
        </span>
        <LabelGlass beer={beer} under={under} pour={pour} />
      </button>

      {/* silent on arrival (the heading is already there); speaks each beer poured after */}
      <p className="sr-only" aria-live="polite">
        {pour > 0 ? `${beer.name}, ${meta}` : ""}
      </p>
    </div>
  );
}
