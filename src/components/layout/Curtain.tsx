"use client";

// The page change (redesign 2026-11-14). A fixed, screen-sized sheet: cheap in every
// browser, unlike the whole-page snapshot it replaces (see PageWipe.tsx).
//
// Between paper pages a sheet of paper comes over with one ink line drawn across it, and
// lifts on the new page. Going to the events pages the lights dim: the sheet is the
// night's black and comes over more slowly; coming back, they come up again.
//
// The order matters: the sheet covers the old page first (200 ms; 340 ms for the dim),
// then the route changes underneath it, then it lifts on the new page. So the visitor
// never sees the new page arrive half-scrolled or half-loaded. The click is taken in the
// capture phase and the route is pushed when the cover is done. With reduced motion, a
// modified click, a new tab or an outside link, nothing is intercepted.
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const COVER = 200; // ms the paper takes to come over
const DIM = 340; // ms the lights take to go down
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
      <span className="curtain__line" />
    </div>
  );
}
