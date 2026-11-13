"use client";

import { useEffect } from "react";

// One observer for the set pieces that enter once:
//   [data-stamp] pills — stamp when they scroll into view; anything already on screen at
//                load is left alone (the words never wait, spec §3A).
//   [data-pop]   stickers — pop in when first visible, including at load (they are
//                objects, not words; spec §3.5). CSS adds the 250 ms delay.
// Reduced motion: stickers are marked shown at once and nothing moves.
export function StampIn() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pops = document.querySelectorAll<HTMLElement>("[data-pop]");
    if (reduced) {
      for (const el of pops) el.dataset.pop = "in";
      return;
    }
    const firstPass = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          const isFirst = !firstPass.has(el);
          firstPass.add(el);
          if (!e.isIntersecting) continue;
          if (el.hasAttribute("data-pop")) {
            el.dataset.pop = "in";
          } else if (!isFirst) {
            el.dataset.stamp = "in";
          }
          io.unobserve(el);
          // a pill on screen at load (first callback, intersecting) is simply left as is
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    for (const el of document.querySelectorAll("[data-stamp], [data-pop]")) io.observe(el);
    return () => io.disconnect();
  }, []);
  return null;
}
