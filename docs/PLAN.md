# Subversive website: implementation plan

Plan for building `docs/SPEC.md`, milestone by milestone (spec §10). Written 2026-11-13 against the repo as it stands (docs, content and brand files only; no application code).

How to use it: answer the questions in §1, then run one build session per milestone in §6. Each milestone lists files in build order, the spec sections each file implements, tests, and a "done when" check. Signatures for everything in `src/lib` are in §5 and are binding: build to them, do not redesign them.

Facts checked while planning (so the builder does not have to re-derive them):

| Fact | Value | How it was checked |
| --- | --- | --- |
| Current Next.js | 16.4.6, React 19.3.1 | `npm view`, test install |
| View Transitions | `<ViewTransition>` and `addTransitionType` ship in React 19.3; no `next.config` flag; `<Link transitionTypes={[…]}>` exists | `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` |
| Next 16 changes that touch this spec | `middleware.ts` is now `proxy.ts`; `next lint` is removed; `revalidateTag(tag)` needs a second argument (`revalidateTag("events", "max")`) | bundled upgrade guide |
| CSP | Nonces force dynamic rendering of every page. Static pages need `'unsafe-inline'` for scripts, or the experimental `experimental.sri` hash mode | bundled CSP guide |
| Framework JS baseline | An empty App Router page ships 138 KB gzip of JS (plus a 40 KB `nomodule` polyfill modern browsers skip) | built an empty app and measured |
| Other versions | Tailwind 4.3, Motion 14, `radix-ui` 1.8, Biome 2.6, Zod 4.6, Vitest 5, Playwright 1.65, Node 22.23, pnpm 10 | `npm view` |
| Dates | 2026-11-13 is a Friday. DST ends Sun 2026-11-01, starts Sun 2027-03-14 | calendar arithmetic |

The Next.js docs ship inside the package (`node_modules/next/dist/docs/`). When this plan and those docs disagree about an API, the docs win; note the difference in the commit.

---

## 1. Questions for Theo

Each has the assumption the plan makes. Nothing below blocks M0–M2 except Q1 and Q2.

### Needs an answer before the first build

**Q1. Where does work land, and where is `/dev/kit` visible?** Spec §10 says increments go to `main`; `CLAUDE.md` says one branch per milestone; spec §9.4 says a Vercel preview per PR. Spec §4 says `/dev/kit` is excluded from production builds, but pushes to `main` are production deployments and you review motion sheets in `/dev/kit` on a phone.
*Assumption:* commit straight to `main`, CI on every push, no PRs. `/dev/kit` and `?grid` are compiled only when `NEXT_PUBLIC_DEV_KIT=1`; you set that variable on the Vercel project until launch and remove it in M9. `/dev` is always in `robots.ts` disallow and `noindex`. Review screenshots go in `docs/review/M<n>/` because a commit message cannot hold images.

**Q2. The Vercel project.** M0 ends "deployed", and the builder must not create things outside the repo.
*Assumption:* you create the Vercel project, connect it to `theoquimby/subversive-website`, and set `NEXT_PUBLIC_DEV_KIT=1` and `NEXT_PUBLIC_SITE_URL`. Until then "done" for a milestone is the local production build (`pnpm build && pnpm start`) checked at 390 px.

### Conflicts between spec sections

**Q3. JS budget (§9.1) cannot be met.** "First-load JS for `/menu` ≤ 110 KB gzip" is below what an empty Next 16 page ships (138 KB). No amount of care in our code fixes that.
*Assumption:* the gate becomes "framework baseline + ≤ 30 KB gzip of our own JS on `/menu`", measured in CI against an empty route in the same build. The 35 KB gate chunk budget stands.

**Q4. Strict CSP (§8.8) against static pages and the inline gate script (§5.1).** A nonce-based CSP makes every page render per request, which works against the LCP budget and ISR. Next's own inline hydration scripts and our gate bootstrap both need to run on static HTML.
*Assumption:* pages stay static. M0 tries `experimental.sri` with `script-src 'self' 'sha256-<gate bootstrap hash>'`; if a Playwright run shows any CSP console error, fall back to `script-src 'self' 'unsafe-inline'`. Everything else stays strict (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, no third-party origins). `style-src` needs `'unsafe-inline'` either way because Motion writes inline styles. The builder reports which script policy shipped.

**Q5. Token contrast (§2.1) will fail on first run.** Computed from the spec's hex values (WCAG ratio; APCA figures are approximate):

| Pair | Use | WCAG | APCA Lc | Spec floor |
| --- | --- | --- | --- | --- |
| `--ember` on `--paper` | display accent ("Catskill.") | 2.67 | 47 | 3:1 fails |
| `--sky` on `--paper` | focus ring | 2.60 | 46 | 3:1 fails |
| `--go` on `--paper` | open dot | 2.27 | 41 | 3:1 fails if counted as a UI boundary |
| `--pils` on `--paper` | "pils-outlined box" (§6.2) | 1.27 | 12 | fails as a boundary |
| bone at 65% on `--night` | `--fg-muted`, Overtime | 6.99 | 48 | WCAG passes, APCA Lc 75 fails |
| `--ember-deep` on `--paper` | small accent text | 4.69 | 66 | WCAG passes, APCA Lc 75 fails |
| ink at 70% on `--paper-deep` | muted text on tinted panels | 5.99 | 69 | APCA Lc 75 fails |
| `--ember` on `--night` | `--accent-text`, Overtime | 6.17 | 44 | APCA fails for small text |
| ink on `--ember`, night on `--ember` | date block labels, Overtime CTA | 5.9–6.2 | 46 | APCA Lc 60 fails for labels |

The spec says a failing value "is adjusted darker, not exempted". That will move the brand's ember and sky, and raise the muted opacity on night.
*Assumption:* the builder follows the spec: lowers OKLCH lightness (hue and chroma fixed) in the smallest step that passes, raises `--fg-muted` opacity on Overtime, uses `--sky-deep` for the focus ring on Paper, gives the pils box a 2 px ink outline with a pils inner band, and treats the open dot as paired with text (not a boundary). Every changed value is listed old → new in the M0 commit notes for you to approve or reverse.

**Q6. Filtered menu rows at 30% opacity (§6.2) against "measure pairs as rendered" (§2.1).** Ink at 30% on paper is 1.94:1.
*Assumption:* dimmed rows are a deliberate "not matching" state, excluded from the contrast test by name, with the match count announced through `aria-live`. If you would rather not exempt them, the alternative is 55% opacity plus a struck kernel marker.

**Q7. Event colors (§6.3) against "each color has a job, and only that job" and "at most two spot colors per screen" (§2.1).** The events list gives Music pils, Trivia sky, Festivals currant, Games ember with court blue: five spot colors, three of them doing a second job.
*Assumption:* §6.3 is the specific rule and wins on `/events` and event pages only. Date blocks are the only place those colors appear there.

**Q8. Font files (§2.3, §4.5, §8.1, §9.1).** Six weights are specified and the budget is "at most six font files", but §4.5 asks for italic (a seventh), and "latin + latin-ext" doubles the file count. Also, "Märzen" and "¡" are in the plain `latin` subset; nothing in `content/` needs `latin-ext` (checked: no character above U+00FF except typographic quotes and dashes, which `latin` covers).
*Assumption:* `latin` subset only; six files; the modifiers line in the intro box is set upright in `--fg-muted`, not italic. No synthesized italics.

**Q9. Paper grain is a PNG (§3.8) but "the only raster files are photographs" (§0.3.4, `CLAUDE.md` rule 3).**
*Assumption:* follow §3.8: a 220 px noise PNG generated by `scripts/build-grain.ts`, not hand-made, treated as generated texture. If you want the rule kept literally, the swap is an SVG `feTurbulence` tile in a data URI; the builder measures both for scroll frame rate in M1 and reports.

**Q10. Stickers: "never more than three in one viewport" (§3.5) against row badges as "tiny tag stickers" (§4.4).** A screen of beer rows can show four badges.
*Assumption:* row badges are a static `Badge` (tag shape, no peel, no drag, Utility type because Caprasimo may not go below 20 px) and do not count toward the three.

**Q11. Open-now copy (§4.2) against `formatTime` (§8.5).** `formatTime("20:00")` is `8`, but the pill example reads `Knicks at 7:00` and tickets read `7:00 tip`.
*Assumption:* two formatters. Opening hours drop `:00` (`til 8`, `at 12`, `4:30–8`). Event start times keep it (`7:00`, `6:30`).

**Q12. Open-now: which state wins.** §4.2 lists seven states without an order, and "Open late tonight · Knicks at 7:00" does not say when it shows.
*Assumption (in order):* special closure → kitchen closed but bar open → open late (from opening until the kitchen closes, on a date where a GAME event extends closing) → open → opens later today → closed for the day → weekly closed day. Non-game events that end after closing (trivia ends 8:30, Thursday close is 8) still extend closing but show the plain `Open now · til 8:30`. Is it right that trivia extends closing time at all?

**Q13. Events and closed days.** The spec does not say what a non-closure event on a Tuesday does, or an event that starts before opening.
*Assumption:* events never open a closed day and never move opening time; they only extend closing. A Tuesday event still gets a ticket.

**Q14. Event URLs (§6.3).** The slug is `{date}-{kebab-title}` and "resolves by feed id so title edits don't break links", but the id is not in the URL, so an edited title cannot be traced back.
*Assumption:* exact slug match first; otherwise, if exactly one non-closure event exists on the slug's date, redirect (308) to its current slug; otherwise 404. This fully works only once Ops sends a stable `slug`.

**Q15. Past events (§6.3, §6.7).** "Past events stay up" and "recent acts from past MUSIC events" need history, but the feed is `?days=120` forward-looking.
*Assumption:* an event page stays up for as long as the feed (or seed) still returns the event. Once it is gone, a well-formed past slug renders a plain "This one's over" page with the date only, `noindex`. `/bands` omits the acts list. Ask Ops for a `pastDays` parameter (added to the field request list in M5).

**Q16. Weekly feature titles (§6.2 against `menu.json`).** The spec titles the box "Wing Wednesday" and uses that as a hero tag, but the data label is "Wednesdays only". "Wing Wednesday" appears on the printed menu only as the item name "Wing Wednesday Special".
*Assumption:* add `availability.title` to `menu.json` (`"Wing Wednesday"`, `"Rodeo Thursdays"`), taken from the printed menu, and keep `label` for the day chip.

**Q17. Seasonal items (O7, §8.4).** Hiding October specials by window is clear for the two specials sections. Festbier and Mountain Märzen are also `seasonal: true`; hiding them removes the whole Malty family and breaks the "Malty" filter and the five-family row on `/beer`.
*Assumption:* the two specials sections get `availableFrom: 2026-10-01`, `availableUntil: 2026-10-31` and disappear. The two beers keep `seasonal: true` with no window, stay listed with a `Seasonal` badge, until Max confirms the tap list (§11.3 item 5).

