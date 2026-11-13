# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **People deciding whether to come, on a phone.** Often outdoors, one-handed, on cellular, near Catskill NY. They want to know: is it open, what's pouring, what's to eat, how do I get there. About four in five visitors are on phones.
- **People already at the bar or a table,** reading the menu on their phone.
- **Max, the owner,** who needs the site to stay true without touching it: events and (later) hours and the menu come from his Ops app.

## Product Purpose

The public website for Subversive, a farmhouse brewery, taproom and kitchen at 96 West Bridge Street, Catskill NY. It gets people through the door: tonight's status and hours, the tap list and food menu with prices, events, directions, pickup ordering (Square, external). Success is a stranger who can answer "can I go now, and what will I have?" in seconds, and who remembers the site as well made and fun.

## Positioning

A true farmhouse brewery: every beer is brewed with 100% New York grain, and the kitchen names its farms (Kilcoyne beef, See & Be buns). The proof is on the menu and on the map, not in slogans.

## Operating Context

- Events come read-only from the Subversive Ops app (`/api/public/events`); the site never writes to Ops, Square or DNS.
- Menu and hours live in `content/*.json` until Ops serves them (`docs/ops-feed-requests.md`).
- Ordering is a link to Square Online. Ordering inside the site is a possible later milestone, not decided.
- Hosted on Vercel; the Ops app is Max's single hub.

## Capabilities and Constraints

- Pages: Home, Menu (drinks and food), Events and event pages, Visit; Our beer and About are still stubs.
- The open-now status is computed in New York time from hours plus events, and corrected in the browser.
- No invented facts or slogans: copy comes from `content/` and the client's own printed material. Missing facts get a `TODO(Max)`.
- Never mention malting or a malthouse; the brand has moved away from it.
- No NBA or team logos. Game nights are one line, not a takeover (Theo, 2026-11-13).
- No third-party scripts or iframes; cookieless analytics only.
- Performance budgets are release gates: LCP ≤ 1.8 s, CLS ≤ 0.02 on a throttled phone.
- Open items O2–O10 in `docs/SPEC.md` §0.2 are not decided.

## Brand Commitments

- Name: "Subversive" ("Subversive Brewing" on the label and in metadata).
- The barley mark (six geometric kernels) and the slash in the wordmark.
- **The beer label leads the look** (Theo, 2026-11-13): thin gold line on spruce green, the New York State outline, light geometric capitals, the mountain line with "Crafted in Catskill NY". The cream printed-menu look (checker rail, black pills, heavy flared serif) stays only for utility surfaces: the menu and hours.
- The lager goblin is Max's Oktoberfest character; only his own art may be used (not yet supplied).
- Voice: plain, factual, the menu's own words.
- The bar: a top 1% web experience; "useful fun"; refined, never heavy-handed, never early-2000s, never diner.

## Evidence on Hand

- Printed menus: `docs/source/food-menu-2026-10.png`, `docs/source/drink-menu-2026-10.png` (and PDFs).
- Beer label (New York Nectar): shared in chat 2026-11-13; the file and the typeface name are still to come from Max.
- Oktoberfest badge: `public/brand/oktoberfest-badge.webp`.
- Fourteen photographs in `public/photos/` (bar, burger, fire pits, tent, exterior, brewhouse).
- Menu and site data: `content/menu.json`, `content/site.json`, `content/events.seed.json`.
- Not on hand, never to be fabricated: goblin art, can photography, press, reviews, awards.

## Product Principles

1. Useful first: status, hours, prices and directions are never more than a glance away.
2. The beer is the hero; the brewery's own marks and words carry the brand.
3. Fun is something the visitor does, not decoration the page performs.
4. One hub: anything Max might change comes from Ops, with a safe fallback.
5. Judge by how it feels in the hand on a phone, then by tests.

## Accessibility & Inclusion

WCAG 2.2 AA: full keyboard path, visible focus, reduced-motion forms for every moving piece, 44 px targets, axe checks in every e2e run.
