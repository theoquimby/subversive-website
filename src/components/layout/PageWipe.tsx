// Page frame. Each page's content sits in an opaque frame.
//
// The page-to-page transition is OFF for now (2026-11-13). It used React's
// <ViewTransition>, which makes the browser snapshot the whole page element: Home is
// ~7,000 px tall, and WebKit took 4–5× longer than Chromium from click to URL change
// (263–535 ms against 67–105 ms, measured), running to seconds on a machine without a
// GPU, where links from Home timed out in CI. The critique also scored the resulting
// fade as cheap. A page change that costs the same in every browser, a fixed,
// screen-sized slash curtain, comes with the overhaul; until then navigation is instant.
import type { ReactNode } from "react";

export function PageWipe({ children }: { children: ReactNode }) {
  return <div className="page-frame">{children}</div>;
}
