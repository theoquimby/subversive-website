"use client";

// The hero's stickers (spec §6.1.2, §3.5): at most two. The next event as a burst that
// links to it (draggable within the photo, a tap still navigates), and one fact tag chosen
// by the New York weekday: Wing Wednesday, Rodeo Thursdays, otherwise the dogs.
import { homeLabels } from "@content/microcopy";
import { useEffect, useRef, useState } from "react";
import { nyParts } from "@/lib/time/ny";
import { DraggableSticker } from "../graphics/DraggableSticker";
import { Sticker } from "../graphics/Sticker";

export function weekdayTag(weekday: string): string {
  if (weekday === "wed") return homeLabels.weekdayTag.wed;
  if (weekday === "thu") return homeLabels.weekdayTag.thu;
  return homeLabels.weekdayTag.other;
}

export function HeroStickers({ next }: { next: { href: string; text: string; label: string } | null }) {
  const bounds = useRef<HTMLDivElement>(null);
  // the server renders the weekday-free tag; the browser corrects it to today
  const [tag, setTag] = useState<string>(homeLabels.weekdayTag.other);
  useEffect(() => setTag(weekdayTag(nyParts(new Date()).weekday)), []);
  return (
    <div className="hero-stickers" ref={bounds}>
      {next ? (
        <div className="hero-stickers__event">
          <DraggableSticker
            id="hero-event"
            bounds={bounds}
            href={next.href}
            // the visible word first, so the name matches what is seen (WCAG 2.5.3)
            linkLabel={`${next.text} · ${next.label}`}
          >
            <Sticker shape="burst" color="pils" rotate="b" label={next.label}>
              {next.text}
            </Sticker>
          </DraggableSticker>
        </div>
      ) : null}
      <div className="hero-stickers__tag">
        <Sticker shape="tag" color="sky" rotate="a" label={tag}>
          {tag}
        </Sticker>
      </div>
    </div>
  );
}
