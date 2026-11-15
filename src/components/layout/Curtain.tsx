"use client";

// The page change. Rebuilt 2026-11-15 from research into how this is done well (the rules
// are in docs/motion-rules.md). Two parts:
//
// 1. The cover. Six marker bands paint the screen out: each is a filled shape with its
//    rough edges, blunt start and dry, fingered tail baked into its outline, unequal in
//    width, tilted a few degrees, overlapping its neighbours, sliding in from alternate
//    sides with a fast attack. Transform only, so it runs on the compositor. A plain
//    sheet snaps in under the last band, so the cover is certain to be whole before the
//    page is swapped. Paper between paper pages; the night's black into the events pages.
//
// 2. The arrival. The cover lifts and the new page's own content is drawn on in reading
//    order: its headings, rules, tickets and rows wipe in from the left, one after
//    another, inside about three quarters of a second. Only what is on the first screen,
//    at most fourteen things. On a first visit nothing is animated; the page just paints.
//
// The click is taken first: the next page is prefetched at once and pushed when the cover
// is whole. With reduced motion, a modified click, a new tab or an outside link, nothing
// is intercepted. Back and forward have no cover.
import { usePathname, useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useRef } from "react";

const COVER = 560; // ms until the cover is whole (last band lands at about 540)
const NIGHT = /^\/events(\/|$)/;
const DRAWN =
  "h1, h2, h3, .sec-head__rule, .open-now, .tix__t, .facts__cell, .mrow, .hours__row, .smap__row, .ledger__row, .btn, .field, .prose p";
const MOST = 14;

// A small seeded generator, so the same rough edges are drawn on the server and in the browser.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** One marker band on a 1000 × 100 sheet: wobbling long edges, a blunt start, a dry tail. */
function band(seed: number): string {
  const r = seeded(seed);
  const top: string[] = [];
  const bottom: string[] = [];
  for (let x = 30; x <= 930; x += 22) {
    top.push(`${x} ${(7 + r() * 7).toFixed(1)}`);
    bottom.push(`${x} ${(93 - r() * 7).toFixed(1)}`);
  }
  // the tail: the marker running dry, in uneven fingers
  const tail: string[] = [];
  const fingers = 5;
  for (let i = 0; i < fingers; i++) {
    const y0 = 9 + (i * 82) / fingers;
    const y1 = 9 + ((i + 1) * 82) / fingers;
    const reach = 945 + r() * 55;
    tail.push(`${reach.toFixed(0)} ${(y0 + 2).toFixed(1)}`, `${reach.toFixed(0)} ${(y1 - 3).toFixed(1)}`);
    if (i < fingers - 1) tail.push(`${(925 + r() * 12).toFixed(0)} ${y1.toFixed(1)}`);
  }
  // the start: blunt, a little rounded, set down hard
  const start = `C2 78 0 60 3 44C1 30 6 16 30 ${(8 + r() * 5).toFixed(1)}`;
  return `M${top.join("L")}L${tail.join("L")}L${bottom.reverse().join("L")}${start}Z`;
}

// Six bands: where each sits, how tall, its tilt, how long its stroke takes. Unequal on
// purpose; together they overlap by about a quarter and overshoot every edge.
const BANDS = [
  { top: -6, height: 26, tilt: -5, ms: 190 },
  { top: 12, height: 23, tilt: 4, ms: 170 },
  { top: 28, height: 27, tilt: -6, ms: 200 },
  { top: 46, height: 24, tilt: 5, ms: 175 },
  { top: 62, height: 26, tilt: -4, ms: 195 },
  { top: 79, height: 28, tilt: 6, ms: 185 },
].map((b, i) => ({ ...b, d: band(11 + i * 7), from: i % 2 === 0 ? -1 : 1 }));

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
      root.dataset.curtainTo = NIGHT.test(to.pathname) ? "night" : "paper";
      delete root.dataset.curtain;
      // restart cleanly if a transition was already running
      void root.offsetWidth;
      root.dataset.curtain = "cover";
      timers.current = [
        window.setTimeout(() => router.push(href), COVER),
        // never leave the cover down if the navigation does not happen
        window.setTimeout(() => {
          delete root.dataset.curtain;
          delete root.dataset.curtainTo;
        }, COVER + 3000),
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

  return (
    <div className="curtain" aria-hidden="true">
      <div className="curtain__back" />
      {BANDS.map((b, i) => (
        <svg
          key={b.d}
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          className="curtain__band"
          focusable="false"
          style={
            {
              top: `${b.top}%`,
              height: `${b.height}%`,
              "--tilt": `${b.tilt}deg`,
              "--from": b.from,
              "--ms": `${b.ms}ms`,
              "--i": i,
            } as CSSProperties
          }
        >
          <path d={b.d} />
        </svg>
      ))}
    </div>
  );
}
