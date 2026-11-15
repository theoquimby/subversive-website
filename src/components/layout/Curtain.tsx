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
import { useEffect, useRef } from "react";

const COVER = 420; // ms the scribble takes to cover the screen in paper
const DIM = 560; // ms it takes to paint the screen dark
const NIGHT = /^\/events(\/|$)/;

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
          }, 520),
        );
      }, 90),
    ];
  }, [path]);

  return (
    <div className="curtain" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="curtain__ink" focusable="false">
        <path
          pathLength={1}
          d="M-12 6L112 2L-12 20L112 18L-12 36L112 34L-12 52L112 50L-12 68L112 66L-12 84L112 82L-12 100L112 98"
        />
      </svg>
    </div>
  );
}
