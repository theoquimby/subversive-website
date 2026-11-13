# Subversive website: working rules

Public site for Subversive, a farmhouse brewery, taproom and kitchen in Catskill, NY. The full brief is `docs/SPEC.md`. Read it before doing anything; it overrides habits and defaults.

## What matters most

1. Most visitors are on phones. Build and check every screen at 390 px wide first, then 320, 430, 768, 1280.
2. The site must look designed by one hand from the brewery's own printed menu (`docs/source/food-menu-2026-10.png`), not assembled from a kit. Follow the tokens (spec §2), the graphic language (§3) and the craft rules (§3A) exactly.
3. Every graphic is SVG or CSS. Photos are the only raster files.
4. No filler copy, no invented facts, no slogans. All copy comes from `content/` or the microcopy list in spec §7. If something is missing, leave a `TODO(Max)` and omit the block.
5. The brand is moving away from malting. Never mention malting, a malthouse or "Malting" in anything public (spec O10).
6. No native browser widgets, no component library with its own look, no icon library.

## How to work

- Follow the milestones in spec §10 in order. One milestone per branch or small series of commits; each ends deployed and checked on a phone-sized viewport.
- Before writing a component, find its section in the spec and use the given values. Do not improvise colors, sizes, radii, durations or copy.
- After each milestone run the review loop in spec §3A: screenshot at 390 and 1280 px in both skins, write down at least five concrete faults, fix them, then do a subtraction pass. Put the before/after screenshots in the PR or commit notes.
- Server components by default; client components only at the leaves. All timezone math goes through `src/lib/time/ny.ts`. All external data is Zod-validated at the boundary.
- Tests are part of the work: unit tests for `lib/`, Playwright for flows at phone and desktop sizes, axe checks, and the performance budgets in spec §9 are release gates.
- Chromium and Playwright are pre-installed in cloud sessions; do not install another copy.

## Do not

- Do not change DNS, the Squarespace site, Square, or the Subversive Ops app. Events come from the Ops feed read-only; if the feed needs new fields, write them down for Theo.
- Do not use NBA or team logos (spec §4.7).
- Do not add dependencies beyond those in spec §8.1 without a reason written in the commit message.
- Do not mark an open item (O1–O10 in spec §0.2) as decided. Build around it.

## People

Theo builds and reviews. Max owns the brewery and supplies art, photos and answers. Keep messages to them short and in plain English.
