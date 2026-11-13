"use client";

import { useEffect } from "react";

// One observer for every [data-stamp] element (pills, stamps). Anything already on screen
// at load is left alone (the words never wait, spec §3A); elements that scroll into view
// later stamp in once (spec §3.4). Reduced motion: nothing is marked, nothing moves.
export function StampIn() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const seen = new WeakSet<Element>();
    let first = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (seen.has(e.target)) continue;
          if (first && e.isIntersecting) {
            seen.add(e.target);
            io.unobserve(e.target);
            continue;
          }
          if (e.isIntersecting) {
            seen.add(e.target);
            (e.target as HTMLElement).dataset.stamp = "in";
            io.unobserve(e.target);
          }
        }
        first = false;
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    for (const el of document.querySelectorAll("[data-stamp]")) io.observe(el);
    return () => io.disconnect();
  }, []);
  return null;
}