**Q18. Home "On tap" (§6.1.4): "the first eight draft beers … in two groups".** There are five style groups; eight rows cuts the Sour group in half.
*Assumption:* the first eight beers in menu order after the seasonal filter, under their own style group headers, laid out as two columns on desktop. "Two groups" is read as "two columns".

**Q19. Home kitchen strip (§6.1.5): captions need "name + price from the menu".** `giant-pretzel` matches "Giant Bavarian Pretzel 14", which is in the October section and will be hidden. `patio-plate` matches no menu item I can identify.
*Assumption:* each photo in `content/photos.ts` may name a `menuItemId`. A caption prints only when that item is on the current menu. Otherwise the photo shows without a caption and a `TODO(Max)` is logged. Max names the dishes.

**Q20. Menu disclosure and "no native widgets" (§0.3.3) against "the menu works without JavaScript" (§2.5).**
*Assumption:* menu rows are `<details>`/`<summary>` with the marker removed and fully styled. It is the only way a row can open with no JS, it adds no JS weight, and nothing of the browser's look remains. Everything else interactive uses Radix.

**Q21. Section chip order (§6.2) against the menu's own order.** Chips read Beer · Specials · Cocktails · Wine & cider · No-alcohol; the data and the printed menu run Wine, Hard cider, Cocktails, Non-alcoholic.
*Assumption:* sections render in the data's order and the chips follow the rendered order (Beer · Specials · Wine & cider · Cocktails · No-alcohol). Chip labels are the spec's.

**Q22. Playwright WebKit (§9.4) against "do not install another copy" (`CLAUDE.md`).** iPhone, iPad and desktop WebKit projects need the WebKit binary; cloud sessions have Chromium only.
*Assumption:* in cloud sessions the phone and tablet projects run in Chromium with the device's viewport, touch and user agent. GitHub Actions installs WebKit and runs the real WebKit projects. Anything that only fails in CI WebKit is reported, not skipped.

### Smaller assumptions (say so if any is wrong)

- **Amber dot** (§4.2 "kitchen closed, bar open"): there is no amber token. The dot uses `--pils` with a 2 px ink ring.
- **Off-scale type sizes** (hero subline 18 px, intro box 17 px, nav 15 px, meta 14 px): defined once as named tokens in `tokens.css` (`--t-subline`, `--t-nav`, `--t-meta`); no raw sizes in components.
- **Loud wordmark** is mixed case, `Sub/ersive`, the slash replacing the v, with `aria-label="Subversive"`.
- **Game titles**: tickets and the pill print the part after `Subversive Overtime: ` ("Knicks at Pacers"); the full title is kept for the page `<title>` and calendar files.
- **"First Friday"** events classify as Other and show under All only.
- **Filters**: style families are OR'd, `Under 5%` is AND'd with them and means ABV < 5.0. Food filters are AND'd; vegan items match Vegetarian. Drink filters touch beer rows only.
- **`GF bun available` and `New`** chips (§4.4) have no data behind them and are not rendered.
- **Footer "Mailing list"** link (§4.12) is hidden with the newsletter block until O6.
- **Gift card tilt by gyro** (§6.7): iOS shows a system permission prompt for motion sensors, which reads as a native dialog. Pointer tilt everywhere; gyro only where no prompt is needed.
- **JSON-LD `geo`** (§8.7): `site.json` has `geo: null` and the spec's Catskill coordinates are the town, not the building. `geo` is omitted until you give coordinates for 96 West Bridge Street.
- **Street diagram** (§6.4) must be "confirmed against a map". The builder draws it from the address and street names in `site.json`, marks it `TODO(Theo): confirm layout`, and it does not ship to production until you confirm.
- **"Pick one for me"** (§6.2, stretch) needs a mapping the data does not hold (`Crisp` → Light, `Tart` → Sour, `Lighter` = under 5.5%). Not built until you confirm the mapping.
- **Privacy page copy** is not in `content/`. The builder writes plain factual sentences from §6.7 and §8.8 into `site.json → privacy` for you to read.

---

## 2. Where I think the spec is wrong

Not changed in the spec. Listed so you can decide.

1. **The 110 KB budget** (Q3). Unreachable on the named framework.
2. **Strict CSP with static pages** (Q4). The two cannot both be had as written.
3. **Color values** (Q5). Ember and sky fail the spec's own test on paper.
4. **"latin-ext is needed for Märzen and ¡"** (§8.1). It is not; both are in `latin`.
5. **§4.8 still says "On the malthouse page it is paired with the map."** There is no such page (O10). Read as "on `/beer`".
6. **Malting is still present in shipped material**, against O10 and `CLAUDE.md` rule 5:
   - `site.json → brewery.paragraphs[2]` ends "…the refinement of technique in our malting and brewing processes over time." §6.5 mentions only the edit to paragraph 2. Plan: publish paragraphs 1 and 2 only and leave `TODO(Max)` for the third (suggested wording for Max: "…refinement of technique in our brewing over time.").
   - Everything in `public/` is served. `public/brand/wordmark-legacy.webp` and `lockup-legacy.webp` read "MALTING | BREWING"; `public/photos/malt-raking.webp` is the malting floor. Plan (M0): move all three, and `barley-mark-legacy.webp`, to `docs/source/legacy/`.
   - `public/photos/malt-in-hands.webp` puts "malt" in a public URL. Plan (M0): rename to `grain-in-hands.webp`.
   - The Facebook URL is `facebook.com/subversivemaltnbrew`. It cannot be changed from here; the link text is "Facebook". Max may want to rename the page.
