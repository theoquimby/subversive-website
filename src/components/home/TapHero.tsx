"use client";

// Home's first screen: the tap list as one glass under a bar tap. On arrival the first
// beer pours itself, so nobody has to guess what the glass does; "Pour the next beer" is
// a plain button beside it, and the glass itself takes a tap or a sideways swipe. A small
// back arrow and a count sit under the button; a screen reader hears each new beer from
// a quiet live line.
//
// The server renders the first beer's name, style and line, so the text is complete
// without JavaScript and paints with the page (no image above the fold).
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
  const [pour, setPour] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const beer = beers[at];
  if (!beer) return null;
  const meta = `${beer.style} · ${beer.abv.toFixed(1)}%`;

  const go = (step: number) => {
    setAt((at + step + beers.length) % beers.length);
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
        <button type="button" className="btn btn--secondary tap-hero__pour" onClick={() => go(1)}>
          <span className="btn__label">{homeLabels.tap.next}</span>
          <Icon name="arrow" className="btn__icon" />
        </button>
        <div className="tap-hero__controls">
          <button type="button" className="tap-hero__arrow" onClick={() => go(-1)}>
            <Icon name="arrow" className="tap-hero__arrow-icon tap-hero__arrow-icon--back" />
            <span className="sr-only">{homeLabels.tap.previous}</span>
          </button>
          <p className="tap-hero__count tabular" aria-hidden="true">
            {String(at + 1).padStart(2, "0")} / {String(beers.length).padStart(2, "0")}
          </p>
          <Link href={`/menu#${beer.id}`} className="tap-hero__more">
            {homeLabels.tap.onTheMenu}
          </Link>
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
        <LabelGlass beer={beer} pour={pour} />
      </button>

      {/* silent on arrival (the heading is already there); speaks each beer poured after */}
      <p className="sr-only" aria-live="polite">
        {pour > 0 ? `${beer.name}, ${meta}` : ""}
      </p>
    </div>
  );
}
