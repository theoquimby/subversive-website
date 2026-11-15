"use client";

// The page change (redesign 2026-11-14). A fixed, screen-sized sheet: cheap in every
// browser, unlike the whole-page snapshot it replaces (see PageWipe.tsx).
//
// The screen is scribbled over with one broad pen stroke, side to side from the top down,
// as if coloured in by hand: in paper between paper pages, and in the night's black on
// the way to the events pages, so the lights are painted out rather than faded. Coming
// back from the events pages it is painted paper again.
//
// The order matters: the scribble covers the old page first (420 ms; 560 ms to paint it dark),
// then the route changes underneath it, then it lifts on the new page. So the visitor
// never sees the new page arrive half-scrolled or half-loaded. The click is taken in the
// capture phase and the route is pushed when the cover is done. With reduced motion, a
// modified click, a new tab or an outside link, nothing is intercepted.
import { usePathname, useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useRef } from "react";

const COVER = 420; // ms the scribble takes to cover the screen in paper
const DIM = 560; // ms it takes to paint the screen dark
const NIGHT = /^\/events(\/|$)/;
// the marker's sweeps, alternating direction, each bowed a little differently
const SWEEPS = [
  "M-15 5C20 0 70 9 115 3",
  "M115 19C75 24 30 14 -15 21",
  "M-15 36C25 31 65 41 115 34",
  "M115 51C70 56 35 46 -15 53",
  "M-15 68C30 63 70 73 115 66",
  "M115 84C75 89 30 79 -15 86",
  "M-15 99C25 95 70 103 115 97",
];

export function Curtain() {
  const path = usePathname();
  const router = useRouter();
  const cover = useRef(0);
  const timers = useRef<number[]>([]);

  // start the cover on a click that will change the page
  useEffect(() => {
    const root = document.documentElement;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target || a.hasAttribute("download")) return;
      const to = new URL(a.href, location.href);
      if (to.origin !== location.origin || to.pathname === location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      for (const t of timers.current) window.clearTimeout(t);
      const night = NIGHT.test(to.pathname);
      cover.current = night ? DIM : COVER;
      root.dataset.curtainTo = night ? "night" : "paper";
      root.dataset.curtain = "cover";
      timers.current = [
        window.setTimeout(() => router.push(to.pathname + to.search + to.hash), cover.current),
        // never leave the sheet down if the navigation does not happen
        window.setTimeout(() => {
          delete root.dataset.curtain;
          delete root.dataset.curtainTo;
        }, 4000),
      ];
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // lift it once the new page is in and the cover has finished
  // biome-ignore lint/correctness/useExhaustiveDependencies: the path is the trigger
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.curtain !== "cover") return;
    for (const t of timers.current) window.clearTimeout(t);
    // a beat for the new page to paint under the sheet
    timers.current = [
      window.setTimeout(() => {
        root.dataset.curtain = "reveal";
        timers.current.push(
          window.setTimeout(() => {
            delete root.dataset.curtain;
            delete root.dataset.curtainTo;
          }, 700),
        );
      }, 90),
    ];
  }, [path]);

  return (
    <div className="curtain" aria-hidden="true">
      {/* seven sweeps of a broad marker, back and forth down the screen, each a little
          bowed; then, on the covered sheet, one quick continuous pen line before it lifts */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="curtain__ink" focusable="false">
        {SWEEPS.map((d, i) => (
          <path
            key={d}
            d={d}
            pathLength={1}
            className="curtain__sweep"
            style={{ "--i": i } as CSSProperties}
          />
        ))}
        <path
          pathLength={1}
          className="curtain__pen"
          d="M-5 52C15 40 25 60 35 50C42 43 30 38 34 48C40 62 55 40 65 50C72 57 62 62 66 52C72 38 90 56 105 48"
        />
      </svg>
    </div>
  );
}
