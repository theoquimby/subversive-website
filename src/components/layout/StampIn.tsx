"use client";

import { useEffect } from "react";

// The set pieces that enter once:
//   [data-stamp] pills — stamp when they scroll into view; anything already on screen at
//                load is left alone (the words never wait, spec §3A).
//   [data-pop]   stickers — pop in when first visible, including at load (they are
//                objects, not words; spec §3.5). CSS adds the 250 ms delay.
//   [data-draw]  the Home map: its lines draw toward Catskill when first visible
//   [data-pour]  menu rows — the glass fills when the row is first visible, at load too
//                (spec §4.4). Rows in the hidden list wait until they are shown.
// Reduced motion: everything is marked shown at once and nothing moves.
//
// Two observers. Pills wait until they are 12% up the screen. Objects use the whole
// viewport: a sticker at scale 0 sitting just above the fold never crossed that 12% line
// and waited 2.5 s for its failsafe (critique 11/13).
export function StampIn() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      for (const el of document.querySelectorAll<HTMLElement>("[data-pop]")) el.dataset.pop = "in";
      for (const el of document.querySelectorAll<HTMLElement>("[data-pour]")) el.dataset.pour = "in";
      for (const el of document.querySelectorAll<Element>("[data-draw]")) el.setAttribute("data-draw", "in");
      return;
    }

    const firstPass = new Set<Element>();
    const pills = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          const isFirst = !firstPass.has(el);
          firstPass.add(el);
          if (!e.isIntersecting) continue;
          // a pill on screen at load (first callback, intersecting) is simply left as is
          if (!isFirst) el.dataset.stamp = "in";
          pills.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    const objects = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        if (el.hasAttribute("data-pop")) el.dataset.pop = "in";
        else if (el.hasAttribute("data-pour")) el.dataset.pour = "in";
        else el.setAttribute("data-draw", "in");
        objects.unobserve(el);
      }
    });

    for (const el of document.querySelectorAll("[data-stamp]")) pills.observe(el);
    for (const el of document.querySelectorAll("[data-pop], [data-pour], [data-draw]")) objects.observe(el);
    return () => {
      pills.disconnect();
      objects.disconnect();
    };
  }, []);
  return null;
}
