"use client";

// The page change (rules in docs/motion-rules.md). Calm on purpose: the marker-band cover
// was scrapped on 2026-11-15 (Theo: "so bad still"), after three attempts.
//
// 1. The page goes quiet: a plain sheet in the next page's colour fades up over the old
//    page. Paper between paper pages; into the events pages it is the night's black and a
//    little slower, so the lights dim.
// 2. The arrival: the sheet lifts and the new page's own content is drawn on in reading
//    order: its headings, rules, tickets and rows wipe in from the left, one after
//    another, inside about three quarters of a second. Only what is on the first screen,
//    at most fourteen things. On a first visit nothing is animated; the page just paints.
//
// The click is taken first: the next page is prefetched at once and pushed when the sheet
// is whole. With reduced motion, a modified click, a new tab or an outside link, nothing
// is intercepted. Back and forward have no sheet.
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const COVER = 220; // ms for the paper sheet to come up
const DIM = 340; // ms for the lights to go down
const NIGHT = /^\/events(\/|$)/;
const DRAWN =
  "h1, h2, h3, .sec-head__rule, .open-now, .tix__t, .facts__cell, .mrow, .hours__row, .smap__row, .ledger__row, .btn, .field, .prose p";
const MOST = 14;

export function Curtain() {
  const path = usePathname();
  const router = useRouter();
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
      const href = to.pathname + to.search + to.hash;
      router.prefetch(href); // the fetch never waits for the animation
      const night = NIGHT.test(to.pathname);
      const cover = night ? DIM : COVER;
      root.dataset.curtainTo = night ? "night" : "paper";
      delete root.dataset.curtain;
      // restart cleanly if a transition was already running
      void root.offsetWidth;
      root.dataset.curtain = "cover";
      timers.current = [
        window.setTimeout(() => router.push(href), cover),
        // never leave the cover down if the navigation does not happen
        window.setTimeout(() => {
          delete root.dataset.curtain;
          delete root.dataset.curtainTo;
        }, cover + 3000),
      ];
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // the new page is in: mark what is on its first screen, lift the cover, let it draw on
  // biome-ignore lint/correctness/useExhaustiveDependencies: the path is the trigger
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.curtain !== "cover") return;
    // a new page opens at its top, at once, while the cover is still down (a link to a
    // place on the page keeps its own landing)
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "instant" });
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [
      // a beat for the new page to paint under the cover
      window.setTimeout(() => {
        const marked: HTMLElement[] = [];
        for (const el of document.querySelectorAll<HTMLElement>(`main :is(${DRAWN})`)) {
          if (marked.length >= MOST) break;
          const box = el.getBoundingClientRect();
          if (box.height === 0 || box.top > window.innerHeight || box.bottom < 0) continue;
          // not a thing inside a thing already marked (a heading inside a ticket)
          if (marked.some((m) => m.contains(el))) continue;
          el.style.setProperty("--arrive-i", String(marked.length));
          el.setAttribute("data-arrive", "");
          marked.push(el);
        }
        root.dataset.curtain = "reveal";
        timers.current.push(
          window.setTimeout(
            () => {
              delete root.dataset.curtain;
              delete root.dataset.curtainTo;
              for (const el of marked) {
                el.removeAttribute("data-arrive");
                el.style.removeProperty("--arrive-i");
              }
            },
            260 + marked.length * 40 + 360,
          ),
        );
      }, 90),
    ];
  }, [path]);

  return <div className="curtain" aria-hidden="true" />;
}
