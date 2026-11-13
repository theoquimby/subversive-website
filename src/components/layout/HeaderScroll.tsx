"use client";

import { useEffect } from "react";

// Header scroll behaviour (spec §4.1, revised after the 11/13 critique). The header is
// always opaque; it gains its 2 px rule after 80 px. On phones and tablets it slides away
// on scroll down and returns on scroll up, never while the mobile menu is open (Radix
// marks the body with data-scroll-locked). On desktop it stays put.
//
// The one rule for the sticky stack: this is the only place that decides whether the
// header shows, and it says so on <html data-header="hidden"> in the same frame, so every
// bar pinned beneath it (shell.css: --header-offset) moves with it.
// One passive listener, one rAF per frame.
const SOLID_AT = 80;
const DEADBAND = 6;
const DESKTOP = "(min-width: 64rem)";

export function HeaderScroll() {
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;
    const root = document.documentElement;
    const desktop = window.matchMedia(DESKTOP);
    let lastY = window.scrollY;
    let frame = 0;

    const setHidden = (hidden: boolean) => {
      header.toggleAttribute("data-hidden", hidden);
      if (hidden) root.dataset.header = "hidden";
      else delete root.dataset.header;
    };

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      header.toggleAttribute("data-solid", y > SOLID_AT);
      const menuOpen = document.body.hasAttribute("data-scroll-locked");
      if (desktop.matches || menuOpen || y <= SOLID_AT) setHidden(false);
      else if (y > lastY + DEADBAND) setHidden(true);
      else if (y < lastY - DEADBAND) setHidden(false);
      if (Math.abs(y - lastY) > DEADBAND) lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    desktop.addEventListener("change", onScroll);
    // keyboard users: anything focused inside the header brings it back
    const onFocus = () => setHidden(false);
    header.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      desktop.removeEventListener("change", onScroll);
      header.removeEventListener("focusin", onFocus);
      if (frame) cancelAnimationFrame(frame);
      delete root.dataset.header;
    };
  }, []);
  return null;
}
