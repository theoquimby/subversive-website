// Stickers (spec §3.5): the menu's starburst and round stamp, as die-cut stickers that
// carry the things that change. Server-rendered; pop-in and peel are CSS, dragging is the
// DraggableSticker wrapper. Never more than three in one viewport.
import type { ReactNode } from "react";
import { PRINT_FILTER_ID } from "./PrintFilter";
import { BURST_POINTS } from "./sticker-geometry";

export type StickerShape = "burst" | "round" | "tag" | "slash";
export type StickerColor = "pils" | "ember" | "sky" | "currant" | "spruce";
/** The three angles (spec §9.3.7). */
export type StickerAngle = "a" | "b" | "c";

export interface StickerProps {
  shape: StickerShape;
  color?: StickerColor;
  rotate?: StickerAngle;
  /** Text equivalent for the sticker's fact; the visual text is hidden from AT. */
  label: string;
  children: ReactNode;
  /** Pop in when first seen (spec §3.5). Off for stickers that must be still. */
  pop?: boolean;
  className?: string;
}

function Shape({ shape }: { shape: StickerShape }) {
  switch (shape) {
    case "burst":
      return (
        <svg viewBox="0 0 100 100" className="sticker__shape" aria-hidden="true" focusable="false">
          <polygon points={BURST_POINTS} filter={`url(#${PRINT_FILTER_ID})`} />
        </svg>
      );
    case "round":
      return (
        <svg viewBox="0 0 100 100" className="sticker__shape" aria-hidden="true" focusable="false">
          <g filter={`url(#${PRINT_FILTER_ID})`}>
            <circle cx="50" cy="50" r="50" />
            {/* the inset ring: 1.5 px, 7 px inside the edge at a 100 px sticker */}
            <circle cx="50" cy="50" r="43" className="sticker__ring" />
          </g>
        </svg>
      );
    case "slash":
      // A band cut at the slash angle that grows with its words (CSS clip-path, graphics.css).
      return <span className="sticker__shape sticker__shape--slash" aria-hidden="true" />;
    case "tag":
      return <span className="sticker__shape sticker__shape--tag" aria-hidden="true" />;
  }
}

export function Sticker({
  shape,
  color = "pils",
  rotate = "a",
  label,
  children,
  pop = true,
  className,
}: StickerProps) {
  return (
    <span
      className={["sticker", className ?? ""].filter(Boolean).join(" ")}
      data-shape={shape}
      data-color={color}
      data-rot={rotate}
      data-pop={pop ? "" : undefined}
      role="img"
      aria-label={label}
    >
      <span className="sticker__body">
        <Shape shape={shape} />
        <span className="sticker__text" aria-hidden="true">
          <span className="sticker__ink">{children}</span>
          {/* misregistration: the same words offset 1 px in ink at 18% */}
          <span className="sticker__ghost">{children}</span>
        </span>
      </span>
      <span className="sticker__flap" aria-hidden="true" />
    </span>
  );
}
