"use client";

import { useRef } from "react";
import { DraggableSticker } from "@/components/graphics/DraggableSticker";
import { Sticker } from "@/components/graphics/Sticker";

// Kit-only: a bounded box to try the drag, flick and tap-vs-drag rules (spec §3.5).
export function StickerPlayground() {
  const bounds = useRef<HTMLDivElement>(null);
  return (
    <div ref={bounds} className="kit-playground">
      <DraggableSticker
        id="kit-menu"
        bounds={bounds}
        href="/dev/kit#kit-glass"
        linkLabel="Tonight: see the glasses"
      >
        <Sticker shape="burst" color="pils" rotate="b" label="Tonight" pop={false}>
          Tonight
        </Sticker>
      </DraggableSticker>
    </div>
  );
}
