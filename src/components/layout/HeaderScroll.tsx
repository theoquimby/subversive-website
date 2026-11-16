"use client";

import { useEffect } from "react";

// Header scroll behaviour (spec §4.1). The header is always opaque and always pinned; it
// gains its rule after 80 px.
//
// It no longer slides away on scroll down on phones (2026-11-15, found on Theo's iPhone):
// iOS 26 Safari paints the strip around the Dynamic Island from the fixed or sticky
// element at the top edge, and shows the page's own pixels there when there is none. With
// the header gone, menu rows and photos scrolled through the island's strip.
// One passive listener, one rAF per frame.
const SOLID_AT = 80;

export function HeaderScroll() {
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.toggleAttribute("data-solid", window.scrollY > SOLID_AT);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
