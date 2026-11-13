"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { SPRINGS } from "@/lib/motion/curves";
import { isTap, loadPlacement, type Offset, releaseRotation, savePlacement } from "./sticker-drag";

// A sticker that can be dragged within `bounds` and flicked (spec §3.5): it settles where
// dropped with the sticker spring and a spin proportional to release velocity (±25°).
// Placement persists for the session. If it is a link it navigates only on a tap
// (< 6 px of movement); keyboard users focus and press Enter as with any link.
// touch-action: pan-y keeps vertical swipes scrolling the page.
interface Props {
  id: string;
  bounds: RefObject<HTMLElement | null>;
  href?: string;
  /** Accessible name when it is a link (the sticker inside carries its own label otherwise). */
  linkLabel?: string;
  children: ReactNode;
}

export function DraggableSticker({ id, bounds, href, linkLabel, children }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spin = useMotionValue(0);
  const start = useRef<Offset | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    const p = loadPlacement(id);
    if (p) {
      x.set(p.x);
      y.set(p.y);
      spin.set(p.rotate);
    }
  }, [id, x, y, spin]);

  const content = href ? (
    <a
      href={href}
      aria-label={linkLabel}
      className="sticker-drag__link"
      draggable={false}
      onClickCapture={(e) => {
        if (dragged.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {children}
    </a>
  ) : (
    children
  );

  return (
    <motion.div
      className="sticker-drag"
      data-sticker-id={id}
      style={{ x, y, rotate: spin, touchAction: "pan-y" }}
      drag
      dragConstraints={bounds}
      dragElastic={0.12}
      dragTransition={{ power: 0.25, timeConstant: 220 }}
      whileDrag={{ scale: 1.06, cursor: "grabbing" }}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
        dragged.current = false;
      }}
      onPointerUp={(e) => {
        if (start.current) dragged.current = !isTap(start.current, { x: e.clientX, y: e.clientY });
      }}
      onDragEnd={(_, info) => {
        const rotate = releaseRotation(info.velocity.x);
        animate(spin, rotate, { type: "spring", ...SPRINGS.sticker });
        // Save where it will come to rest once momentum settles.
        window.setTimeout(() => savePlacement(id, { x: x.get(), y: y.get(), rotate }), 700);
      }}
    >
      {content}
    </motion.div>
  );
}
