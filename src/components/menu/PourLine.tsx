"use client";

// The pour line (spec §5.4): on desktop, a thin ember line at the left edge fills with
// reading progress through the open list; each section is a kernel on it, and a kernel
// jumps to its section. The section chips are the keyboard path, so this is mouse-only
// and hidden from assistive tech. One passive scroll listener, one rAF per frame.
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { Show } from "@/lib/menu/filters";
import { KERNELS } from "../graphics/BarleyMark";
import { useShow } from "./show-store";

interface Mark {
  id: string;
  at: number;
}

const KERNEL = KERNELS[0];

export function PourLine({ drinks, food }: { drinks: string[]; food: string[] }) {
  const show = useShow();
  const line = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState<Mark[]>([]);

  useEffect(() => {
    const ids: Record<Show, string[]> = { drinks, food };
    const list = document.querySelector<HTMLElement>(`[data-list="${show}"]`);
    const el = line.current;
    if (!list || !el) return;
    let frame = 0;
    const measure = () => {
      const top = list.getBoundingClientRect().top + window.scrollY;
      const h = list.offsetHeight || 1;
      setMarks(
        ids[show]
          .map((id) => document.getElementById(id))
          .filter((s): s is HTMLElement => !!s)
          .map((s) => ({ id: s.id, at: (s.getBoundingClientRect().top + window.scrollY - top) / h })),
      );
      return { top, h };
    };
    let box = measure();
    const update = () => {
      frame = 0;
      const p = (window.scrollY + window.innerHeight * 0.35 - box.top) / box.h;
      el.style.setProperty("--p", String(Math.max(0, Math.min(1, p))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const ro = new ResizeObserver(() => {
      box = measure();
      onScroll();
    });
    ro.observe(list);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [show, drinks, food]);

  return (
    <div className="pour-line" ref={line} aria-hidden="true">
      <span className="pour-line__fill" />
      {marks.map((m) => (
        <a
          key={m.id}
          href={`#${m.id}`}
          tabIndex={-1}
          className="pour-line__kernel"
          style={{ "--at": m.at } as CSSProperties}
        >
          <svg viewBox="28 127.5 26 42" focusable="false">
            <path d={KERNEL} />
          </svg>
        </a>
      ))}
    </div>
  );
}