7. **Event slugs and past events** (Q14, Q15). The stated behaviour needs feed fields that do not exist yet.
8. **§5.3 hero pour and LCP.** The hero photo is preloaded but revealed over 1100 ms. If the browser counts the photo as the LCP element at the end of the pour, Home misses 1.8 s. Plan: reveal with `clip-path` only (the image is painted in the first frame, never `opacity: 0`), and M6 measures; if LCP still lands late the pour shortens to 600 ms.
9. **§3.8 grain as a fixed `mix-blend-mode` layer** can cost scroll frame rate on low-end Android, against §2.5. Measured in M1; the fallback is a pre-tinted transparent tile with no blend mode.
10. **§8.6 "last good response if cached"** is not something our code controls on Vercel; it depends on Next keeping a stale cache entry when a refresh throws. M5 has a test for it; if Next drops the entry, the fallback is the seed file.
11. **§6.4 "four outlined boxes with a custom icon each"** is the "icon-heading-blurb feature row" that §3A lists as a tell of a generated site. Plan builds it as one ruled ledger of four rows (label, the site's sentence), icon in the label column only. Say if you want the boxes.

---

## 3. Decisions

**Radix, not React Aria.** Radix primitives are small and imported one at a time (`radix-ui` 1.8, tree-shaken), and our JS allowance on `/menu` is about 30 KB above the framework. React Aria Components pulls in its state and internationalisation layers with the first component and would use most of that allowance alone. Radix exposes state as `data-` attributes, which suits Tailwind, and its `asChild` and `forceMount` props let Motion own enter and exit animation for the mobile menu and gate. We need only Dialog (mobile menu, gate), RadioGroup (segmented control), ToggleGroup (chips), DropdownMenu (add to calendar), Toast and VisuallyHidden. Menu rows are `<details>` (Q20). React Aria's better press handling on touch is the cost; our pressed states are CSS `:active` plus Motion's tap, which is enough.

**Biome, not ESLint + Prettier.** One binary, one config file, formatter and linter in about a second, including accessibility and import-order rules. Next 16 removed `next lint` and its own scaffold offers Biome. Three house rules are not lint rules in either tool (the banned easing keywords, hex values outside `tokens.css`, `vh` units), so they live in `scripts/check-style.ts`, a 60-line scan run by `pnpm lint` and CI.

**View Transitions wipe.** React 19.3's `<ViewTransition>` works in Next 16.4 with no flag; navigations are transitions, so it fires on every `<Link>`. Each `page.tsx` wraps its content in `<PageWipe>` (a `<ViewTransition>` with `exit` and `enter` class maps keyed by transition type; it must be in the page, not the layout, because layouts never exit). Our `<Link>` wrapper passes `transitionTypes={["nav-forward"]}`. CSS in `globals.css`: `::view-transition-new(.wipe)` has no animation and sits beneath; `::view-transition-old(.wipe)` sits on top and animates `clip-path` from the full rectangle to a zero-area polygon at the upper right along the 61° slash, 420 ms, `--ease-in-out`. Browser back and forward carry no type, so the default (untyped) class is the mirrored wipe toward the lower left: that gives "back/forward reverse the direction" with no history bookkeeping. The header has `view-transition-name: site-header` so it holds still; tickets and the event hero share `event-<id>`; the segmented thumb is a Motion layout animation, not a view transition. Under `prefers-reduced-motion: reduce` all `::view-transition-*` animations are set to `none`. Browsers without the API navigate instantly.

**Age-gate bootstrap without a flash.** The root layout renders, as the first children of `<body>`, an empty `<div id="sv-gate" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />` followed by a synchronous inline `<script>` (source in `src/components/gate/gate-bootstrap.ts`, minified to a string at build, under 1.5 KB). The script runs during HTML parsing, before first paint: it reads the `sv_age` cookie and `localStorage["sv.age"]`; if there is a valid answer (Yes, or Not yet under 24 h old) it does nothing. Otherwise it sets `data-gate="ask"` on `<html>` and fills `#sv-gate` with the static first frame: the question as an `<h1>`, the Yes and Not yet buttons, `role="dialog" aria-modal="true"`. The styles for `#sv-gate` are in the main stylesheet (`display: none` by default; `html[data-gate="ask"] #sv-gate` is a fixed, opaque, full-`dvh` Overtime layer at the top z-index, and `html[data-gate="ask"]` locks scroll), so the overlay is in the first painted frame and the page is never visible under it. The page HTML underneath is untouched and not hidden, so crawlers and link previews read the real page. The script wires both buttons itself, focuses Yes and keeps Tab between the two, so the gate answers before React hydrates. A small client leaf in the layout (`GateLoader`) reads `data-gate` after hydration; only if it is `"ask"` does it set `inert` on the site wrapper and dynamically import the gate chunk (barley draw, goblin, wipe). If Yes is tapped before the chunk arrives, the script records the tap on `window.__svGate` and the chunk plays the sequence when it lands; if it has not landed in 1500 ms the script stores the answer and removes the overlay, so the gate can never trap anyone. Returning visitors pay for the inline script only. The cookie is written by the script, never read on the server, so pages stay static.

**NY State outline.** `scripts/build-ny-map.ts`, run by `pnpm gen` and checked in CI. Source: the US Census cartographic boundary for New York (public domain) at 1:20m, extracted once from the `us-atlas` npm package (`states-10m.json`, FIPS 36) by `scripts/extract-ny.ts` and committed as `scripts/data/ny-state.geo.json` with a provenance note, so builds never touch the network. The build script, with no map library: keeps polygons above an area threshold (mainland and Long Island; small islands dropped), projects with a hand-written Albers equal-area conic (standard parallels 41° and 44.5°, centre −75.8°, 42.9°), fits to a `0 0 1000 H` viewBox with 20 units of padding, simplifies with Visvalingam until the path string is under 4 KB, rounds to integers, and writes `src/components/graphics/ny-map.generated.ts` exporting `viewBox`, `path` and the six places projected through the same function (`{ id, label, x, y, kind: "taproom" | "source" | "origin" }`). The generated file is committed; CI runs `pnpm gen && git diff --exit-code` so it cannot drift.

---

## 4. Conventions for every milestone

**Commands** (defined in M0): `pnpm dev` · `pnpm gen` (map, grain, icon sprite, gate bootstrap string) · `pnpm typecheck` · `pnpm lint` (Biome + `check-style`) · `pnpm test` (Vitest: unit and component) · `pnpm build` · `pnpm e2e` · `pnpm e2e:visual` · `pnpm lhci`. "All green" below means every one of these exits 0.

**Skins.** `data-skin="paper" | "overtime"` on any element; `tokens.css` maps the semantic tokens under each. `<main>` on `/events`, `/events/[slug]` and `/bands` is Overtime; the footer and gate always are.

**Rendering.** Every page is static with `export const revalidate = 300` (events, home, visit) or `3600` (menu, beer). Nothing reads cookies or headers on the server. Anything that depends on "now" in the browser (open pill, today highlight, countdown, Overtime switch) is a client leaf that receives plain data as props and uses `lib/` pure functions with `new Date()` passed in.

**Copy.** Strings come from `content/*.json` or the §7.1 microcopy list, which lives in `content/microcopy.ts` as one typed object. No sentence is typed into JSX.

**Tests.** Unit: `tests/unit/**/*.test.ts`. Component: `tests/component/**/*.test.tsx` (Testing Library, happy-dom). E2E: `tests/e2e/*.spec.ts`. Visual: `tests/visual/*.spec.ts`. The e2e clock is frozen with `page.clock.install({ time })`; server time is fixed with the env var `SV_TEST_NOW` (ISO instant), read in exactly one place, `src/lib/time/now.ts`, and ignored unless `NODE_ENV !== "production"` or `SV_E2E=1`.

**Screenshots for the review loop (§3A).** `tests/visual/review.spec.ts` takes, for each route a milestone changed: 390 × 844 first screen, 390 full page, 1280 × 800 first screen, 1280 full page; in the route's own skin and, for kit pages, in both skins. Files: `docs/review/M<n>/<before|after>-<route>-<width>-<skin>-<first|full>.png`. "Before" is taken when the milestone first works; "after" follows the five-fault fix and the subtraction pass. The commit message lists the faults, the removals, and the three-part audit (computed, estimated, not verifiable without a person).

**People.** The O-items are never marked decided. Where one applies, the milestone says what to build meanwhile.

---

## 5. `src/lib` contracts

Pure TypeScript, no React, no `Date.now()` except in `time/now.ts`. Types shown are the public surface.

### 5.1 `lib/time`

```ts
// ny.ts — the only file that touches Intl time zones
export const NY_TZ = "America/New_York";
export type IsoDate = string & { __brand: "IsoDate" };   // "2026-11-13"
export type HHmm    = string & { __brand: "HHmm" };      // "16:30", 24 h
export type Minutes = number;                            // minutes after 00:00 NY wall time on a given date; may exceed 1440
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export const WEEKDAYS: readonly Weekday[];               // mon-first

export interface NyParts { date: IsoDate; weekday: Weekday; minutes: Minutes; offsetMinutes: -300 | -240; }

export function isIsoDate(s: string): s is IsoDate;
export function isHHmm(s: string): s is HHmm;
export function nyParts(instant: Date): NyParts;                 // wall clock in New York
export function weekdayOf(date: IsoDate): Weekday;               // calendar math only
export function addDays(date: IsoDate, n: number): IsoDate;
export function diffDays(a: IsoDate, b: IsoDate): number;        // b − a
export function toMinutes(t: HHmm): Minutes;
export function fromMinutes(m: Minutes): HHmm;                   // wraps past 1440
export function nyInstant(date: IsoDate, at: Minutes): Date;     // wall time → instant; minutes ≥ 1440 roll to the next date
export function isoWithOffset(date: IsoDate, at: Minutes): string; // "2026-11-13T19:00:00-05:00"

// now.ts
export function now(): Date;                                     // new Date(), or SV_TEST_NOW in test builds
```

`nyInstant` rules: a wall time that does not exist (02:30 on 2027-03-14) resolves to the instant one hour later; a wall time that occurs twice (01:30 on 2026-11-01) resolves to the first.

### 5.2 `lib/site`

Not in the spec's tree, but `site.json` is external data and must be validated.

```ts
// schema.ts (Zod) → Site
export interface DayHours { open: HHmm; close: HHmm; kitchenClose: HHmm; }
export type WeeklyHours = Record<Weekday, DayHours | null>;
export interface SourcingRow { what: string; who: string; where: string; }
export interface Site {
  name: string; legalOrLongName: string; descriptor: string; timezone: "America/New_York";
  address: { street: string; city: string; state: string; zip: string; geo: { lat: number; lng: number } | null };
  phone: { display: string; tel: string; note: string };
  email: string;
  links: { order: string; eGiftCard: string; map: string; instagram: string; facebook: string; bandBookingForm: string };
  hours: WeeklyHours;
  visit: { seating: string; tent: string; parking: string; dogs: string; giftCards: string };
  sourcing: SourcingRow[];
  about: { founders: string[]; paragraphs: string[] };
  brewery: { paragraphs: string[] };
  bands: string;
  privacy?: string[];          // added in M8
}
// site.ts
export function getSite(): Site;   // parses content/site.json once; throws (fails the build) if invalid; never returns _archived or _meta
```

### 5.3 `lib/hours`

```ts
// schedule.ts
export interface DaySchedule {
  date: IsoDate; weekday: Weekday;
  closed: boolean;
  open: Minutes | null; close: Minutes | null; kitchenClose: Minutes | null;   // null when closed
  reason?:
    | { type: "weekly" }                                             // regular closed day
    | { type: "closure"; title: string }                             // event with closed: true
    | { type: "late"; title: string; eventId: string; kind: EventKind; startTime: HHmm | null };
}
export function scheduleFor(date: IsoDate, site: Pick<Site, "hours">, events: readonly HoursEvent[]): DaySchedule;
export interface SpecialRow { date: IsoDate; label: string; schedule: DaySchedule; }   // "Wed Nov 25 · open late for Knicks"
export function specialHours(from: IsoDate, days: number, site: Pick<Site, "hours">, events: readonly HoursEvent[]): SpecialRow[];
export interface NextOpening { date: IsoDate; weekday: Weekday; open: Minutes; }
export function nextOpening(after: Date, site: Pick<Site, "hours">, events: readonly HoursEvent[], maxDays?: number /* 14 */): NextOpening | null;

// The slice of an event that hours logic needs; SiteEvent satisfies it.
export interface HoursEvent { id: string; date: IsoDate; title: string; displayTitle: string; kind: EventKind; closed: boolean; startTime: HHmm | null; endTime: HHmm | null; }

// status.ts
export type OpenStatus =
  | { kind: "open";              closes: Minutes; kitchenCloses: Minutes | null }   // kitchenCloses null when equal to closes
  | { kind: "open-late";         closes: Minutes; kitchenCloses: Minutes | null; label: string; starts: HHmm }
  | { kind: "kitchen-closed";    closes: Minutes }
  | { kind: "opens-later";       opens: Minutes }
  | { kind: "closed-for-day";    next: NextOpening | null }
  | { kind: "closed-weekday";    weekday: Weekday; next: NextOpening | null }
  | { kind: "closed-special";    title: string; next: NextOpening | null };
export function statusAt(instant: Date, site: Pick<Site, "hours">, events: readonly HoursEvent[]): OpenStatus;

// format.ts
export function formatTime(t: HHmm | Minutes): string;     // hours of operation: "16:30"→"4:30", "20:00"→"8", "12:00"→"12", "11:00"→"11 AM", 1470→"12:30 AM"
export function formatClock(t: HHmm | Minutes): string;    // event starts: "19:00"→"7:00", "18:30"→"6:30"
export function formatRange(open: Minutes, close: Minutes): string;                 // "4:30–8" (en dash)
export function weekdayLabel(w: Weekday, form: "short" | "long" | "plural"): string; // "Sat" | "Saturday" | "Saturdays"
export function formatDateShort(d: IsoDate): string;       // "Wed Nov 25"
export interface StatusLine { dot: "go" | "hollow" | "amber"; text: string; muted?: string; }
export function formatStatus(s: OpenStatus): StatusLine;   // the exact strings of spec §4.2
```

Rules `scheduleFor` implements (§8.5, Q12, Q13):

1. Start from `site.hours[weekday]`; `null` → `closed: true, reason: { type: "weekly" }`.
2. Any event that date with `closed: true` → closed, `reason: { type: "closure", title }`. This beats everything.
3. Otherwise take the non-closure event with the latest `endTime`. An `endTime` earlier than its `startTime` means it ends after midnight: add 1440. If that end is later than `close`, `close` becomes it and `reason` is `late`. `kitchenClose` and `open` never change. A weekly-closed day stays closed.
4. `AM` is added only before noon; nothing ever prints `PM`.

`statusAt`: get `nyParts(instant)`; first check yesterday's schedule (if its `close` exceeds 1440 and now + 1440 is before it, yesterday is still running); then today's, in the order of Q12. `formatStatus` output, one per state:

| State | `text` | `muted` |
| --- | --- | --- |
| open | `Open now · til 8:30` | `· kitchen til 8:15` (only when kitchen closes earlier) |
| open-late | `Open late tonight · Knicks at 7:00` (`label` is the display title's first word for games) | none |
| kitchen-closed | `Bar open til 8:30 · kitchen closed` | none |
| opens-later | `Opens today at 4:30` | none |
| closed-for-day | `Closed now · opens Sat at 12` | none |
| closed-weekday | `Closed Tuesdays · back Wed at 4:30` | none |
| closed-special | `Closed today · {title}` | none |

When `next` is `null` (nothing opens within 14 days) the text stops before the `·`.

### 5.4 `lib/events`

```ts
// schema.ts (Zod)
export type EventKind = "GAME" | "MUSIC" | "FESTIVAL" | "OTHER" | "HOLIDAY" | "CLOSURE";
export interface FeedEvent {
  id: string; date: IsoDate; title: string;
  kind: EventKind;                       // unknown strings parse to "OTHER"; the raw value is kept in kindRaw
  kindRaw: string;
  closed: boolean;
  startTime: HHmm | null; endTime: HHmm | null;     // missing or "" → null
  description: string;                               // missing → ""
  // tolerated if present (§6.3 request list), otherwise undefined:
  slug?: string; imageUrl?: string; imageAlt?: string; ticketUrl?: string; rsvpUrl?: string;
  priceLabel?: string; kitchenCloseOverride?: HHmm; barCloseOverride?: HHmm; featured?: boolean; updatedAt?: string;
}
export interface Feed { timezone: "America/New_York"; events: FeedEvent[]; }
export function parseFeed(json: unknown): Feed;      // throws if the envelope is wrong; drops and logs individual bad events

// classify.ts
export type EventCategory = "games" | "music" | "trivia-movies" | "festivals" | "other" | "notice";
export function classify(e: FeedEvent): EventCategory;     // HOLIDAY/CLOSURE → "notice"; OTHER by title keyword: /trivia|movie/i → "trivia-movies"
export function normalizeTitle(title: string): string;     // lowercase, strip punctuation and trailing dates/numbers
export interface Series { key: string; eventIds: string[]; cadence: "weekly" | "every-other-week" | null; weekday: Weekday; }
export function detectSeries(events: readonly SiteEvent[]): Series[];   // ≥ 3 upcoming with the same normalized title; cadence only if every gap is exactly 7 or 14 days
export function seriesLabel(s: Series): string | null;     // "+ every other Thursday" | "+ every Thursday" | null

// matchup.ts
export interface Matchup { venue: "at" | "vs"; opponent: string; code: string; label: string; }   // label "Knicks at Pacers"
export function parseMatchup(title: string): Matchup | null;      // /Knicks (at|vs\.?) (.+)$/i
export const TEAM_CODES: Readonly<Record<string, string>>;         // 29 nicknames + common short forms → code
export function teamCode(opponent: string): string;                // table, else first three letters uppercased
export type GamePhase = "before" | "live" | "final";
export function gamePhase(e: SiteEvent, at: Date): GamePhase;
export function countdownLabel(e: SiteEvent, at: Date): string;    // "Tip in 2h 14m" | "Tip in 14m" | "On now" | "Final"
export function matchupSpeech(e: SiteEvent): string;               // "Knicks at Pacers, tipoff 7 PM"

// slug.ts
export function kebab(s: string): string;                          // strip diacritics, lowercase, non-alphanumerics → "-", collapse, trim, max 60 chars
export function eventSlug(e: FeedEvent): string;                   // e.slug ?? `${date}-${kebab(title)}`
export function parseSlug(slug: string): { date: IsoDate; rest: string } | null;
export type SlugResolution =
  | { type: "found"; event: SiteEvent }
  | { type: "redirect"; slug: string }
  | { type: "over"; date: IsoDate }        // well-formed, date in the past, event no longer in the feed
  | { type: "missing" };
export function resolveSlug(slug: string, events: readonly SiteEvent[], today: IsoDate): SlugResolution;

// enrich.ts
export interface SiteEvent extends FeedEvent {
  category: EventCategory; slug: string; matchup: Matchup | null;
  displayTitle: string;                    // matchup?.label ?? title
  startsAt: string | null; endsAt: string | null;     // ISO with offset; endsAt rolls past midnight
}
export function enrich(e: FeedEvent): SiteEvent;

// source.ts
export interface EventsSource { fetch(): Promise<Feed>; }          // throws on any failure
export type EventsOrigin = "ops" | "seed";
export interface EventsResult { events: SiteEvent[]; origin: EventsOrigin; }
export function getEvents(): Promise<EventsResult>;                // ops, else seed; enriched; sorted by date then startTime; never throws
export function upcoming(events: readonly SiteEvent[], today: IsoDate): SiteEvent[];     // date ≥ today
export function tickets(events: readonly SiteEvent[]): SiteEvent[];                      // category !== "notice"
// ops.ts
export const opsEventsSource: EventsSource;
// seed.ts
export const seedEventsSource: EventsSource;                       // content/events.seed.json through parseFeed

// description.ts
export type DescBlock = { type: "p"; parts: DescPart[] } | { type: "list"; items: DescPart[][] };
export type DescPart = { text: string } | { href: string; text: string };
export function renderDescription(text: string): DescBlock[];      // paragraphs on blank lines; lines that start with an emoji or bullet become list items with the marker stripped; bare URLs autolinked

// calendar.ts
export function buildIcs(e: SiteEvent, site: Site, siteUrl: string): string;      // VCALENDAR with VTIMEZONE America/New_York, UID `${id}@drinksubversive.com`, CRLF line ends, lines folded at 75 octets
export function googleCalendarUrl(e: SiteEvent, site: Site): string;

// facts.ts
export function goodToKnow(e: SiteEvent, schedule: DaySchedule): string[];        // "Kitchen til 8:15", "Bar open through the final buzzer" (GAME ending after normal close), "Free" only if /\bfree\b/i in description
```

`opsEventsSource.fetch`: `fetch(OPS_EVENTS_URL + "?days=120", { redirect: "manual", headers: { accept: "application/json" } })`; any status other than 200, any `content-type` not containing `json`, or a `parseFeed` throw is a failure. The fetch and the parse are wrapped together in one cached function (`unstable_cache(fn, ["ops-events"], { revalidate: 300, tags: ["events"] })`) so a login redirect is never cached as a good answer. `getEvents` catches the failure and uses the seed, filtered to today onward. `OPS_EVENTS_URL` defaults to `https://subversive-ops.vercel.app/api/public/events`.

### 5.5 `lib/menu`

```ts
// schema.ts (Zod) — mirrors content/menu.json exactly; unknown keys are rejected so typos fail the build
export type Tag = "vegetarian" | "vegan" | "kid-friendly" | "dog-friendly";
export interface Window { seasonal?: boolean; availableFrom?: IsoDate; availableUntil?: IsoDate; }
export interface Availability { days: Weekday[]; label: string; title?: string; }
interface ItemBase extends Window { name: string; description?: string; modifiers?: string; tags?: Tag[]; badge?: string; availability?: Availability; }
export interface BeerItem  extends ItemBase { style: string; abv: number; prices: { half: number; full: number }; color: string /* #RRGGBB */; hazy?: boolean; }
export interface PlainItem extends ItemBase { price?: number; producer?: string; origin?: string; verifyPrice?: boolean; }
export type Item = BeerItem | PlainItem;
export interface Group extends Window { title: string; note?: string; items: Item[]; }
export interface DrinkSection extends Window { id: string; title: string; note?: string; groups: Group[]; }
export interface FoodSection  extends Window { id: string; title: string; intro?: string; modifiers?: string; note?: string; items: PlainItem[]; }
export interface Menu {
  _meta: { source: string; verify: string[]; pourSizes: { half: string; full: string }; updated: IsoDate };
  drinks: DrinkSection[]; food: FoodSection[]; notices: string[];
}
export function parseMenu(json: unknown): Menu;
export function isBeer(i: Item): i is BeerItem;

// source.ts
export interface MenuSource { getMenu(): Promise<Menu>; }
export function getMenu(): Promise<Menu>;          // MENU_SOURCE=file (default) | square
// file.ts
export const fileMenuSource: MenuSource;            // imports content/menu.json, parseMenu, throws if invalid
// square.ts
export const squareMenuSource: MenuSource;          // stub: getMenu rejects with "squareMenuSource is not built (spec O3)"

// seasonal.ts
export function inWindow(x: Window, today: IsoDate): boolean;      // bounds inclusive; a missing bound is open; no window → true
export function applySeasonal(menu: Menu, today: IsoDate): Menu;   // drops items, groups, sections outside their window, then any group or section left empty

// view.ts — what components render
export type StyleFamily = "light" | "hoppy" | "malty" | "farmhouse" | "sour";
export interface ItemView { id: string; item: Item; sectionId: string; family?: StyleFamily; badge?: string; }   // badge: item.badge ?? ("Seasonal" if item.seasonal)
export interface SectionView { id: string; chip: string; title: string; note?: string; intro?: string; modifiers?: string; groups: { title?: string; note?: string; items: ItemView[] }[]; }
export interface MenuView { updated: IsoDate; pourSizes: { half: string; full: string }; drinks: SectionView[]; food: SectionView[]; notices: string[]; }
export function buildMenuView(menu: Menu): MenuView;               // ids: kebab(name); on collision `${sectionId}-${kebab(name)}`
export function draftBeers(view: MenuView): ItemView[];            // house-beer rows in menu order
export function findItem(view: MenuView, id: string): ItemView | undefined;

// features.ts
export interface FeatureGroup { title: string; label: string; days: Weekday[]; items: ItemView[]; }
export function weeklyFeatures(view: MenuView): FeatureGroup[];                    // grouped by availability.title ?? label
export function todaysFeatures(view: MenuView, weekday: Weekday): FeatureGroup[];

// filters.ts
export type DrinkFilter = StyleFamily | "under-5";
export type FoodFilter = "vegetarian" | "vegan" | "kid-friendly";
export function matchesDrink(i: ItemView, active: ReadonlySet<DrinkFilter>): boolean;
export function matchesFood(i: ItemView, active: ReadonlySet<FoodFilter>): boolean;
export function matchCount(items: readonly ItemView[], pred: (i: ItemView) => boolean): number;
export type Show = "drinks" | "food";
export function parseShow(param: string | string[] | undefined): Show;            // anything but "food" → "drinks"

// price.ts
export function formatPrice(n: number): string;              // 18 → "18", 1.5 → "1.50"
export function formatPair(half: number, full: number): string;   // "5 / 8" with U+2009 thin spaces around the slash
```

Chip labels by section id: `house-beer` Beer · `drink-specials` Specials · `other-beverages` splits into three views, Wine & cider (Wine and Hard cider groups), Cocktails, No-alcohol · `smash-burgers` + `impossible-burgers` Burgers (one chip, two sections) · `chicken-sandwiches` Chicken · `small-bites` Small bites · `salads` Salads · `sides` + `sauces` Sides & sauces · `weekly-features` This week · `seasonal-specials` Specials.

### 5.6 `lib/seo`

```ts
// metadata.ts
export function pageMetadata(o: { title: string; description: string; path: string; noindex?: boolean }): Metadata;   // "{title} · Subversive, Catskill NY", canonical from NEXT_PUBLIC_SITE_URL
// jsonld.ts
export function placeJsonLd(site: Site, siteUrl: string): object;         // @type ["Brewery","Restaurant"]; openingHoursSpecification from site.hours; geo only if present
export function menuJsonLd(view: MenuView, siteUrl: string): object;
export function eventJsonLd(e: SiteEvent, site: Site, siteUrl: string): object;
```

---

## 6. Milestones

File lists are in build order. `§` references are to `docs/SPEC.md`.

### M0. Foundation

**From a person first:** Q1, Q2 (Vercel project). Build meanwhile: everything; check on the local production build.

Files:

1. `package.json`, `pnpm-lock.yaml`, `.nvmrc` (22), `.gitignore`: scripts from §4 of this plan; dependencies `next`, `react`, `react-dom`, `motion`, `radix-ui`, `zod`, `tailwindcss`, `@tailwindcss/postcss`, `@vercel/analytics`, `@vercel/speed-insights`; dev: `typescript`, `@biomejs/biome`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `happy-dom`, `@playwright/test` (the pre-installed version, pinned to match), `@axe-core/playwright`, `@lhci/cli`, `svgo`, `us-atlas`. Reason for each dev dependency goes in the commit message. (§8.1, §9.4)
2. `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `resolveJsonModule`, paths `@/*` → `src/*`, `@content/*` → `content/*`. (§8.1)
3. `biome.json`: formatter, recommended lint, a11y rules on, `noExplicitAny` error. `scripts/check-style.ts`: fails on `ease`, `ease-in`, `ease-out`, `ease-in-out` as easing keywords (`linear` stays legal for the ticker and scroll-linked rail); on `#hex` outside `src/styles/tokens.css`, `content/` and generated files; on `vh` units (must be `svh`/`dvh`). (§2.6, §2.5, §8.3)
4. `next.config.ts`: security headers and CSP (Q4), `images.formats: ["image/avif","image/webp"]`, `experimental.sri`, empty `redirects()` (filled in M8). (§8.8)
5. Housekeeping from §2 item 6 of this plan: `git mv` the four legacy files to `docs/source/legacy/`, rename `malt-in-hands.webp` → `grain-in-hands.webp`.
6. `src/lib/time/ny.ts`, `src/lib/time/now.ts`. (§8.5; contract 5.1)
7. `src/styles/tokens.css`: raw palette, semantic tokens per skin, type scale with `clamp()`, the three named off-scale sizes, spacing `--s-1…12`, radii, strokes, shadows, motion tokens, the three rotation angles, `color-scheme` per skin, `@theme` export. (§2.1–2.6, §9.3.7, §9.3.13)
8. `src/styles/tokens.ts`: the same raw and semantic pairs as data, for the contrast test and OG images. A unit test asserts it matches `tokens.css` value for value.
9. `scripts/check-contrast.ts` + `src/lib/color/contrast.ts`: `wcagRatio(fg, bg)`, `apcaLc(fg, bg)`, `composite(fg, alpha, bg)`. (§2.1)
10. `src/styles/globals.css`: Tailwind import, base element styles, `::selection`, scrollbars, focus ring, tap-highlight removal, `text-wrap`, reduced-motion and `prefers-contrast` blocks, `forced-colors` block. `src/styles/graphics.css`: `.checker` with scroll-timeline roll and static fallback. (§3.2, §4.11, §9.2)
11. `src/app/fonts.ts`: Caprasimo 400, Barlow Condensed 600/700, Barlow 400/500/600 via `next/font/google`, `latin`, `display: "swap"`, `adjustFontFallback`, CSS variables. Preload: Caprasimo and Barlow 400 only. (§2.3, §9.1)
12. `src/app/layout.tsx`: `<html lang="en">`, font variables, viewport (`viewportFit: "cover"`, no zoom lock), skip link target. `src/app/(site)/layout.tsx`: `<Checker />` and `{children}` for now. `src/app/(site)/page.tsx`: blank Paper page. (§8.3)
13. `src/components/graphics/Checker.tsx`. (§3.2)
14. `src/app/dev/kit/page.tsx` + `src/app/dev/kit/layout.tsx`: gated by `NEXT_PUBLIC_DEV_KIT`; token swatches, type scale, spacing; skin toggle. `src/components/dev/GridOverlay.tsx`: the `?grid` construction overlay (columns, baseline, three alignment edges). (§3A review loop, §4)
15. `src/app/robots.ts` (disallow `/dev`).
16. `vitest.config.ts`, `playwright.config.ts` (projects: `iphone-15`, `iphone-se`, `ipad`, `desktop-chromium`, `desktop-webkit`; Q22), `lighthouserc.json` (budgets from §9.1 as amended by Q3), `tests/visual/review.spec.ts`.
17. `.github/workflows/ci.yml`: install, `pnpm gen && git diff --exit-code`, typecheck, lint, test, build, e2e against the build, lhci. (§9.4)

Tests:

- `tests/unit/time/ny.test.ts`: `nyParts` on a winter and a summer instant; `weekdayOf("2026-11-13") === "fri"`; `addDays` across month, year and both DST dates; `nyInstant` at 12:00 on 2026-11-01 is 17:00Z and on 2027-03-14 is 16:00Z; nonexistent 02:30 on 2027-03-14; doubled 01:30 on 2026-11-01; minutes 1470 rolls to the next date; `isoWithOffset` gives `-05:00` and `-04:00`.
- `tests/unit/tokens.contrast.test.ts`: every semantic text token on every semantic background, per skin, composited at its real opacity: WCAG ≥ 4.5 and APCA per role (body 75, larger content 60, display 45); display and UI-boundary tokens ≥ 3:1. Pair list is explicit in the test, including CTA text, pill text, sticker text on each spot color, date-block text on each kind color.
- `tests/unit/tokens.sync.test.ts`: `tokens.ts` equals `tokens.css`.
- `tests/unit/check-style.test.ts`: the scanner flags each banned pattern in a fixture and passes a clean one.
- `tests/e2e/foundation.spec.ts`: home returns 200 with no console errors and no CSP violations; no horizontal scroll at 320; checker rail present; `/dev/kit` is 404 without the env var.

**Done when:** all green; the blank Paper page with the checker rail is served from `main` (Vercel, or local build until Q2); contrast test passes, with every token it forced to change listed old → new in the commit. Screenshots: `/` and `/dev/kit` at 390 and 1280.

### M1. Graphic kit

**From a person first:** nothing. O5 (vector logos, label typeface) is open: build from the redraws in `public/brand/` and keep the display family behind one token. Ask Theo for the mid-milestone checkpoint named in `docs/PROMPTS.md`.

Files (each graphic is added to `/dev/kit` as it is built):

1. `src/components/graphics/BarleyMark.tsx`: six kernel paths exported separately, `stroke` and `solid` variants, draw-in animation bottom to top at 60 ms. Overlay check against `docs/source/legacy/barley-mark-legacy.webp` in `/dev/kit`. (§3.1)
2. `src/components/graphics/slash.ts`: the 61° angle and helpers that produce the parallelogram and clip-path polygons used everywhere. `Slash.tsx`. (§3.1)
3. `src/components/graphics/Wordmark.tsx`: `loud` (Caprasimo + ember slash) and `heritage` (monoline, from `wordmark-heritage.svg`). (§3.1)
4. `src/components/graphics/Seal.tsx`: text on a path, slow rotation, static variant. (§3.1)
5. `src/components/graphics/Chevrons.tsx` + rules in `graphics.css`. (§3.3)
6. `src/components/layout/Pill.tsx`: section pill with stamp-in, chip variant. `src/components/layout/Section.tsx`: section rhythm, grid, gutters. (§3.4, §2.4)
7. `src/components/graphics/PrintFilter.tsx`: the one shared `feTurbulence` + `feDisplacementMap` definition. `Sticker.tsx`: `burst` (28 points generated: outer 50, inner 41), `round`, `tag`, `slash`; misregistration layer; pop-in; peel. `useStickerDrag.ts`: drag, flick, session persistence, 6 px tap threshold. `Badge.tsx` (Q10). (§3.5)
8. `src/components/graphics/Ticket.tsx`: shell with perforation mask, notches, hover tear, torn variant. (§3.6)
9. `src/components/graphics/GlassGlyph.tsx`: pint in the icon stroke, tiny barley mark, `color`, `hazy`, `fill` (0–1), rise animation; sizes `glyph` and `hero`. (§4.4, §2.2)
10. `scripts/build-icons.ts` → `public/brand/icons.svg` sprite from `src/components/graphics/icons/*.svg` (14 icons); `Icon.tsx` using `<use>`. `/dev/kit` icon sheet at 3× with grid, live area and keyline. `docs/review/M1/icon-audit.md`: the written audit. (§3.9)
11. `scripts/build-grain.ts` → `public/brand/grain.png` (220 px, under 6 KB, written with Node's `zlib`, no image library); `Grain` rules in `globals.css`. (§3.8, Q9)
12. `src/components/graphics/PhotoFrame.tsx` + `content/photos.ts` (`src` as static import for size and blur, `alt`, `focal`, `credit?`, `menuItemId?`; 14 photos, no `malt-raking`). Alt text is a plain description of what is visible. (§3.7)
13. `src/components/ui/Button.tsx` (primary, secondary, icon; stamp press), `TextLink.tsx`, `ExternalLink.tsx`. (§4.3)
14. `src/components/dev/MotionSheet.tsx`: 7 ghost frames with pixel gaps labelled, plus the bezier plot; `src/lib/motion/curves.ts` (`cubicBezier(p1x,p1y,p2x,p2y)(t)`, the named curves, spring presets). (§3A.2, §2.6)
15. `svgo.config.js` (`removeViewBox: false`).

Tests:

- `tests/unit/motion/curves.test.ts`: each named curve at t = 0, 0.5, 1; overshoot of `--ease-stamp` peaks near 10%.
- `tests/unit/graphics/burst.test.ts`: 56 vertices, alternating radii 50 and 41.
- `tests/unit/graphics/slash.test.ts`: polygon corners for a given box at 61°.
- `tests/component/Sticker.test.tsx`: tap under 6 px navigates; drag over 6 px does not; keyboard Enter activates; position restored from `sessionStorage`; decorative variant has `role="img"` and a label.
- `tests/component/Icon.test.tsx`: decorative icons are `aria-hidden`; named ones carry a title.
- `tests/component/Button.test.tsx`: external links get `rel="noopener"` and the arrow; disabled state not focusable.
- `tests/visual/kit.spec.ts`: `/dev/kit` in both skins at 390 and 1280, animations disabled.
- `tests/e2e/kit.a11y.spec.ts`: axe on `/dev/kit`, both skins.

**Done when:** all green; `/dev/kit` shows every primitive in both skins with snapshots recorded; icon audit written and its fixes applied; a motion sheet exists for pill stamp, sticker pop-in and peel, glass fill, ticket tear. Review loop run; screenshots: `/dev/kit` at 390 and 1280, both skins, before and after. Grain frame-rate note (Q9) in the commit.

### M2. Shell

**From a person first:** nothing. O4 (long name) open: "Subversive" everywhere, "Subversive Brewing" only in metadata. O6 open: no mailing-list link.

Files:

1. `src/lib/site/schema.ts`, `src/lib/site/site.ts`; `content/microcopy.ts`. (contract 5.2; §7.1)
2. `src/components/ui/Link.tsx`: wraps `next/link`, adds `transitionTypes`. `src/components/layout/PageWipe.tsx`; wipe CSS in `globals.css`. (§5.5; decision in §3)
3. `src/components/layout/Header.tsx` (server) + `HeaderScroll.tsx` (client leaf: transparent → solid at 80 px, hide on scroll down) + `NavLinks.tsx`. (§4.1)
4. `src/components/layout/MobileMenu.tsx`: Radix Dialog, slash wipe from the trigger, numbered links, hours line slot, address, phone, socials. (§4.1)
5. `src/components/layout/Footer.tsx`: Overtime; fitted wordmark, three columns, seal, small print, `PauseMotion.tsx` (persisted global pause, sets `data-motion="paused"` on `<html>`), a marked empty slot for the goblin hatch. (§4.12, §9.2)
6. `src/components/visit/OpenNowSlot.tsx`: placeholder that renders nothing until M4 (no fake status).
7. `src/app/(site)/layout.tsx`: skip link, header, `<main id="content">`, footer, `PrintFilter`, analytics.
8. Stub pages, each a `PageWipe` with its real `--t-h1` title and nothing invented: `menu`, `events`, `visit`, `beer`, `about`.
9. `src/app/(site)/not-found.tsx` + `src/app/(site)/[...missing]/page.tsx` (calls `notFound()` so the 404 gets the shell): headline, subline, three buttons, draining pint; goblin slot empty until M7. `src/app/(site)/error.tsx`. `src/app/global-error.tsx`. (§5.7)
10. `src/components/ui/Toast.tsx` (Radix Toast, styled). (§4.11)

Tests:

- `tests/unit/site/schema.test.ts`: `content/site.json` parses; `_archived` is not on the returned object; a missing `hours.sat` fails.
- `tests/component/MobileMenu.test.tsx`: opens from the button, focus trapped, Escape closes, focus returns to the trigger, body scroll locked.
- `tests/component/PauseMotion.test.tsx`: toggles the attribute and persists.
- `tests/e2e/shell.spec.ts` (phone and desktop): navigate through every nav link and back; header persists; URL and `<h1>` change; unknown URL gives 404 with status 404 and three working buttons; keyboard-only pass from skip link through the nav; reduced-motion run shows no view-transition animation.
- `tests/e2e/shell.a11y.spec.ts`: axe on each stub and the 404, both menu states.
- `tests/e2e/no-malting.spec.ts`: crawls every route in the sitemap and asserts the rendered HTML, metadata and JSON-LD contain no `/malting|malthouse|malt house/i`. Kept for every later milestone.

**Done when:** all green; navigation between stubs runs the wipe forward and mirrored on back, on phone and desktop projects; keyboard and axe pass. Motion sheets for the page wipe and the mobile menu. Screenshots: `/`, `/menu` stub, 404, open mobile menu, footer; 390 and 1280.

### M3. Menu

**From a person first:** O3 open (build the file source behind `MenuSource`; Square stub rejects). O7 and Q17 open (windows as assumed). Q16 (feature titles). Max: current tap list, Cabernet price (`verifyPrice`).

Content edits (data, not spec), in the first commit of the milestone: add `_meta.updated: "2026-10-23"`; add `color` to each beer from §2.2 and `hazy: true` to Off Axis; add the October window to `drink-specials` and `seasonal-specials`; add `availability.title` (Q16).

Files:

1. `src/lib/menu/schema.ts`, `file.ts`, `square.ts`, `source.ts`, `seasonal.ts`, `view.ts`, `features.ts`, `filters.ts`, `price.ts`. (§8.4; contract 5.5)
2. `src/components/menu/GlassCell.tsx` + `MenuRow.tsx`: `<details>` row, container queries, price column, badge, tag chips, two-line clamp, deep-link open and flash. (§4.4, §6.2)
3. `src/components/menu/IntroBox.tsx`. (§4.5)
4. `src/components/menu/BurgerColumns.tsx`: the three boxed columns at tablet and up. `SauceList.tsx`: two-column definition list. (§6.2)
5. `src/components/ui/Segmented.tsx` (Radix RadioGroup + Motion layout thumb); `src/components/menu/MenuTabs.tsx`: both lists in the HTML, inactive one `hidden`, `?show=` sync, per-device memory, no-JS fallback to two stacked lists with anchor links. (§4.11, §6.2, §2.5)
6. `src/components/menu/SectionChips.tsx` (in-view selection, scroll with `scroll-margin-top`), `FilterChips.tsx` (collapsing "Filter" pill on phone, dim to 30%, `aria-live` count). (§6.2)
7. `src/components/menu/TodayFeatures.tsx`: client leaf; server renders "This week"; today's box appears after hydration. (§6.2, §8.4)
8. `src/components/menu/OrderBar.tsx` + `ShareButton.tsx` (Web Share, copy fallback, toast). (§6.2)
9. `src/components/menu/PourLine.tsx`: desktop reading-progress line with kernel anchors. (§5.4)
10. `src/components/menu/Under21Note.tsx`: the sky tag, shown when the stored age answer is "Not yet". (§5.1)
11. `src/app/(site)/menu/page.tsx`: title row with "Updated {date}", `OpenNowSlot`, tabs, sections, notices verbatim, JSON-LD slot (filled in M8). (§6.2)
12. `src/styles/print.css`. (§6.2)

Tests:

- `tests/unit/menu/schema.test.ts`: the real file parses; unknown key rejected; beer without `color` rejected; bad hex rejected; `availableFrom` after `availableUntil` rejected.
- `tests/unit/menu/seasonal.test.ts`: inside, on each bound, outside; open-ended bounds; a section emptied by item windows is dropped; on 2026-11-13 both specials sections are gone and Festbier remains.
- `tests/unit/menu/view.test.ts`: ids are unique across the menu; "The Full Hookup" and "Hot Apple Cider" collisions resolve with the section prefix; `cheap-dills` exists; families map from group titles; `Seasonal` badge derived; chip mapping per section.
- `tests/unit/menu/features.test.ts`: Wednesday → one group with the wings; Thursday → three Rodeo items; Friday → none.
- `tests/unit/menu/filters.test.ts`: each family alone; two families OR; family AND `under-5`; `under-5` excludes 5.0; vegan matches Vegetarian; `parseShow` for `food`, `drinks`, junk, array.
- `tests/unit/menu/price.test.ts`: `18`, `1.50`, `5 / 8` with thin spaces.
- `tests/component/MenuRow.test.tsx`: closed by default; opens on click and on Enter; long description clamped until open; price and name in the summary; one badge at most.
- `tests/component/Segmented.test.tsx`: arrow keys move selection; roving tabindex; `aria-checked`.
- `tests/component/FilterChips.test.tsx`: toggling dims non-matches and announces "4 beers match".
- `tests/e2e/menu.spec.ts`: `/menu` shows drinks; `?show=food` shows food; the tab survives reload; chip tap lands the section heading below the sticky stack; filter count; `/menu#cheap-dills` opens the row and scrolls it into view; order bar appears after the first section and links to the Square URL with `rel="noopener"`; share falls back to copy with a toast; with JavaScript disabled both lists are visible and rows open; Mushroom & Swiss shows `20`.
- `tests/e2e/menu.print.spec.ts`: print media hides nav, photos and bars.
- `tests/e2e/menu.a11y.spec.ts`: axe on both tabs, filter open and closed.
- `tests/visual/menu.spec.ts`: both tabs at 390 and 1280.

**Done when:** all green; on the `iphone-15` project the price of a Mushroom & Swiss is on screen within two taps from `/` (Menu → Food), which is the scripted stand-in for "a stranger finds it in under 10 s"; Theo does the real stranger test. JS for `/menu` is within the Q3 allowance. Review loop; screenshots: `/menu` and `/menu?show=food` at 390 and 1280, first screen and full; one with a row open and filters on.

### M4. Hours and Visit

**From a person first:** O2 open (hours as in `site.json`). Street layout confirmation and building coordinates (smaller assumptions). O9 open: nothing is blocked.

Files:

1. `src/lib/hours/schedule.ts`, `status.ts`, `format.ts`. (§8.5, §4.2; contract 5.3) Until M5 the events argument comes from `content/events.seed.json` through a minimal typed read; M5 swaps in `getEvents()` with no change to the hours code.
2. `src/components/visit/OpenNow.tsx`: server renders the status at revalidation time; `OpenNowLive.tsx` client leaf recomputes every 30 s and on `visibilitychange` from props `{ hours, events (next 15 days, HoursEvent only) }`; links to `/visit#hours`. Replaces `OpenNowSlot` in header menu, footer, menu page. (§4.2)
3. `src/components/visit/HoursCard.tsx`: `<table>` with caption, today marker (client leaf for the highlight), special rows for 14 days. (§4.9)
4. `src/components/visit/AddressBlock.tsx` + `DirectionsButton.tsx` (server href is the Google Maps URL; client swaps to Apple Maps on Apple devices) + call button with the note. (§6.4)
5. `src/components/visit/GoodToKnow.tsx`: the four facts in the site's words (§2 item 11). (§6.4)
6. `src/components/visit/StreetDiagram.tsx`: schematic SVG, flagged `TODO(Theo)`, rendered only when `NEXT_PUBLIC_DEV_KIT=1` until confirmed. (§6.4)
7. `src/app/(site)/visit/page.tsx`: title "Find us", pill, hours, address, facts, photo pair and full-bleed tent photo, gift cards and contact anchors. (§6.4)
8. `src/lib/seo/jsonld.ts` (`placeJsonLd`) and its `<script type="application/ld+json">` in the site layout. (§8.7)

Tests:

- `tests/unit/hours/schedule.test.ts` (table-driven): every weekday from `site.json`; Tuesday closed with `weekly`; Fri 2026-11-13 with the seed → close 21:30, kitchen 20:15, reason `late`; Sun 2026-11-15 → close 20:30 (normal 18:30); Thu 2026-12-10 trivia → close 20:30; event ending before close → unchanged; two events, later one wins; closure event beats a game the same day; event on a Tuesday → still closed; event ending `00:30` → close 1470; `specialHours` for 14 days from 2026-11-13 lists exactly the dated rows.
- `tests/unit/hours/status.test.ts` (table-driven, instants given as NY wall time):

  | Instant | Fixture | Expected text |
  | --- | --- | --- |
  | Mon 2026-11-16 17:00 | seed | `Open now · til 8` |
  | Fri 2026-11-20 17:00 | seed | `Open now · til 8:30` + `· kitchen til 8:15` |
  | Fri 2026-11-20 20:20 | seed | `Bar open til 8:30 · kitchen closed` |
  | Fri 2026-11-13 15:00 | seed | `Opens today at 4:30` |
  | Fri 2026-11-13 17:00 | seed | `Open late tonight · Knicks at 7:00` |
  | Fri 2026-11-13 20:20 | seed | `Bar open til 9:30 · kitchen closed` |
  | Fri 2026-11-13 21:45 | seed | `Closed now · opens Sat at 12` |
  | Sat 2026-11-14 09:00 | seed | `Opens today at 12` |
  | Sun 2026-11-15 13:00 | seed | `Open late tonight · Knicks at 6:00` |
  | Mon 2026-11-16 21:00 | seed | `Closed now · opens Wed at 4:30` |
  | Tue 2026-11-17 12:00 | seed | `Closed Tuesdays · back Wed at 4:30` |
  | Thu 2026-11-26 12:00 | + closure "Thanksgiving" | `Closed today · Thanksgiving` |
  | Wed 2026-11-25 22:30 | + closure Thu | `Closed now · opens Fri at 4:30` |
  | Sun 00:10 after a Sat event ending 00:30 | custom | `Bar open til 12:30 AM · kitchen closed` |
  | Sun 2026-11-01 12:30 (DST ends) | none | `Open now · til 6:30` + kitchen `6:15` |
  | Sun 2027-03-14 12:30 (DST starts) | none | same |
  | any | closures for 15 straight days | `Closed today · {title}` with no "opens" part |

  Plus boundaries: exactly at open is open; exactly at kitchen close is kitchen-closed; exactly at close is closed.
- `tests/unit/hours/format.test.ts`: `16:30`→`4:30`, `20:00`→`8`, `12:00`→`12`, `11:00`→`11 AM`, 1470→`12:30 AM`; `formatClock`; `formatRange` uses an en dash; weekday forms.
- `tests/component/OpenNow.test.tsx`: each `StatusLine` renders the right dot and both text parts; re-computes when the fake clock advances 30 s past closing; re-computes on `visibilitychange`.
- `tests/component/HoursCard.test.tsx`: seven rows, today marked, Tuesday "Closed", kitchen figure only when it differs, special rows inserted in date order.
- `tests/unit/seo/place-jsonld.test.ts`: opening hours match `site.json` for each day; Tuesday absent; no `geo` while null.
- `tests/e2e/open-now.spec.ts`: frozen-clock matrix (browser and server clock both set) for open, before open, after close, Tuesday, game night; the pill links to `/visit#hours`.
- `tests/e2e/visit.spec.ts`: `tel:` href, maps href, `mailto:` on "Email us" and the address never printed as text; `#hours` and `#contact` anchors clear the sticky header.
- `tests/e2e/visit.a11y.spec.ts`; `tests/visual/visit.spec.ts`.

**Done when:** all green, including the frozen-clock matrix; `placeJsonLd` output passes the Schema.org validator (paste the JSON from the unit snapshot; record the result in the commit). Review loop; screenshots: `/visit` at 390 and 1280, and the pill in each of the seven states on `/dev/kit`.

### M5. Events

**From a person first:** O1 (Ops endpoint behind login). Build on the seed through the same adapter; the live feed takes over with no code change when O1 is fixed. Q7, Q14, Q15.

Files:

1. `src/lib/events/schema.ts`, `classify.ts`, `matchup.ts`, `slug.ts`, `enrich.ts`, `seed.ts`, `ops.ts`, `source.ts`, `description.ts`, `calendar.ts`, `facts.ts`. (§8.6, §6.3, §4.7; contract 5.4) Swap M4's seed read for `getEvents()`.
2. `src/app/api/revalidate/route.ts`: `POST` with `x-revalidate-secret`; calls `revalidateTag("events", "max")`; 401 otherwise. (§8.6)
3. `src/app/api/events/[id]/ics/route.ts`: `text/calendar`, attachment filename from the slug; 404 for unknown ids. (§6.3)
4. `src/components/events/Countdown.tsx` (client leaf), `Matchup.tsx` (slash split, codes, AT/VS stamp, no logos), `EventTicket.tsx` (date block color by category, "Tonight" burst, mini matchup, series helper text, `view-transition-name`), `NoticeRow.tsx`, `EmptyTicket.tsx`. (§4.6, §4.7, §5.7)
5. `src/components/events/Ticker.tsx`: real links, duplicated once `aria-hidden`, 40 px/s, pauses on hover, focus, offscreen and global pause; static list for reduced motion. (§4.10)
6. `src/components/events/EventFilters.tsx` (chips; filtering is client-side over server-rendered tickets, `hidden` on non-matches), `EventList.tsx` (month groups, sticky month label, today pinned). (§6.3)
7. `src/components/events/AddToCalendar.tsx` (Radix DropdownMenu: Apple/Outlook `.ics`, Google URL), `EventDescription.tsx`, `GoodToKnowRow.tsx`, `PrevNext.tsx`, `OverStamp.tsx`. (§6.3)
8. `src/app/(site)/events/page.tsx`: Overtime, `firepit-beers` header at `40svh`, "What's on", ticker, filters, list, band band. (§6.3)
9. `src/app/(site)/events/[slug]/page.tsx`: `resolveSlug` → page, 308, "over" page or 404; torn hero ticket; matchup or kind band with seal; description; facts; actions; previous/next; `noindex` when over 30 days past. `generateStaticParams` from upcoming events. (§6.3, §3.6)
10. `docs/ops-feed-requests.md`: the field list from §6.3 plus `pastDays` and a stable `slug`, written for Theo to take to the Ops session. Nothing in Ops is touched.

Tests:

- `tests/unit/events/schema.test.ts`: the seed parses; wrong timezone or missing `events` throws; one bad event is dropped and the rest kept; unknown `kind` becomes `OTHER` with `kindRaw` kept; missing times become `null`; extra future fields pass through.
- `tests/unit/events/classify.test.ts`: each kind; OTHER + "Trivia with Smarty Pints" → `trivia-movies`; "Free Movie Night" → `trivia-movies`; "First Friday" → `other`; HOLIDAY and CLOSURE → `notice`; `detectSeries` with three fortnightly Thursdays → `every-other-week`; irregular gaps → `null`; two events → no series.
- `tests/unit/events/matchup.test.ts`: "Subversive Overtime: Knicks at Pacers" → at, IND; "Knicks vs. Blazers" → vs, POR; "vs" without the dot; all 29 codes; unknown opponent → first three letters; non-game title → `null`; `gamePhase` before, during, after; `countdownLabel` `Tip in 2h 14m`, `Tip in 14m`, `On now`, `Final`; `matchupSpeech`.
- `tests/unit/events/slug.test.ts`: seed slugs (e.g. `2026-11-13-subversive-overtime-knicks-at-pacers`); diacritics and punctuation; 60-char cap; feed `slug` wins; `resolveSlug` found, redirect after a title edit (single event that date), ambiguous date → missing, past and gone → over, malformed → missing.
- `tests/unit/events/source.test.ts` (fetch mocked): 200 JSON → `origin: "ops"`; 307 to `/login`, 200 HTML, 500, invalid body, network error → each `origin: "seed"`; seed filtered to today onward; sorted by date then time.
- `tests/unit/events/description.test.ts`: paragraphs; emoji-led lines become a list without the emoji; URL autolink; plain text untouched.
- `tests/unit/events/calendar.test.ts`: CRLF, folded lines, `DTSTART;TZID=America/New_York`, end after midnight lands on the next date, escaped commas; Google URL dates in UTC.
- `tests/unit/events/facts.test.ts`: game ending after close gives both lines; "Free" only when the description says so.
- `tests/component/EventTicket.test.tsx`: one link wraps the card; date block text; "Tonight" only for today; accessible name reads date, title, time.
- `tests/component/Ticker.test.tsx`: duplicate is `aria-hidden`; reduced motion renders the static list.
- `tests/e2e/events.spec.ts`: list → ticket → event page; filter chips; `.ics` download has the right filename and `text/calendar`; old-title slug redirects; past slug shows "This one's over"; empty feed shows the blank ticket; closure renders as a notice row, not a ticket.
- `tests/e2e/events.fallback.spec.ts`: with `OPS_EVENTS_URL` pointed at a local mock that returns a login redirect, the page shows seed events and no error; switch the mock to a valid feed, hit `/api/revalidate` with the secret, the page shows the mock's events; switch back to failing and confirm whether the last good list or the seed is shown (records the answer to §2 item 10).
- `tests/e2e/events.a11y.spec.ts`; `tests/visual/events.spec.ts` (clock frozen at Fri 2026-11-13 17:00 NY).

**Done when:** all green on the seed; pointing `OPS_EVENTS_URL` at a mock that serves the documented shape works with no code change (the fallback spec proves it). Motion sheets for ticket tear and ticker. Review loop; screenshots: `/events` and one game event page and one non-game event page, 390 and 1280, Overtime.

### M6. Home

**From a person first:** Q18, Q19; O8 (coordinates and Indian Ladder's town, as written until verified); Max: dish names for the kitchen photos. Ask Theo for the mid-milestone checkpoint.

Files:

1. `scripts/extract-ny.ts`, `scripts/data/ny-state.geo.json` + `scripts/data/README.md` (source, date, license), `scripts/build-ny-map.ts`, `src/components/graphics/ny-map.generated.ts`, `src/components/graphics/NyMap.tsx` (lines draw toward Catskill on scroll; labels in Utility; `role="img"` with a title listing the places). (§6.1.7; decision in §3)
2. `src/components/visit/SourcingLedger.tsx`. (§4.8)
3. `src/components/home/HeroPour.tsx`: hero-size glass outline, rising clip-path with the foam band, morph to the photo frame, once per session, parallax 0.9× capped at 24 px. (§5.3, §5.4)
4. `src/components/home/HeroStickers.tsx`: next-event burst (link) and the weekday fact tag (`Wing Wednesday` on Wed, `Rodeo Thursdays` on Thu, `Dogs welcome in the tent` otherwise; strings from `content/microcopy.ts`); draggable within the hero. (§6.1.2, §3.5)
5. `src/components/home/Hero.tsx`: pill, hand-broken headline `Beer. / Burgers. / Catskill.`, subline from `site.descriptor` and address, two buttons; desktop 7/5 split with the baseline aligned to the frame bottom. `OvertimeSwitch.tsx`: client leaf that sets `data-skin="overtime"` on the hero when a GAME is live or within 3 h, swaps in `firepit-beers` and the matchup; token cross-fade via registered `@property` colors, 600 ms. (§6.1.2, §5.6)
6. `src/components/home/OnTap.tsx` (first eight `draftBeers`, Q18), `KitchenStrip.tsx` (snap row, captions per Q19, burger intro box), `ComingUp.tsx` (three tickets), `WhereFrom.tsx` (spruce field, chevrons, ledger, map, the one sentence from the old site held in `site.json → sourcingLine`, added in this milestone), `VisitBand.tsx` (hours card, address, four chips, tent photo), `GiftBand.tsx` (gift cards; newsletter half absent until O6). (§6.1.4–6.1.9)
7. `src/app/(site)/page.tsx`: sections in the order of §6.1, each named with its one-word arrangement in a comment (stack, rail, ledger, strip, split). (§6.1, §3A)

Tests:

- `tests/unit/graphics/ny-map.test.ts`: path string under 4096 bytes; all six places inside the viewBox; Hammondsport is left of Catskill, Hudson Falls above it; regenerating gives an identical file.
- `tests/component/OvertimeSwitch.test.tsx`: Paper at 3 h 01 m before tip; Overtime at 2 h 59 m, during, and Paper again after the end; server render is always Paper.
- `tests/component/HeroStickers.test.tsx`: tag by weekday; no event → one sticker; never more than two.
- `tests/component/OnTap.test.tsx`: eight rows from the live menu view in menu order; fewer when the menu has fewer.
- `tests/e2e/home.spec.ts`: first viewport at 390 × 844 contains the pill, the three-line headline, the subline and both buttons without scrolling; `See the menu` → `/menu`; `Order pickup` is external; with the clock at Fri 2026-11-13 17:00 the hero is Overtime with `Tip in 2h`; pour runs once per session; reduced-motion and `prefers-reduced-data` runs skip the pour.
- `tests/e2e/home.a11y.spec.ts` (Paper and Overtime hero); `tests/visual/home.spec.ts` (both hero skins, 390 and 1280).
- `lighthouserc.json`: Home added with the §9.1 budgets.

**Done when:** all green; Lighthouse CI on the throttled phone profile meets LCP ≤ 1.8 s, CLS ≤ 0.02, INP ≤ 150 ms for Home with every set piece on (see §2 item 8 if LCP misses). Motion sheets for the pour, the map lines and the Overtime switch. Review loop including the 8 px blur squint test on the 390 first screen; screenshots: `/` at 390 and 1280, first screen and full, Paper and Overtime hero.

### M7. Gate and goblin

**From a person first:** O5 (goblin art and scream; placeholder goblin and hidden sound toggle meanwhile), O9 (nothing blocked).

Files:

1. `src/components/gate/storage.ts`: `readAge()`, `writeAge(ok)`, cookie mirror, 24 h re-ask for "Not yet", sound preference; shared by the bootstrap and React. (§5.1)
2. `src/components/gate/gate-bootstrap.ts` + `scripts/build-gate-bootstrap.ts` → `src/components/gate/gate-bootstrap.generated.ts` (minified string and its SHA-256 for the CSP). `#sv-gate` slot, script tag and first-frame styles in `src/app/layout.tsx` and `globals.css`. (§5.1; decision in §3)
3. `src/components/gate/GateLoader.tsx`: the small always-loaded leaf. (§5.1, §9.1)
4. `src/components/gate/Goblin.tsx`: `PlaceholderGoblin` (checker body, stamp eyes, parallelogram mouth, kernel ears, labelled `PLACEHOLDER — replace with Max's art`), a five-layer rig reader for `public/goblin/goblin.json`, single-image fallback. (§5.2)
5. `src/components/gate/AgeGate.tsx` (dynamic chunk): barley draw, question, Yes sequence (stamp, vibrate, shake, goblin, LAGER letters, wipe), Not yet panel with its two links, skip on tap, reduced-motion form, polite "Welcome in." announcement, focus handling. (§5.1)
6. `src/components/gate/sound.ts`: one `AudioContext`, limiter; exported but not imported anywhere until audio exists; the toggle renders only if `public/audio/lager.webm` is present at build. (§5.1)
7. `src/components/gate/GoblinHatch.tsx` (footer stamp, peek, 5 s cooldown) and `LagerEgg.tsx` (types `lager` on a physical keyboard, ignored in inputs); goblin added to the 404. (§5.2, §9.3.14)

Tests:

- `tests/unit/gate/storage.test.ts`: write and read; bad JSON ignored; "Not yet" valid at 23 h, asked again at 25 h; cookie and storage disagree → the newer wins.
- `tests/unit/gate/bootstrap.test.ts` (happy-dom, script string evaluated): no answer → `data-gate="ask"` and the dialog filled; stored Yes → DOM untouched; Yes click before the chunk → answer stored and overlay removed after 1500 ms; generated string under 1.5 KB; hash matches the CSP entry.
- `tests/component/AgeGate.test.tsx`: focus starts on Yes; Tab stays inside; Escape does nothing; Yes stores `{v:1, ok:true}` and calls the exit; Not yet shows both links and stores `ok:false`; site wrapper is `inert` while open.
- `tests/component/GoblinHatch.test.tsx`: second press within 5 s ignored. `tests/component/LagerEgg.test.tsx`: fires on `lager`, not while typing in a field.
- `tests/e2e/gate.spec.ts`: first visit shows the question in the first frame (screenshot at `domcontentloaded` with JavaScript throttled shows the overlay, never the page); Yes → home in under 2 s (timed from click to overlay removed); Not yet → food menu and the sky tag; returning visit requests no gate chunk (assert on network log) and never sets `data-gate`; reduced-motion run; page HTML fetched without JS contains the real home content and no gate markup; LCP element on first visit is the question (PerformanceObserver).
- `tests/e2e/gate.a11y.spec.ts`; `tests/visual/gate.spec.ts` (question frame, goblin still, Not yet panel).

**Done when:** all green; Yes-to-site under 2 s on the phone project; returning visitors load no gate code; gate chunk ≤ 35 KB gzip. Motion sheets for the whole Yes sequence, the goblin spring and the exit wipe. Review loop; the "could not verify without a person" list will be long here (timing, shake, haptics): Theo watches it on a phone.

### M8. Remaining pages and polish

**From a person first:** Max approves the Brewery edit (§6.5) and the third paragraph (§2 item 6); O4; O6 (if a provider is chosen, the newsletter block and field are built here; otherwise only the route handler); Theo's real-device pass.

Files:

1. `src/app/(site)/beer/page.tsx` + `src/components/beer/PullQuote.tsx`, `WhatGoesIn.tsx` (three facts, each traceable to a menu line), `RangeRow.tsx` (five hero glasses linking to `/menu?family=<x>`; `FilterChips` reads the param). (§6.5)
2. `src/app/(site)/about/page.tsx` + `src/components/about/Timeline.tsx`. (§6.6)
3. `src/app/(site)/gift-cards/page.tsx` + `GiftCard.tsx` (pointer tilt ±6°). `src/app/(site)/bands/page.tsx`. `src/app/order/route.ts` (307 to `site.links.order`). `src/app/(site)/privacy/page.tsx` + `site.json → privacy`. (§6.7)
4. `src/app/api/newsletter/route.ts`: Zod, honeypot, rate limit, no-op when `NEWSLETTER_PROVIDER=none`; `src/components/ui/Field.tsx` and `NewsletterField.tsx` exist in `/dev/kit` only until O6. (§8.8, §4.11, O6)
5. `src/lib/seo/metadata.ts`, `menuJsonLd`, `eventJsonLd`; `generateMetadata` on every route. (§8.7)
6. `src/app/opengraph-image.tsx` and per-route variants (menu, events, event with ticket, game with matchup split), fonts embedded. `src/app/icon.svg`, `apple-icon.tsx`, mask icon, `manifest.ts`. (§8.7)
7. `src/app/sitemap.ts`; redirects from §6 in `next.config.ts` (`/events-1/*` resolves to an event when the slug matches, else `/events`). (§6, §8.7)
8. `src/components/ui/SkeletonRow.tsx` and `loading.tsx` where a route can suspend. (§9.3.10)
9. (Stretch, only if Theo confirmed the mapping) `src/lib/menu/pick.ts` + `PickOne.tsx`. (§6.2)
10. `docs/review/M8/checklist.md`: §9.3 items 1–14, each with the evidence (test name or screenshot) or "needs a person".

Tests:

- `tests/unit/seo/metadata.test.ts`: title pattern; canonical; `noindex` flag. `tests/unit/seo/jsonld.test.ts`: menu sections and prices; event start and end with offsets and `eventStatus`.
- `tests/unit/newsletter.test.ts`: bad email 400; honeypot filled 200 with nothing sent; provider `none` no-ops; rate limit 429.
- `tests/e2e/redirects.spec.ts`: every old URL in §6 → its target with a permanent status; `/order` → Square with 307.
- `tests/e2e/pages.spec.ts`: each new route renders its `<h1>`, has one primary action, external links carry the arrow; `/beer` range glasses apply the family filter on `/menu`.
- `tests/e2e/og.spec.ts`: each OG route returns a 1200 × 630 PNG.
- `tests/e2e/a11y.all.spec.ts`: axe on every route in the sitemap in its skin; 200% text zoom at 320 px has no horizontal scroll.
- `tests/e2e/no-malting.spec.ts` now covers all routes, OG alt text and the sitemap.
- `tests/visual/all.spec.ts`: every route at 390 and 1280, plus 320, 430, 768, 1024, 1536, 1920 first screens for Home and Menu, portrait and phone landscape.
- Lighthouse CI on Home, Menu, Events with all §9.1 budgets (as amended by Q3).

**Done when:** all green; `checklist.md` complete with every "needs a person" line handed to Theo; Theo signs off on an iPhone, an Android phone and an iPad. Review loop on each new route.

### M9. Launch

Mostly people. The builder does not touch DNS, Squarespace, Square or Ops.

**From people:** goblin art and audio (O5); final content check with Max (tap list, October specials, Cabernet price, hours O2, Brewery copy); Google Business Profile hours matched to the JSON-LD; DNS cutover by Theo.

Builder work:

1. If Max's goblin art arrived: files into `public/goblin/` with `goblin.json`; remove the placeholder label; if audio arrived, `public/audio/lager.webm` and `.mp3`, the toggle appears by itself. Re-run M7 tests and motion sheets.
2. Remove `NEXT_PUBLIC_DEV_KIT` from production (Theo, in Vercel); confirm `/dev/kit` is 404 on the production URL.
3. `docs/launch-checklist.md`: each §10 M9 step with an owner; the list of every `TODO(Max)` and `TODO(Theo)` still in the code (`grep -rn "TODO(" src content`), which must be empty or explicitly accepted.
4. After cutover: run `tests/e2e/redirects.spec.ts` and `no-malting.spec.ts` against `https://drinksubversive.com`.

**Done when:** drinksubversive.com serves the new site, old URLs redirect (spec run against production), Search Console shows no errors (Theo).

---

## 7. Open items and what is built meanwhile

| Item | Blocks | Built meanwhile |
| --- | --- | --- |
| O1 Ops feed behind login | M5 going "live" | Seed through the same adapter; fallback test proves the switch |
| O2 hours | nothing | `site.json` as is |
| O3 menu source | nothing | File source behind `MenuSource`; Square stub rejects |
| O4 long name | nothing | "Subversive"; "Subversive Brewing" in metadata only |
| O5 goblin, audio, logos, photos | M9 | Placeholder goblin, hidden sound toggle, redrawn marks, existing photos |
| O6 newsletter provider | the block appearing | Route handler no-ops; block and footer link hidden |
| O7 seasonal specials | nothing | October window on the two specials sections (Q17) |
| O8 coordinates, Altamont | nothing | Spec values in `build-ny-map.ts`, marked to verify |
| O9 under-21 blocking | nothing | Nothing blocked |
| O10 malting | nothing | No mention anywhere; `no-malting` test on every route |
