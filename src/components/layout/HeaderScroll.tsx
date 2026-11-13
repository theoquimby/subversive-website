"use client";

import { useEffect } from "react";

// Header scroll behaviour (spec §4.1): transparent, then solid with a 2 px rule after 80 px;
// hides on scroll down and returns on scroll up — never while the mobile menu is open
// (Radix marks the body with data-scroll-locked). One passive listener, one rAF per frame.
const SOLID_AT = 80;
const DEADBAND = 6;

export function HeaderScroll() {
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      header.toggleAttribute("data-solid", y > SOLID_AT);
      const menuOpen = document.body.hasAttribute("data-scroll-locked");
      if (menuOpen || y <= SOLID_AT) header.removeAttribute("data-hidden");
      else if (y > lastY + DEADBAND) header.setAttribute("data-hidden", "");
      else if (y < lastY - DEADBAND) header.removeAttribute("data-hidden");
      if (Math.abs(y - lastY) > DEADBAND) lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    // keyboard users: anything focused inside the header brings it back
    const onFocus = () => header.removeAttribute("data-hidden");
    header.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      header.removeEventListener("focusin", onFocus);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
