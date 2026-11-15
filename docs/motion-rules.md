# Motion rules for the page change

Adopted 2026-11-15 after researching how marker-stroke covers and draw-on entrances are
built well (CSS-Tricks on animated calligraphy, CodyHouse's ink transition, Rough Notation,
the SVG working group's notes on non-scaling strokes and dashes, WebKit bug 208441, the
GSAP forums on turbulence filters on phones, Chrome's notes on view transitions and on
compositor animations). The thresholds are working judgments, not measurements from those
sources. Code: `src/components/layout/Curtain.tsx`, styles in `src/styles/shell.css`.

## Rules

1. The cover takes 350 ms or less. The arrival takes 900 ms or less. Never more than about
   1.4 s from click to a settled page.
2. The next page is prefetched on the click. The animation never delays the fetch.
3. If the page is not ready when the cover is whole, the cover holds; after 3 s it gives up
   and lifts anyway.
4. The cover is completely opaque, backed by a plain sheet, before the page is swapped and
   the scroll position reset.
5. Animate only `transform`, `opacity` and `clip-path`, plus `stroke-dashoffset` on small
   drawings. Never width, height, top, left, shadows, filters or stroke width.
6. No live SVG filters on anything that moves.
7. Roughness is baked into the shapes (drawn into the outline), not added by a filter.
8. No `vector-effect: non-scaling-stroke` on a path whose dashes are animated; browsers
   disagree about dash lengths there.
9. Text stays text. It is wiped in, never traced.
10. A first visit has no entrance animation. Content is in the page and paintable at once.
11. A second click during a change restarts it. Back and Forward have no cover.
12. With reduced motion there is no cover and no draw-on.
13. Marker bands are never identical: vary their width, tilt and timing.
14. The arrival touches only what is on the first screen, at most fourteen things, in
    reading order.
15. Test at 390 px with a 4x CPU throttle: the page must already be covered when it swaps,
    and frames should hold near 16.7 ms. Check on a real phone before calling it done.

## What was tried and dropped

- One thick zigzag line, then seven thick lines, drawn with a dash offset in a drawing
  stretched to the screen: uniform width and parallel edges read as flat vector bands, and
  stretching distorts the line's ends.
- A wobble filter on moving shapes: too costly on phones.
- A decorative squiggle drawn on the cover before it lifted: Theo's note was that the
  page's own content should be what draws on.
- Six shaped marker bands (filled shapes with rough edges and dry tails, tilted, sliding
  in from alternate sides): better drawn than the lines, but Theo's verdict was still
  "so bad", and the marker cover was scrapped on 2026-11-15. The cover is now a plain
  sheet fading up in the next page's colour; the character is in the arrival, where the
  page's own content draws on. Rules 7 and 13 below applied to the bands and are kept
  only as a record.
