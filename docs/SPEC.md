# Subversive — website spec

Public website for **Subversive**, a farmhouse brewery, taproom and kitchen at 96 West Bridge Street, Catskill, NY 12414. Replaces the Squarespace site at drinksubversive.com.

This document is the brief for whoever plans and builds the site. It is opinionated on purpose: where it gives a value (a hex, a duration, a file path), use it. Where it says **Open**, a person has to answer before that part ships; build everything around it and leave a clearly marked placeholder.

- Owner: Max (brewery). Builder/contact: Theo.
- Repo: `theoquimby/subversive-website`. Deploy: Vercel. Sister app: Subversive Ops (`subversive-ops.vercel.app`), which owns events.
- Everything in `content/`, `public/brand/`, `public/photos/` and `docs/source/` was taken from the current site with the owner's permission on 2026-11-13.

---

## 0. Read this first

### 0.1 What already exists in this repo

| Path | What it is |
| --- | --- |
| `content/menu.json` | Full drink and food menu, transcribed from the October 2026 PDFs and checked against the rendered pages. Real names, descriptions, prices. |
| `content/site.json` | Name, address, phone, hours, visit policies, links, sourcing facts, About / Malthouse / Brewery copy (verbatim). |
| `content/events.seed.json` | Upcoming events in the exact shape of the Ops feed. Fallback and test fixture. |
| `public/photos/*.webp` | 15 photographs from the current site, 1500 px wide. |
| `public/brand/*.svg` | First-pass vector redraws made for this spec: `barley-mark.svg`, `barley-mark-solid.svg`, `wordmark-heritage.svg`, `sticker-burst.svg`, `checker-tile.svg`, `favicon.svg`. Starting points to refine, not final art. |
| `public/brand/*.webp` | Legacy raster wordmark, lockup and barley mark (low-res, reference only) and the Oktoberfest badge. |
| `docs/source/` | The two menu PDFs, PNG renders of them, and the full list of Squarespace image URLs (append `?format=2500w` for larger files). |
| `docs/mockups/` | Three early direction studies (HTML + screenshots). Direction A is the base of this spec; B contributed the sourcing ledger and chevron band; C became the "Overtime" night skin. They are sketches, not targets: this spec supersedes them. |

### 0.2 Known facts that are not yet settled

| # | Open item | Default until answered |
| --- | --- | --- |
| O1 | The Ops feed `GET /api/public/events` currently redirects to `/login`. Must be fixed in the Ops repo (exempt `/api/public/*` from auth). | Use `content/events.seed.json` through the same adapter. |
| O2 | Hours. Home page lists kitchen closing 15 min early Fri–Sun; old footer says kitchen and taproom close together. | Values in `content/site.json`. |
| O3 | Menu source of truth: Square catalog (needs a read-only Square token) or the JSON file. | JSON file behind a `MenuSource` interface (§8.4). |
| O4 | Long-form name after dropping "Malting". | "Subversive" everywhere; "Subversive Brewing" only in legal/meta. |
| O5 | Lager goblin art and scream audio from Max. Label art, logo vectors, more photos. Instagram is login-walled and could not be read. | Placeholder goblin (§5.2), redrawn marks (§3.1), existing photos. |
| O6 | Newsletter provider. | Form posts to a route handler that validates and no-ops behind `NEWSLETTER_PROVIDER=none`; UI says "Coming soon" is **not** acceptable, so hide the block until a provider is set. |
| O7 | Seasonal specials in `menu.json` (`seasonal: true`) are October's. | Hidden by a date window (§8.4). |
| O8 | Indian Ladder's town (Altamont, NY) and the map coordinates in §6.1 come from general knowledge, not the site. Verify. | As written. |
| O9 | Does Max want under-21 visitors blocked from anything? The taproom is family-friendly and nothing is sold on this site. | Nothing is blocked (§5.1). |

### 0.3 Non-negotiables

1. **Phone first.** Design and test at 390 × 844 before anything else. Tablet and desktop are enhancements of the phone layout, not separate designs.
2. **The menu is the product.** A first-time visitor on a phone reads tonight's beer list within one tap and five seconds.
3. **No native widgets.** No `<select>`, native date pickers, `alert/confirm`, default scrollbars or default focus rings. Build on accessible primitives (§8.2) and style them.
4. **Every graphic is SVG or CSS.** Marks, icons, stickers, tickets, glasses, the map, the goblin placeholder, patterns and dividers are vectors drawn in code, using `currentColor` and tokens so they recolor per skin and stay sharp on any screen. The only raster files on the site are photographs (and Max's goblin art if he supplies it as raster). No icon fonts, no PNG logos, no emoji as graphics.
5. **No filler.** Every sentence states a fact someone can use. Every graphic comes from the brand's own vocabulary (§3). If a section has no real content, it does not exist.
6. **Motion is earned.** Each animation in §5 has a job. Nothing else moves. Everything honors `prefers-reduced-motion`.
7. **It stays fast.** Budgets in §9 are release gates, not aspirations.

---

## 1. Creative concept

### 1.1 The idea: "the menu board, alive"

Subversive already has a strong, slightly rowdy print identity that the old website ignored. Look at `docs/source/food-menu-2026-10.png`: a **black-and-white checkerboard rail**, **fat black pill headers** in a soft heavy serif, **outlined rounded boxes**, a **blue specials panel**, **starburst price stickers**, a circular **seal**. Their glassware is printed with a **geometric barley stalk** made of six parallelograms. Their wordmark replaces the V with a single slash: `SUB/ERSIVE`.

The website is that menu taken off the table and made to move. It is printed matter that behaves: stickers that peel and can be flicked, a checker rail that rolls when you scroll, glasses that fill, ticket stubs that tear. Under the play, the layout is strict, typographic and quiet, with a lot of paper showing. Fun lives in the objects; class lives in the grid, the spacing and the restraint.

Two skins, one system:

- **Paper** (default, daytime): warm cream stock, black ink, three spot colors. Menu, visit, about.
- **Overtime** (night): near-black, bone type, ember and court-blue light. Events, game nights, the age gate, the footer. It is the same components with different tokens, as if the lights went down.

### 1.2 What it must signal (without saying it)

| Signal | How it shows up |
| --- | --- |
| Serious brewery | Precise typography, tabular prices, ABV and style on every beer, a real malthouse page with their own words. |
| Real food | Food photography gets the largest frames. Burgers are first-class on the menu, not an appendix. |
| Family friendly | Kid-friendly and dog-friendly tags on real items ("Chicken or Beef: for a dog or a human"), Tractor sodas listed with the same care as beer, daylight photos, a gate that never blocks the food menu. |
| New York grown | The sourcing ledger and the map (§6.1): named farms, bakeries, towns. No adjectives. |
| A sense of humor | The goblin, the stickers, the 404, the microcopy in §7. Dry, short, specific. |

### 1.3 What it must never be

- A dark "craft beer" template with a hero video, a script font and a mission statement.
- Gradient blobs, glassmorphism, generic line icons, emoji as decoration, stock photography, parallax for its own sake, a custom cursor, scroll-jacking, a loading screen that makes people wait.
- Three-column "feature cards" with an icon, a heading and two lines of nothing.
- Any sentence from the banned list in §7.2.

---

## 2. Design tokens

Implement as CSS custom properties in `src/styles/tokens.css`, exposed to Tailwind v4 via `@theme`. Components consume **semantic** tokens only; the two skins remap semantics.

### 2.1 Color

Raw palette:

| Token | Hex | Origin / use |
| --- | --- | --- |
| `--paper` | `#F5ECDC` | Menu stock. Default background. |
| `--paper-deep` | `#EBDFC8` | Tinted panels, image placeholders. |
| `--card` | `#FFFDF8` | Raised surfaces on paper (hours card, tickets). |
| `--ink` | `#151412` | Text, rules, pills, checker. Never pure black. |
| `--pils` | `#FFCE3A` | Sticker yellow. Primary highlight, CTA fill. |
| `--ember` | `#EE6A1F` | Fire-pit orange. Display accents, date blocks. Large type and shapes only. |
| `--ember-deep` | `#B4460F` | Ember for small text on paper. |
| `--sky` | `#2F9BE0` | The specials-panel blue. Secondary accent, family/dog notes. |
| `--sky-deep` | `#17639B` | Sky for small text on paper. |
| `--spruce` | `#1E3A2F` | Sourcing ledger, malthouse page background, "open" states. |
| `--currant` | `#6B2D5C` | Rare. Sour beers, one sticker. |
| `--night` | `#0F0E0C` | Overtime background. |
| `--night-raised` | `#191712` | Cards on night. |
| `--bone` | `#EFE7D8` | Text on night. |
| `--court` | `#2C6BE0` | Overtime accent for game nights. |
| `--go` | `#2DB55D` | Open-now dot only. |

Semantic tokens (Paper → Overtime): `--bg` (paper → night), `--surface` (card → night-raised), `--fg` (ink → bone), `--fg-muted` (ink at 70% → bone at 65%), `--rule` (ink at 14% → bone at 14%), `--rule-strong` (ink → bone), `--accent` (ember → ember), `--accent-text` (ember-deep → ember), `--highlight` (pils → pils), `--cta-bg` / `--cta-fg` (pils/ink → ember/night).

Rules:

- A screen uses ink + paper + **at most two** spot colors. Pils and ember are the default pair; sky appears where the content is about kids, dogs or specials.
- Spot colors are flat. No gradients, except the two photo scrims defined in §3.7.
- Write a unit test (`tokens.contrast.test.ts`) that computes WCAG contrast for every foreground/background pair the semantic layer allows and fails under 4.5:1 for text tokens and 3:1 for large-display and UI-boundary tokens. The hex values above were chosen by eye and arithmetic; the test is the authority, and any value that fails is adjusted darker, not exempted.

### 2.2 Beer color

Each draft beer carries a `color` used by the glass glyph (§4.4). Add to the beer data model; initial values:

Puff Puff Pils `#F2C744` · ¡Chinga La Migra! `#F5D76A` · New York Nectar `#E8A93A` · Hoppy American Lager `#EDBE4B` · Off Axis `#F0C55C` (hazy: add 12% white overlay) · Festbier `#E3A234` · Mountain Märzen `#B5651D` · Subversive Saison `#EBB84A` · Sudachi Saison `#F0CE62` · Forbidden Fruit `#7A2748` · Cheap Dills `#DCCB5A`.

Foam is always `--card`. These are illustrative, not brewing data; Max can correct them.

### 2.3 Typography

Three families, self-hosted through `next/font` (no runtime requests to Google):

| Role | Family | Weights | Notes |
| --- | --- | --- | --- |
| Display | **Caprasimo** | 400 | A soft, heavy, flared serif: the closest free relative of the fat serif on their printed pills. Headlines, pills, stickers, beer names. Never below 20 px. Never all-caps below 40 px. |
| Utility | **Barlow Condensed** | 600, 700 | Uppercase labels, eyebrows, nav, dates, prices on night skin, buttons. Tracking `0.12em` at ≤ 16 px, `0.04em` at display sizes. Echoes the condensed sans on the printed menu. |
| Text | **Barlow** | 400, 500, 600 | Body, descriptions, forms. |

If Max's label art shows a different display face, swap it by changing one token; nothing else references the family by name.

Scale (fluid, `clamp(min, vw-based, max)`; phone → desktop):

| Token | Size | Line height | Family | Used for |
| --- | --- | --- | --- | --- |
| `--t-mega` | 64 → 168 px | 0.86 | Display | Home hero, footer wordmark, 404 |
| `--t-h1` | 44 → 96 px | 0.9 | Display | Page titles |
| `--t-h2` | 30 → 52 px | 1.0 | Display | Section pills, big statements |
| `--t-h3` | 21 → 26 px | 1.1 | Display | Beer and dish names, event titles |
| `--t-label` | 13 → 14 px | 1.2 | Utility 700 | Eyebrows, group headers, tags |
| `--t-body` | 16 → 17 px | 1.5 | Text 400 | Paragraphs |
| `--t-small` | 14 → 15 px | 1.45 | Text 400 | Descriptions, captions |
| `--t-price` | 15 → 17 px | 1 | Text 600, `tabular-nums` | Prices, times |

Typographic care that separates this from a template:

- `font-variant-numeric: tabular-nums lining-nums` on every price, time, date and ABV. Prices right-align in a column that does not shift between rows.
- Prices print as the menu prints them: `5 / 8`, `18`, `+1.50`. No dollar signs in lists; a single "Prices in USD" is unnecessary. Sticker prices may use `$`.
- Real punctuation: `’ “ ” – — ×`, non-breaking space before units (`9 oz`, `7 PM`), en dash in ranges (`4:30–8:30`).
- `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs. Max line length 62ch for prose, 38ch for hero sublines.
- Display type gets optical nudges: negative letter-spacing `-0.02em` at mega size, and a `-0.04em` left margin so round letters align to the grid edge.
- Hanging punctuation for pull quotes on the malthouse page (`hanging-punctuation: first` with a negative text-indent fallback).

### 2.4 Space, shape, depth

- **Spacing:** 4 px base. Tokens `--s-1`…`--s-12` = 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96, 128. Section rhythm: 72 px on phone, 128 px on desktop. Page gutter: 20 px phone, 32 px tablet, 48 px desktop. Content max-width 1200 px; prose 680 px.
- **Grid:** 4 columns phone, 8 tablet, 12 desktop, 16/24/24 px gutters. Elements break the grid only by rotating in place (stickers) or bleeding to the viewport edge (photos, checker rail).
- **Radii:** `--r-pill: 999px` (pills, buttons, chips), `--r-box: 22px` (outlined boxes, photos), `--r-card: 16px` (tickets, cards), `--r-tag: 8px`.
- **Strokes:** everything outlined uses a 2 px ink stroke (`1.5px` dashed for row dividers). This single stroke weight is what makes the site read as one drawing.
- **Depth:** no soft shadows on Paper. Elevation is a hard offset: `box-shadow: 3px 3px 0 var(--ink)` for pressable things, `6px 6px 0` for the featured sticker. On press the element translates by the offset and the shadow collapses to 0 (the "stamp"). Overtime uses a 1 px bone-14% border and no shadow.
- **Breakpoints:** `sm 480`, `md 768`, `lg 1024`, `xl 1280`. Use container queries for components that live in different column widths (menu rows, tickets).

### 2.5 Phones come first

Assume four of five visitors are on a phone, often outdoors, one-handed, on cellular. Every decision above is made at 390 px and scaled up.

- **Reference viewports:** 320 (must work), 360, 390 (design target), 430, then 768, 1024, 1280+. Test portrait and landscape on phones.
- **Fluid, not stepped:** type, spacing and graphics scale continuously with `clamp()` and container-query units (`cqi`) between 320 and 1280 px. Breakpoints change layout (columns), never sizes abruptly. No horizontal scroll at any width, including with 200% text zoom.
- **Thumb zone:** primary actions sit in the lower half on phones: the sticky order bar on the menu, `Directions` and `Call` as full-width buttons on Visit, the mobile menu's links starting below the top third. Nothing important lives only in a top corner.
- **Targets:** 48 px tall for primary actions, 44 px minimum for everything tappable, 8 px between neighbours. Menu rows are tappable across their full width.
- **Viewport units:** use `svh`/`dvh`, never `vh`, for anything full-height (gate, mobile menu, heroes), so the iOS and Android toolbars do not cover content. Respect `env(safe-area-inset-*)` on the header, the order bar and the gate. Set `viewport-fit=cover`.
- **Inputs:** 16 px minimum font size in fields (prevents iOS zoom-on-focus), correct `inputmode`, `autocomplete` and `enterkeyhint`. Pinch-zoom is never disabled.
- **Touch behaviour:** no hover-only information; every hover effect has a press or in-view equivalent. Remove the grey tap highlight and replace it with the designed pressed state. Horizontal scrollers use scroll-snap, show a partial next item as an affordance, and never trap vertical scrolling. `touch-action` is set on draggable stickers so the page still scrolls when a drag starts vertically.
- **Weight on cellular:** the phone gets phone-sized images (`sizes` is written per component, not `100vw` everywhere), the menu page works without any JavaScript having loaded (tabs fall back to two stacked lists with anchor links), and set pieces defer until idle.
- **Hardware:** honor `prefers-reduced-motion` and `prefers-reduced-data` (skip the hero pour and autoplaying motion, serve smaller images). Test on a real low-end Android phone as well as an iPhone; animations must hold 60 fps there or be simplified.
- **Phone-specific wins:** tap-to-call, tap-for-directions in the native maps app, Web Share, add-to-calendar, haptic tick on the gate, and an installable manifest so the menu can live on a regular's home screen.

### 2.6 Motion tokens

| Token | Value | Use |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Entrances, reveals |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | Wipes, page transitions |
| `--ease-stamp` | `cubic-bezier(.3,1.6,.5,1)` | Overshoot for stickers and stamps |
| `--d-1` / `--d-2` / `--d-3` / `--d-4` | 120 / 220 / 420 / 800 ms | Press / hover and small moves / reveals / set pieces |
| Spring "sticker" | stiffness 420, damping 22, mass 0.9 | Drag release, pop-in |
| Spring "heavy" | stiffness 180, damping 26 | Goblin body, sheets |

Stagger children by 40 ms, never more than 8 items (the rest appear together).

---

## 3. Graphic language

Build these once in `src/components/graphics/` as small, tested, themeable pieces. They are the brand. All are inline SVG components or CSS; none is a raster image.

SVG rules for every graphic:

- Always a `viewBox`, never fixed pixel `width`/`height` in the markup; size comes from CSS (`width: 1em`, a token, or the container), so graphics scale with text size and container width.
- Color only through `currentColor` or CSS variables. No hard-coded fills except beer colors passed as props.
- Strokes that must stay 2 px at any size use `vector-effect: non-scaling-stroke`; strokes that should scale with the drawing (the hero glass, the map) do not.
- Snap straight edges to whole units and set `shape-rendering: geometricPrecision` (checker tiles: `crispEdges`) so nothing blurs on 2× and 3× phone screens.
- Decorative SVGs get `aria-hidden="true"` and `focusable="false"`; meaningful ones get `role="img"` and a `<title>`.
- Inline small SVGs as React components; larger ones (the map, the goblin) are separate components loaded with the section that uses them. Run everything through SVGO with `removeViewBox` off.
- Animate SVG with CSS transforms, `stroke-dashoffset` and `clip-path`; no SMIL.

### 3.1 The marks

**Barley mark.** Six outlined parallelograms alternating off a center stem. A first redraw is in `public/brand/barley-mark.svg` (the legacy raster is 55 px wide and is reference only):

```svg
<svg viewBox="0 0 60 118" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="miter">
  <!-- left kernels: outer edge high, slanting down to the stem -->
  <path d="M30 14 L8 2 V24 L30 36 Z"/>
  <path d="M30 46 L8 34 V56 L30 68 Z"/>
  <path d="M30 78 L8 66 V88 L30 100 Z"/>
  <!-- right kernels: offset half a step -->
  <path d="M30 30 L52 18 V40 L30 52 Z"/>
  <path d="M30 62 L52 50 V72 L30 84 Z"/>
  <path d="M30 94 L52 82 V104 L30 116 Z"/>
</svg>
```

Compare against `public/brand/barley-mark-legacy.webp` and adjust proportions until an overlay matches. Ship as `<BarleyMark />` with `stroke` (outline, default) and `solid` variants, and export each kernel as its own path so it can animate (kernels draw in bottom to top, 60 ms apart).

**Wordmark.** In the legacy logo the V is drawn as one long slash with a short left arm, like a check mark. That slash is the brand's second motif after the barley. Two versions:

- *Heritage:* thin geometric caps, wide tracking (as `wordmark-legacy.webp`, without the "MALTING | BREWING" line). A monoline redraw is in `public/brand/wordmark-heritage.svg`; tighten its spacing and letter shapes against the legacy file, or replace it with Max's vector if he has one. Use it small: in metadata, the seal and the footer small print.
- *Loud:* the name in Caprasimo with the slash drawn as an ember parallelogram cut at the same angle as a barley kernel (about 61° from horizontal). This is the hero and footer version. The slash is a recurring device: it is the divider in `5 / 8`, the wipe angle in page transitions, the cut on ticket stubs.

**Seal.** Circular badge, ink fill: barley mark centered, "SUBVERSIVE · CATSKILL NY · EST. 2018 ·" on a text path. Rotates slowly (one turn per 40 s) where used as a decorative stamp; static in the favicon and OG images. The old seal says "Malting · Brewing"; the new one does not.

### 3.2 Checker rail

The top and bottom edge of the printed menu. Square size 22 px phone, 28 px desktop, two rows.

```css
.checker {
  --sq: 22px;
  height: calc(var(--sq) * 2);
  background: conic-gradient(var(--fg) 25%, transparent 0 50%, var(--fg) 0 75%, transparent 0)
              0 0 / calc(var(--sq) * 2) calc(var(--sq) * 2);
}
```

Behaviour: the rail translates horizontally with scroll (`animation-timeline: scroll(root)`, moving `-4 × --sq` over the page), so it appears to roll like a tread as the page moves. With reduced motion, or without scroll-timeline support, it is static. Used at the very top of every page, above the footer, and as the progress edge of the age gate. Never as a full background.

### 3.3 Chevron band

The barley kernel repeated as a lattice. A 30 px band used to separate a photo from a color field, and as the "tread" variant on spruce/night sections.

```css
.chevrons {
  height: 30px;
  background:
    linear-gradient(135deg, transparent 46%, var(--c) 46% 54%, transparent 54%) 0 0 / 30px 30px,
    linear-gradient( 45deg, transparent 46%, var(--c) 46% 54%, transparent 54%) 15px 0 / 30px 30px;
}
```

### 3.4 Pills

Section headers are black pills with paper Caprasimo text, exactly as on the menu: `padding: 8px 26px 11px`, radius 999, `--t-h2`. A pill is always left-aligned to the grid and is the only header style for sections. On Overtime, pills invert (bone fill, night text). When a pill enters the viewport it "stamps": scale 1.12 → 1, rotate −2° → 0, `--d-2`, `--ease-stamp`, once.

Small pills are the chip style (filters, tags): 2 px ink outline, transparent fill, Utility 700 13 px; selected = ink fill.

### 3.5 Stickers

The starburst and the round stamp from the menu, treated as physical die-cut stickers. They carry the things that change: tonight's game, a new beer, "Wing Wednesday", "Dogs welcome".

Shapes (all SVG, one component `<Sticker shape=… color=… rotate=…>`):

- `burst`: 28-point star, the menu's price burst. Generate points in code (`outer r = 50`, `inner r = 41`), not a hand-typed polygon.
- `round`: circle with an inset 1.5 px ring 7 px inside the edge.
- `tag`: rounded rectangle, 10 px radius, 2 px ink outline, rotated −3°.
- `slash`: parallelogram at the wordmark slash angle.

Print feel: fill is flat spot color; a duplicate of the text layer is offset `1px, 1px` in ink at 18% (misregistration); an SVG `feTurbulence` + `feDisplacementMap` filter with scale 1.2 roughens the outline slightly so edges look cut, not computed. One shared filter definition in the document, referenced by id.

Behaviour (pointer and touch):

- **Pop-in:** scale 0 → 1 with the sticker spring, rotation settling from ±14° to its resting angle, 250 ms after its parent is visible.
- **Peel on hover / focus:** the bottom-right corner lifts. Implement with a `clip-path` polygon that cuts the corner plus a small triangle element behind it filled with a darker tint and a hard 2 px shadow. 180 ms.
- **Drag:** stickers on the home hero can be dragged within the hero bounds and flicked; on release they settle where dropped with the sticker spring and a rotation proportional to release velocity (clamped ±25°). Positions persist for the session (`sessionStorage`). They are `role="img"` with a label when decorative-with-meaning, or real links when they navigate; a dragged link sticker only navigates on a tap with < 6 px movement. Keyboard users can focus and activate them; dragging is pointer-only and is not required for any information.
- Never more than three stickers in one viewport.

### 3.6 Ticket stubs

Events are tickets. Card radius 16, 2 px ink outline, a date block on the left separated by a dashed perforation, with two half-circle notches cut into the top and bottom edge at the perforation (CSS `mask` with radial gradients). The date block color encodes the kind (§6.3). On hover/press the stub rotates 1.5° around the perforation and shifts 3 px, as if starting to tear. On the event page, the hero ticket's stub does tear off once on load (translate 14 px, rotate 6°, with the perforation edge becoming a zigzag clip-path) and stays torn.

### 3.7 Photography

Fifteen real photos exist (`public/photos/`). They are good and warm; treat them with respect and consistency.

- Frames: radius 22, 2 px ink outline on Paper; full-bleed with no outline in heroes and on Overtime.
- No filters, duotones or overlays on food. Two scrims only, for text on photos: bottom `linear-gradient(transparent, rgb(15 14 12 / .82))` over the lower 55%, and top `rgb(15 14 12 / .55) → transparent` over the upper 25% for the header.
- Aspect ratios: 4:3 and 1:1 on phone, 3:2 and 16:10 on desktop, 4:5 for portrait pairs. Always `object-fit: cover` with an explicit `object-position` per image, stored in the photo manifest (`content/photos.ts`: `src`, `alt`, `focal: [x, y]`, `credit?`).
- Write real alt text: what is in the picture ("Smash burger and a pint with the barley mark, on the bar").
- Suggested roles: `burger-and-beer` (home hero, menu food header) · `firepit-beers` (Overtime hero, events header) · `heated-tent` and `beer-garden-night` and `exterior-dusk` (visit) · `giant-pretzel`, `lobster-roll`, `patio-plate` (menu, home strip) · `malt-raking`, `malt-in-hands`, `brewhouse-copper`, `kettle-dark` (beer/malthouse) · `founders-doorway` (about) · `can-in-hand` (beer page, to-go).
- A photo reveals by its frame drawing first (outline stroke 300 ms), then the image fading up 420 ms from `--paper-deep`. `next/image` with a generated blur placeholder, correct `sizes`, AVIF/WebP.
- Ask Max for more: hands holding food, kids at the picnic tables, a dog in the tent, the bar on a busy night, cans with label art. Until then, do not pad with stock.

### 3.8 Paper grain

One fixed, pointer-events-none overlay on `body::after`: a 220 × 220 px tiled noise PNG (generated at build, < 6 KB), `mix-blend-mode: multiply`, opacity 0.06 on Paper and `screen` 0.05 on Overtime. It is the difference between flat cream and paper. Disabled in forced-colors mode.

### 3.9 Icons

No icon library. Draw a set of about 14 icons in the same 2 px miter stroke as the barley mark, on a 24 px grid: pin, clock, phone, dog, tent, parking "P", fork, glass (pint), stein, arrow, external arrow, calendar plus, speaker on/off, close. Geometric, slightly chunky, no rounded caps. One `<Icon name>` component reading from an SVG sprite.

---

## 4. Components

Each lives in `src/components/…`, has a Storybook-free "kitchen sink" route at `/dev/kit` (excluded from production builds and robots) and tests for behaviour.

### 4.1 Header

- Phone: 60 px tall. Left: barley mark + "Subversive" (Loud wordmark, 22 px). Right: **Order** button (pill, CTA) and a menu button (two-line glyph that becomes a slash + backslash "×").
- The header is transparent over heroes, then solid `--bg` with a 2 px bottom rule after 80 px of scroll. It hides on scroll down and returns on scroll up (translate, `--d-2`), never while the mobile menu is open.
- Desktop: links inline (Menu, Events, Visit, Our beer), Utility 700 15 px, active page marked with a small solid barley kernel before the label. Order button at right.
- **Mobile menu:** a full-screen sheet that wipes in along the slash angle (clip-path polygon from the top-right, 420 ms). Links in `--t-h1` Caprasimo, stacked, each preceded by its number in Utility (`01 Menu`). Below: today's hours line, address (tap for directions), phone, Instagram/Facebook, and one sticker (tonight's event if any). Focus trapped; Escape and back gesture close it; body scroll locked without layout shift.

### 4.2 Open-now pill

The most useful element on the site. Computed in `America/New_York` from `site.json` hours plus event overrides (§8.5).

States and copy (exact):

- Open: green dot (pulsing ring, 2 s) + `Open now · til 8:30` and, when relevant, muted `· kitchen til 8:15`.
- Opens later today: hollow dot + `Opens today at 4:30`.
- Kitchen closed, bar open: amber dot + `Bar open til 8:30 · kitchen closed`.
- Closed for the day: hollow dot + `Closed now · opens Sat at 12`.
- Closed day: `Closed Tuesdays · back Wed at 4:30`.
- Late for a game: `Open late tonight · Knicks at 7:00`.
- Special closure (CLOSURE/HOLIDAY event with `closed: true`): `Closed today · {event title}`.

It renders on the server with the state at request/revalidation time and re-computes on the client every 30 s and on `visibilitychange`, so a cached page is never wrong. Tapping it goes to `/visit#hours`. It appears in the home hero, the mobile menu, the visit page and the footer.

### 4.3 Buttons and links

- **Primary (CTA):** pill, `--cta-bg`, 2 px ink outline, hard shadow 3 px, Utility 700 16 px uppercase, min height 48 px. Hover: shadow grows to 5 px and the button lifts 2 px. Press: stamps down. Focus-visible: 3 px `--sky` ring offset 3 px (ember on Overtime).
- **Secondary:** ink fill, paper text, no shadow.
- **Text link:** 2 px underline in `--accent`, offset 4 px; on hover the underline thickens to fill behind the text (background-size transition) with text staying ink.
- **External links** (Square, Maps, Google Form) always carry the external-arrow icon and `rel="noopener"`.
- Every tap target ≥ 44 × 44 px with ≥ 8 px between targets.

### 4.4 Menu row and the glass glyph

The core unit. Container-query driven.

```
[glass]  Puff Puff Pils                         5 / 8
         Europils · 4.2%
         European pilsner brewed with 100% local grains.
```

- Name `--t-h3` Caprasimo. Meta line Utility 600 14 px: style · ABV. Description `--t-small`, muted, max 2 lines on phone with the rest revealed on tap (the row is a disclosure; no modal).
- Price column right-aligned, tabular. Two-size beers print `5 / 8` with a tiny `9 oz / 16 oz` legend once per section in the section header, not per row.
- Dashed 1.5 px divider between rows.
- **Glass glyph** (draft beer only): a 22 × 34 px outlined pint drawn in the icon stroke, with the barley mark tiny on its side (their real glassware has it). It is filled to 78% with the beer's `color` and topped with a foam cap. When the row scrolls into view the fill rises from 0 with a slight overshoot and the foam settles (600 ms, staggered 40 ms per row, once). This is the single most "ownable" detail in the menu: every beer shows its actual color at a glance, which also helps people who cannot parse style names.
- Badges (max one per row), as tiny `tag` stickers: `Flagship`, `New`, `15% to CCSM`, `Seasonal`.
- Dietary/family tags as outlined micro-chips after the description: `Vegan`, `Vegetarian`, `Kid-friendly`, `Dog-friendly`, `GF bun available`.
- Food rows have no glyph; the first item of a featured section may carry a photo at right (96 px square, radius 14) on tablet and up.

### 4.5 Section intro box

The outlined rounded box from the printed menu that explains a category ("Two smashed 3 oz patties of local grass-fed beef from Kilcoyne Farms…"). 2 px outline, radius 22, text centered on phone at 17 px, with the modifiers line in muted italic beneath. Producer names inside it are set in Text 600.

### 4.6 Ticket (event card)

See §3.6 for form. Content: date block (weekday, day number in Display 34 px, month), title, one-line detail (`7:00 tip · open til the final buzzer`), kind chip. Whole card is one link to the event page. In lists, tickets for **today** get a pils "Tonight" burst sticker overlapping the top-right corner.

### 4.7 Matchup block (game nights)

For `GAME` events whose title matches `Knicks (at|vs\.?) {Opponent}`. **Do not use NBA or team logos or wordmarks** (trademarks; the old site used them). Instead: a diagonal split along the slash angle, left half ember with `NYK` in Display, right half court blue with a three-letter opponent code (lookup table of 29 teams, fallback to the first three letters), and `AT` or `VS` in a small round stamp on the seam. Below it a countdown to tipoff in Utility (`Tip in 2h 14m`), switching to `On now` during the event window and `Final` after.

### 4.8 Sourcing ledger

A ruled table-like grid with no icons: label (`GRAIN`), maker (`100% New York`), place (`malted in-house, Catskill`). Data from `site.json → sourcing`. Two columns on phone, up to six across on desktop, 2 px outer rule, 1.5 px inner rules. On the malthouse page it is paired with the map (§6.1).

### 4.9 Hours card

Seven rows, today highlighted (Text 600 + a solid kernel marker), Tuesday muted "Closed", kitchen close as a second muted figure when it differs. Special hours from events appear as inserted rows for the next 14 days (`Wed Nov 25 · open late for Knicks`). Semantic `<table>` with a caption.

### 4.10 Marquee ("the ticker")

One line of Utility 700 text between two rules, used once on the home page and at the top of Events: tonight and the next two events, separated by small barley kernels. It scrolls at a constant 40 px/s, pauses on hover/focus and when offscreen, and is a static, wrapped list for reduced motion. The content is real `<a>` links, duplicated once with `aria-hidden` for the loop.

### 4.11 Form controls (all custom)

- **Text input / textarea:** 2 px ink outline, radius 14, 52 px tall, label always visible above in Utility 700. Focus: outline becomes `--sky`, and the label's kernel marker fills. Errors: message below in `--ember-deep` with an icon, `aria-describedby`, no red outline alone.
- **Segmented control** (Drinks / Food; filter chips): radio group semantics, a sliding ink "thumb" behind the selected option (shared layout animation, 220 ms).
- **Listbox, date selection, dialogs, toasts:** only if a feature needs them; build on the accessible primitives from §8.2, never the native control.
- **Newsletter field:** input and button fused into one pill; on success the pill flips to pils with "You're on the list." and a single kernel-confetti burst (12 small parallelograms, 700 ms, skipped for reduced motion).
- **Scrollbars:** `scrollbar-width: thin; scrollbar-color: var(--fg) transparent;` plus WebKit pseudo-elements: 10 px track, ink thumb, radius 999, 3 px transparent border via `background-clip`. Horizontal scrollers on phone hide the bar and show edge fades plus scroll-snap.
- **Selection color:** `::selection { background: var(--pils); color: var(--ink); }`.

### 4.12 Footer (Overtime skin)

Top: checker rail. Then, on night: the Loud wordmark at `--t-mega` spanning the full width (fit with `clamp` and a container-query unit so it always touches both gutters), the open-now pill, three columns (Visit: address, phone, hours summary · Do: Order pickup, eGift cards, Book your band, Mailing list · Follow: Instagram, Facebook), the seal rotating slowly at the right, a small-print line (`© 2026 Subversive · 96 West Bridge Street, Catskill NY · Please drink responsibly.`), and the goblin hatch (§5.2). The email address is not printed as text; "Email us" is a `mailto:` link.

---

## 5. Set pieces

Seven moments carry the "pizzazz". Build them properly or cut them; a half-working set piece is worse than none. Each has a reduced-motion form and none blocks content.

### 5.1 The gate and the goblin (first visit)

Purpose: the 21+ check Max asked for, turned into the site's opening titles.

**Sequence (default motion):**

1. `0 ms` Server-rendered page is already there underneath. An Overtime overlay covers it (rendered by a tiny inline script before paint when no stored answer exists, so there is no flash of content and no hydration wait).
2. `0–600 ms` Barley mark draws kernel by kernel in bone at center. Checker rail slides in at the top and bottom edges.
3. `600–900 ms` Question sets in Caprasimo, word by word: **"Are you 21 or older?"** Two pills stamp in: **Yes** (pils) and **Not yet** (outline). Focus lands on Yes. Total time to interactive question: under one second. Returning visitors never see any of this.
4. **Yes →**
   - `0 ms` The Yes pill stamps down. Haptic tick where supported (`navigator.vibrate(12)`).
   - `80 ms` Screen shakes 6 px for 240 ms. From below the bottom edge **the lager goblin** springs up (heavy spring, overshoot) until head and shoulders fill the lower 60% of the screen.
   - `380 ms` Jaw drops. The word **LAGER** slams in at `--t-mega` × 1.4 in pils, each letter stamping 45 ms apart with a 3° random rotation, and the scream plays **if sound is on** (see below). The checker rails race sideways.
   - `1250 ms` Goblin drops back down. The overlay exits as a slash-angle wipe (clip-path, 520 ms, `--ease-in-out`) revealing the home page, whose hero glass is mid-pour (§5.3) so the two moments chain.
   - Total: about 1.8 s from tap to site. Tapping anywhere after the goblin appears skips to the wipe.
5. **Not yet →** no goblin. The overlay turns Paper and says: **"No beer for you yet. The burgers are still excellent."** with two buttons: `See the food menu` (→ `/menu?show=food`) and `Hours & directions` (→ `/visit`). The site is fully browsable; a small sky tag "Under 21? Tractor sodas are on the menu." sits on the menu page. Nothing is blocked (O9).

**Storage:** `localStorage["sv.age"] = {v:1, ok:true|false, t:timestamp}` and a mirrored cookie `sv_age` (180 days, `SameSite=Lax`) so the inline script and any future server logic agree. A "Not yet" answer is re-asked after 24 h.

**Sound:** off by default, because browsers block unsolicited audio and because phones in a taproom should not scream. The gate shows a small speaker toggle bottom-left ("Sound: off"). The Yes tap is a user gesture, so if the toggle is on, play `public/audio/lager.(webm|mp3)` through one shared `AudioContext`, peak-limited, about 1.1 s. Preference persists in `localStorage["sv.sound"]`. Until Max supplies the recording, the toggle is hidden and no sound code path ships dead audio.

**Reduced motion:** no shake, no spring. The question fades in; on Yes, a still frame of the goblin with "LAGER" shows for 700 ms and cross-fades away.

**Robots, SEO, performance:** the overlay is purely client-side over fully rendered HTML, so crawlers and link previews see the real page. The gate's JS and goblin assets are a separate chunk loaded only when no answer is stored. It must not affect LCP for returning visitors, and for first-timers the LCP element is the gate's question text.

**Accessibility:** `role="dialog" aria-modal="true"` labelled by the question; focus trapped; Escape does nothing (an answer is required) but both answers are one keypress away; the goblin is `aria-hidden` and the result is announced politely ("Welcome in.").

### 5.2 The goblin as a character

The lager goblin is real Subversive lore (he DJs after the Oktoberfest band). Treat him as the site's one mascot and keep him rare so he stays funny.

- **Asset contract** (`public/goblin/`): ideally layered art from Max — `body`, `head`, `jaw`, `arm-left`, `arm-right`, each a transparent PNG/SVG on a shared 1200 × 1400 canvas with pivots listed in `goblin.json`. The rig is a puppet: CSS transforms on five layers. If Max sends one flat image, the component falls back to a single-layer spring with a squash-and-stretch scream (scaleY 1 → 1.08 → 1).
- **Placeholder until then:** a deliberately simple, clearly temporary goblin built from the site's own shapes: checker-patterned body block, two round stamp eyes, a parallelogram mouth that opens, kernel ears. Label it in code and in `/dev/kit` as `PLACEHOLDER — replace with Max's art`. It must be charming enough to demo and impossible to mistake for final art.
- **Where he appears:** the gate (once); the **footer hatch** (a small "do not press" round stamp in the footer; pressing it makes him peek over the footer edge and mouth "lager", five-second cooldown); typing `lager` anywhere on a physical keyboard; the 404 page; Oktoberfest event pages (he holds the ticket). Nowhere else.

### 5.3 The hero pour

Home hero, right side on desktop, below the headline on phone: a large outlined pint (same drawing as the glyph, 2 px stroke scaled to 3 px) containing the hero photograph instead of beer. On load the photo is revealed by a rising "liquid" mask: an SVG path with a gently waving top edge animates from the bottom to 100% over 1100 ms, with a cream foam band riding the surface that settles into the frame's top border. After the pour, the glass outline morphs out to the standard rounded photo frame (path morph or cross-fade, 400 ms). It runs once per session; afterwards the photo is simply there.

Reduced motion: the photo fades in inside its frame.

### 5.4 Scroll choreography

No scroll-jacking, no smooth-scroll library; native scrolling only. Effects driven by CSS scroll-driven animations (`animation-timeline: view()` / `scroll()`), with an IntersectionObserver fallback that adds a class once.

- Section pills stamp in (§3.4).
- Menu rows: glass fills (§4.4).
- Checker rail rolls (§3.2).
- Photos reveal (§3.7).
- Home "Where it comes from" map lines draw (§6.1).
- One parallax only: the hero photo inside its frame moves at 0.9× scroll (max 24 px). Nothing else parallaxes.
- A thin ember **pour line** at the left edge of the menu page on desktop shows reading progress through the menu and marks section anchors as kernels; clicking a kernel jumps to the section.

### 5.5 Page transitions

Use the View Transitions API (`next.config` experimental flag if required, with a no-op fallback). Default transition: a slash-angle wipe, old page clipped away to the upper right over 420 ms while the new page is already in place beneath. Shared elements: the header (persists), an event ticket morphing into the event page hero (`view-transition-name` per event id), the Drinks/Food thumb. Back/forward navigations reverse the wipe direction. Reduced motion: instant.

### 5.6 Overtime switch

When a `GAME` event is in progress or starts within 3 hours (client clock, NY time), the home hero flips to the Overtime skin: night background, firepit photo, matchup block with countdown in place of the sticker, and the ticker turns ember. The switch is a 600 ms cross-fade of tokens via a `data-skin` attribute on the hero section only (not the whole page), decided on the client after hydration with the Paper hero as the server default. This makes the site feel alive on the nights that matter most to Max.

### 5.7 404 and empty states

- **404:** Paper. `--t-mega` headline **"This keg's kicked."** Subline: "That page is gone or never existed." Buttons: `Menu`, `Events`, `Home`. The goblin peeks from the bottom-right holding an empty glass. An outlined pint drains (fill animates from 78% to 0) on load.
- **No upcoming events:** a blank ticket with "Nothing on the calendar yet." and a link to Instagram. Never an empty grid.
- **Events feed down:** seed/fallback data is used silently; if there is none, the same empty state.
- **Error boundary:** "Something spilled. Try again." with a retry button.

---

## 6. Pages

URL map: `/` · `/menu` · `/events` · `/events/[slug]` · `/visit` · `/beer` (malthouse + brewery) · `/about` · `/gift-cards` · `/bands` · `/order` (redirect to Square) · `/privacy` · 404.

Redirects from the old site (permanent): `/events-1` → `/events`; `/events-1/*` → `/events` (or the matching event when the slug resolves); `/about-us` → `/about`; `/malt-house-brewery` → `/beer`; `/contact-us` → `/visit#contact`; `/s/Inside-Menu-1.pdf` → `/menu`; `/s/OCTOBER-MONTH-MENU-1.pdf` → `/menu?show=food`; `/cart`, `/search` → `/`.

### 6.1 Home

Order of sections on a phone. Each is one screenful or less.

1. **Checker rail + header.**
2. **Hero.** Open-now pill → headline in `--t-mega`, three stacked words, last in ember: **Beer. / Burgers. / Catskill.** → subline (Text 18 px): "Farmhouse brewery, taproom & kitchen at 96 West Bridge Street." → two buttons: `See the menu` (primary), `Order pickup` (secondary, external). → the hero pour frame with `burger-and-beer`, carrying up to two stickers: tonight's or the next event (burst, links to the event), and one rotating fact tag from a fixed list (`Dogs welcome in the tent`, `Wing Wednesday`, `Rodeo Thursdays`, chosen by weekday). Desktop: text left (7 cols), frame right (5 cols), headline baseline aligned to the frame's bottom edge.
3. **Ticker** with the next three events.
4. **On tap** pill → the first eight draft beers as menu rows in two groups, with glass glyphs → link "Full drink & food menu". This is a live slice of `/menu`, not a hand-picked list.
5. **From the kitchen** pill → a horizontally snapping row of three large food photos (burger, pretzel, plate) each with one real caption (name + price from the menu) → section intro box about the smash burgers (beef and bun sources) → `See the food menu`.
6. **Coming up** pill → three tickets (next three non-closure events) → `All events`. On desktop, three across.
7. **Where it comes from** (spruce background, chevron band above). Sourcing ledger plus the **map**: an outline of New York State in bone 2 px stroke with dots at Catskill (taproom, marked with the barley mark), Hudson Falls, Cairo, Altamont, Hammondsport, and Livingston (the original barn, hollow dot labelled "2018"). Lines from each source draw toward Catskill on scroll, labels set in Utility. Generate the state outline at build time from a public-domain boundary file (US Census cartographic boundary or Natural Earth), simplified to under 4 KB of path data, projected with a fixed Albers or Mercator fit; do not hand-draw it and do not ship a map library. Approximate coordinates to verify (O8): Catskill 42.217, −73.865 · Hudson Falls 43.301, −73.586 · Cairo 42.299, −73.998 · Altamont 42.700, −74.034 · Hammondsport 42.408, −77.224 · Livingston 42.142, −73.778. One sentence only, from the site: "All of our beers feature 100% locally sourced grains, and many feature locally sourced hops, fruits, and herbs as well." Link: `Our beer & malthouse`.
8. **Visit** pill → hours card + address block (address in Display, `Directions` and phone buttons) + four fact chips (first come first served · heated tent · 8 spots + street parking · leashed dogs outside and in the tent) + `heated-tent` photo.
9. **Mailing list** (only when O6 is resolved) and **gift cards** as a single two-up band: "eGift cards" button (external) with the line "Physical gift cards are always available in the taproom."
10. **Footer.**

### 6.2 Menu

The page people will open most, usually standing outside or at a table. Optimise ruthlessly for scanning.

- **Title row:** `--t-h1` "Menu", the open-now pill, and a small "Updated {date}" in muted Utility (from the data source's timestamp), because the old site made a point of it.
- **Segmented control:** `Drinks | Food`, sticky directly under the header, synced to `?show=` and remembered per device. Switching is instant (both lists are in the HTML; inactive one is `hidden`) with a 220 ms cross-slide.
- **Section chips** below it, horizontally scrollable and sticky with the control: Drinks → Beer · Specials · Cocktails · Wine & cider · No-alcohol. Food → Burgers · Chicken · Small bites · Salads · Sides & sauces · This week · Specials. The chip for the section in view is selected (IntersectionObserver); tapping scrolls to it with `scroll-margin-top` accounting for the sticky stack.
- **Filter chips** (multi-select, in a row that collapses behind a "Filter" pill on phone): Drinks → `Light`, `Hoppy`, `Malty`, `Farmhouse`, `Sour`, `Under 5%`. Food → `Vegetarian`, `Vegan`, `Kid-friendly`. Filtering dims non-matching rows to 30% rather than removing them, so the list never jumps; a count announces via `aria-live` ("4 beers match").
- **Beer section:** groups in the menu's own order (Light, Hoppy, Malty, Farmhouse, Sour), each a Utility group header with a rule, rows per §4.4. Legend `9 oz / 16 oz` in the section header.
- **Today's features:** items with `availability.days` matching today (NY time) are pulled into a pils-outlined box at the top of Food titled with their label ("Wing Wednesday", "Rodeo Thursdays"). On other days they sit in "This week" with their day chip.
- **Burger sections** open with the section intro box (§4.5), then three rows; on tablet and up the three burgers lay out as the three boxed columns from the printed menu (pill name, outlined description box, price in a small pill beneath).
- **Sauces** render as a compact two-column definition list, not rows.
- **Notices** (allergy and raw-food advisory) verbatim at the foot in `--t-small`.
- **Sticky order bar** on phone: after scrolling past the first section, a 56 px bar slides up from the bottom: `Order pickup` (primary, external to Square) and a `Share` icon button (Web Share API with URL fallback to copy, custom toast). It respects the safe-area inset.
- **Print stylesheet:** the page prints as a clean two-column black-on-white menu with the checker rail, so staff can print it. No nav, no photos.
- **Deep links:** every section and item has an id (`/menu#cheap-dills`); arriving at an item opens its disclosure and flashes a pils highlight behind the name once.

### 6.3 Events

Events are entered once in Ops. The site only reads.

- **Skin:** Overtime. Header photo `firepit-beers` at 40vh with the title **"What's on"** over the bottom scrim, and the ticker.
- **Filter chips:** All · Games · Music · Trivia & movies · Festivals. Map from feed `kind`: `GAME` → Games, `MUSIC` → Music, `FESTIVAL` → Festivals, `OTHER` → sub-classified by title keywords (`trivia`, `movie`, `first friday`), `HOLIDAY`/`CLOSURE` → not tickets; they render as slim notice rows in the timeline ("Closed Thu Nov 26 · Thanksgiving") and feed the hours logic.
- **List:** grouped by month with a sticky month label in Display. Tickets full-width on phone, two columns on tablet, three on desktop. Date block color by kind: Games ember (with the mini matchup split), Music pils, Trivia & movies sky, Festivals currant, Other bone.
- **Today** is pinned at the top in a larger ticket with countdown.
- **Recurring patterns** (the feed lists each date separately): when three or more upcoming events share a normalized title (e.g. Trivia), show the next one as a ticket with "+ every other Thursday" style helper text only if the dates are in fact regular; otherwise list each.
- **Add to calendar:** on each ticket's page, a custom menu with Apple/Outlook (`.ics` from a route handler) and Google (URL template).
- **Book your band** band at the bottom: one line of copy from the site and a button to `/bands`.

**Event page `/events/[slug]`** (slug = `{date}-{kebab-title}`; resolve by feed `id` under the hood so title edits don't break links, redirecting to the canonical slug):

- Hero ticket, torn (§3.6), with date, time range, title in `--t-h1`.
- Matchup block for games (§4.7); for other kinds, the kind's spot color as a full-bleed band with the seal.
- Description from the feed, rendered as plain paragraphs with autolinked URLs. Strip emoji bullets at render time and convert leading-emoji lines to a clean list.
- "Good to know" row computed from hours: `Kitchen til 8:15` · `Bar open through the final buzzer` (when the event's `endTime` is after normal close) · `Free` only if the description says so.
- Add to calendar, Share, Directions.
- Next/previous event links as small tickets.
- Past events: page stays up with a "This one's over" stamp and a link to upcoming events; `noindex` after 30 days.

**Fields to request from the Ops session** (do not block on them; design tolerates their absence): `slug`, `imageUrl` + `imageAlt`, `ticketUrl` / `rsvpUrl`, `priceLabel`, `kitchenCloseOverride`, `barCloseOverride`, finer `kind` values (`TRIVIA`, `MOVIE`), `featured: boolean`, `updatedAt`.

### 6.4 Visit

- Title `--t-h1` **"Find us"**, open-now pill.
- Hours card (§4.9) with special hours for the next 14 days.
- Address block: address in Display; buttons `Directions` (opens the platform maps app: `maps:` on Apple devices, Google Maps URL elsewhere), `Call (518) 303-1270` with the muted note "Only answered during taproom hours."
- **Map:** a static, custom-styled map image is preferable to an embedded third-party iframe (privacy, weight, style). Draw a simple schematic instead: West Bridge Street, Division Street, the creek and bridge, the lot with "8" on it, a barley-mark pin at 96, in the icon stroke on paper. It is a diagram, not cartography; the Directions button does the real work. Confirm the street layout against a map before drawing.
- **Good to know**, as four outlined boxes with a custom icon each and the site's own words: Seating (first come, first served) · The tent (heated) · Parking (8 spots onsite; West Bridge Street and Division Street) · Dogs (full policy text from `site.json`, with the sky "Dogs welcome in the tent" tag).
- Photo pair: `exterior-dusk` (4:5) and `beer-garden-night` (4:5), then `heated-tent` full-bleed.
- **Gift cards** and **Contact** anchors: `Email us`, phone, socials, band booking link.

### 6.5 Our beer (`/beer`)

Spruce + Paper alternating bands. This is the one long-read page; set it like a small magazine feature.

- Opening: `--t-h1` **"Malthouse & brewery"** over `malt-raking`, full-bleed.
- **Malthouse:** the four paragraphs from `site.json`, 680 px measure. The sentence "We deeply believe that a true regional grain economy is not just possible, but vitally necessary in the 21st Century." is the pull quote: Display 30–44 px, hanging quote mark, ember slash before it.
- A three-step strip, built only from facts in their copy, labelled in Utility with large numerals: `01 Grain from our neighbors` → `02 Malted in-house` → `03 Brewed around the malt`, each with a photo (`malt-in-hands`, `malt-raking`, `brewhouse-copper`). No invented process detail.
- **Brewery:** the three paragraphs, with `kettle-dark` and `can-in-hand`.
- Sourcing ledger + map (shared with home).
- Closing band: current draft list preview (four rows) → `See what's on tap`.

### 6.6 About

Short. `founders-doorway` photo with caption "Zane Coffey and Max Ocean." Three paragraphs from `site.json` (update "Subversive Malting + Brewing" to the new name once O4 is answered; until then leave verbatim). A two-point timeline drawn as a dashed line with two kernels: **2018** small barn, Livingston NY → **2020** taproom opens in an old mechanic's garage, Catskill. Then links to Visit and Our beer.

### 6.7 Gift cards, Bands, Order, Privacy

- `/gift-cards`: one screen. A drawn gift card (ink card, barley mark, pils slash) that tilts with pointer/gyro within ±6° (off for reduced motion). `Buy an eGift card` (external Square link) and the line about physical cards.
- `/bands`: Overtime. "Play here." One paragraph from the site, a list of recent acts as plain text pulled from past MUSIC events if the feed provides history (otherwise omit), and `Open the booking form` (external Google Form). Embedding the form in an iframe is not acceptable (unstyled, slow). If Theo later wants a native form, it posts to a route handler; out of scope for v1.
- `/order`: server redirect (307) to the Square ordering URL, so printed QR codes and the header button share one stable URL that can be repointed.
- `/privacy`: plain statement of what is stored (age answer, sound preference, menu tab; analytics without cookies).

---

## 7. Words

### 7.1 Voice

Short. Factual. Dry. A bartender who likes you, not a brand manager. Lead with the fact; humor comes from specificity and understatement, never from exclamation marks (the existing site uses many; the new one uses almost none, and only inside quoted event descriptions from the feed).

Reference lines that are on-voice: "For a dog or a human." (already on their menu) · "Lighter than a Märzen, but maltier than a pilsner." · "Open til the final buzzer." · "This keg's kicked." · "No beer for you yet. The burgers are still excellent."

Microcopy set (use exactly): `Order pickup` · `See the menu` · `Directions` · `All events` · `Add to calendar` · `Open now` · `Kitchen til 8:15` · `Tonight` · `Closed Tuesdays` · `Email us` · `You're on the list.` · `Something spilled. Try again.`

### 7.2 Banned

Do not write, anywhere, including alt text and metadata: "crafted with passion", "handcrafted", "artisanal" (except where it is in their own menu text), "elevated", "curated", "experience" as a noun for a visit, "journey", "nestled", "welcome to", "we believe" (outside their verbatim copy), "locally sourced goodness", "farm-to-glass", "hidden gem", "something for everyone", "more than just a brewery", "community hub", "vibes", "your new favorite", any sentence that could describe any brewery. No invented taglines, no invented history, no invented tasting notes. If copy is needed that the brewery has not written, write one plain factual sentence or leave a `TODO(Max)` and omit the block.

### 7.3 Editing their copy

Body copy in `site.json` and menu descriptions are theirs; keep them. Allowed edits: sentence case instead of ALL CAPS, typographic punctuation, the name change, fixing clear typos ("styes" → "styles"). Anything more goes to Max as a suggestion.

---

## 8. Engineering

### 8.1 Stack

- **Next.js** (latest stable, App Router, React Server Components), **TypeScript** `strict` with `noUncheckedIndexedAccess`.
- **Tailwind CSS v4** with tokens from §2 in `@theme`; component styles are utilities plus a small set of hand-written CSS files for the graphic primitives (checker, chevrons, masks) where utilities would obscure intent.
- **Motion** (`motion/react`) for springs, drag and shared layout: used by the gate, stickers, segmented thumb, mobile menu. Everything else is CSS (transitions, keyframes, scroll-driven animations, View Transitions). No GSAP, no Lottie, no smooth-scroll library, no component kit with its own look.
- **Zod** for every external payload. **pnpm**. Node 22.
- Fonts via `next/font/google` (self-hosted at build), `display: swap`, subset latin + latin-ext (needed for "Märzen", "¡").
- Hosting: Vercel. Analytics: Vercel Web Analytics + Speed Insights (cookieless).

### 8.2 Accessible primitives

Use unstyled, accessible primitives (Radix UI or React Aria Components; pick one and stay with it) for dialog, disclosure, tabs/segmented, listbox, toast, navigation menu. All visuals are ours.

### 8.3 Structure

```
src/
  app/
    (site)/layout.tsx            header, footer, gate bootstrap, skins
    (site)/page.tsx              home
    (site)/menu/page.tsx
    (site)/events/page.tsx
    (site)/events/[slug]/page.tsx
    (site)/visit/page.tsx
    (site)/beer/page.tsx
    (site)/about/page.tsx
    (site)/gift-cards/page.tsx
    (site)/bands/page.tsx
    order/route.ts               307 → Square
    api/newsletter/route.ts
    api/events/[id]/ics/route.ts
    dev/kit/page.tsx             component kitchen sink (dev only)
    not-found.tsx  error.tsx  sitemap.ts  robots.ts  manifest.ts
    opengraph-image.tsx          + per-route variants
  components/
    graphics/   BarleyMark, Wordmark, Seal, Checker, Chevrons, Sticker, Ticket, GlassGlyph, Grain, Icon, NyMap
    layout/     Header, MobileMenu, Footer, Section, Pill
    menu/       MenuTabs, SectionChips, FilterChips, MenuRow, IntroBox, TodayFeatures, OrderBar
    events/     EventList, EventTicket, Matchup, Countdown, AddToCalendar, Ticker
    visit/      OpenNow, HoursCard, AddressBlock, GoodToKnow, StreetDiagram
    gate/       AgeGate, Goblin, gate-bootstrap.ts (inline script source)
    ui/         Button, TextLink, Field, Segmented, Toast, Disclosure
  lib/
    hours/      schedule.ts, status.ts, format.ts          (pure, heavily tested)
    events/     source.ts, ops.ts, seed.ts, schema.ts, classify.ts, slug.ts, matchup.ts
    menu/       source.ts, file.ts, square.ts (stub), schema.ts, filters.ts, seasonal.ts
    time/       ny.ts                                       (all timezone math in one place)
    seo/        jsonld.ts, metadata.ts
  styles/       tokens.css, globals.css, graphics.css, print.css
content/        menu.json, site.json, events.seed.json, photos.ts
scripts/        build-ny-map.ts, build-grain.ts, check-contrast.ts
tests/          unit/, e2e/, visual/
```

Rules: server components by default; a component is `"use client"` only if it needs state, effects or gestures, and client components stay leaf-level. No data fetching in client components. No `any`. No inline hex values outside `tokens.css` and beer colors. All copy that Max might change lives in `content/`, not in JSX.

### 8.4 Menu data

```ts
interface MenuSource { getMenu(): Promise<Menu>; }   // Menu = zod-inferred from content/menu.json's shape
```

- v1: `fileMenuSource` reads `content/menu.json` at build. Editing is a commit, which Theo does for Max. That is acceptable only as a starting point.
- **Recommended next step (O3): `squareMenuSource`**, reading the Square Catalog API with a read-only token (`SQUARE_ACCESS_TOKEN`, server-only), mapping categories → sections and item variations → `prices`, cached with ISR (`revalidate: 300`) and a webhook-triggered `revalidateTag("menu")`. Square is already where items and prices live for ordering and POS, so Max edits once. Fields Square lacks (beer `style`, `abv`, `color`, `badge`, tags) come from custom attributes on the catalog item, or from a small overlay file keyed by item name. If the Square call fails, serve the last good copy; never an empty menu.
- Whatever the source, `Menu` is validated by Zod at the boundary; invalid data fails the build (file) or falls back (remote) and logs.
- **Seasonal window:** sections or items with `seasonal: true` accept `availableFrom` / `availableUntil` (ISO dates). Outside the window they are omitted. Add these to the October specials so they disappear on their own.
- **Day-of-week features:** computed in NY time on the client for "today" highlighting, with the server default being the unhighlighted list (so cached HTML is never wrong).

### 8.5 Hours logic (`lib/hours`)

Pure functions, no `Date.now()` inside; the clock is passed in.

- `scheduleFor(date, site, events) → { open, close, kitchenClose, closed, reason? }`: weekly hours, overridden by events on that date: any event with `closed: true` → closed with the event title as reason; a non-closure event whose `endTime` is later than `close` → `close` extends to `endTime` and `reason` = "open late" (kitchen close unchanged unless the feed later supplies an override).
- `statusAt(instant, …) → OpenStatus` discriminated union covering every state in §4.2, including "opens later today", "kitchen closed", next-opening lookup across closed days and closures (search up to 14 days ahead).
- `formatTime("16:30") → "4:30"`, `"20:00" → "8"`, with `PM` only where ambiguity exists (noon openings read `12`, as on their site).
- All conversions go through `lib/time/ny.ts`, built on `Intl.DateTimeFormat` with `timeZone: "America/New_York"` (or `Temporal` where available). Tests cover both DST transitions, midnight rollover, an event ending after midnight, Tuesday, a holiday closure and a game night.

### 8.6 Events data

- `opsEventsSource`: `fetch(OPS_EVENTS_URL + "?days=120", { next: { revalidate: 300, tags: ["events"] } })`, Zod-validated against the documented shape (`{ timezone, events: [{ id, date, title, kind, closed, startTime, endTime, description }] }`). Treat a redirect or non-JSON response as failure (this is exactly what O1 returns today).
- On failure: last good response if cached, else `content/events.seed.json` filtered to future dates. The UI never shows an error for this.
- `classify.ts` adds the display category, `matchup.ts` parses game titles, `slug.ts` builds canonical slugs. All pure and tested with the seed file.
- `OPS_EVENTS_URL` is an env var with the production URL as default. Add an on-demand revalidation route protected by a secret so Ops can ping the site when Max saves an event.

### 8.7 SEO, sharing, metadata

- Per-route `generateMetadata`: title pattern `"{Page} · Subversive, Catskill NY"`, factual descriptions (e.g. "Draft beer, smash burgers and takeout at Subversive, 96 West Bridge Street, Catskill NY. Open Mon, Wed–Sun.").
- **JSON-LD:** `Brewery` + `Restaurant` on the layout (name, address, geo, telephone, `openingHoursSpecification` from `site.json`, `servesCuisine`, `menu` URL, `sameAs` socials, `acceptsReservations: false`); `Menu`/`MenuSection`/`MenuItem` on `/menu`; `Event` on event pages (with `eventStatus`, location, start/end in ISO with offset).
- **OG images** generated with `next/og` in the brand system: Paper card with checker rail, Loud wordmark, page title in Caprasimo; event pages get a ticket with date and title; game nights get the matchup split. Fonts embedded.
- `sitemap.ts` including upcoming events; `robots.ts` excluding `/dev`; canonical URLs; the redirects in §6.
- Favicon set from the solid barley mark on pils; `manifest.ts` with theme colors; Apple touch icon; a monochrome mask icon.
- Keep the Google Business Profile's hours as a manual task in the launch checklist; the site's JSON-LD must match it.

### 8.8 Security and privacy

Strict CSP (self, Vercel analytics; no third-party scripts or iframes), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera/mic/geolocation. No secrets in client bundles. Newsletter route: Zod validation, honeypot field, rate limit, no storage of our own. No cookie banner is needed because nothing tracks; say so on `/privacy`.

---

## 9. Quality bar

### 9.1 Performance budgets (release gates, tested on a throttled mid-range phone profile)

- LCP ≤ 1.8 s, CLS ≤ 0.02, INP ≤ 150 ms on Home, Menu and Events.
- First-load JS for `/menu` ≤ 110 KB gzip; the gate chunk ≤ 35 KB and absent for returning visitors; Motion is code-split to the components that use it.
- Lighthouse (mobile) ≥ 95 performance, 100 accessibility, 100 best practices, 100 SEO.
- Every image has dimensions, `sizes`, a blur placeholder and lazy loading below the fold; the hero image is preloaded with `fetchpriority="high"`.
- Fonts: three families, at most six font files in total, preloaded for above-the-fold weights only; size-adjusted fallbacks so swapping causes no shift.
- Animations touch only `transform`, `opacity`, `clip-path` and SVG attributes on small elements; nothing animates layout; `will-change` is applied just-in-time and removed.

### 9.2 Accessibility (WCAG 2.2 AA)

- Full keyboard path through every page, visible focus everywhere, skip link, logical headings, landmarks.
- `prefers-reduced-motion`: every set piece has the still form described in §5; marquee and rail are static; no autoplaying motion longer than 5 s without a pause control (the seal rotation and ticker pause on hover/focus and have a global "Pause motion" control in the footer that persists).
- `prefers-contrast: more` thickens strokes to 3 px and removes grain; `forced-colors` mode keeps outlines and drops fills gracefully.
- Text scales to 200% without loss; layouts hold at 320 px width.
- Screen-reader copy for graphics that carry information: glass glyph is decorative (style and ABV are in text); stickers that state facts have text equivalents; the matchup block reads "Knicks at Pacers, tipoff 7 PM".
- Automated axe checks in e2e for every route in both skins, plus a manual VoiceOver pass on Home, Menu and the gate before launch.

### 9.3 The "expensive site" checklist

Small things that, together, are why a site feels like it cost six figures. All are required.

1. Nothing shifts as fonts, images or data load.
2. Every interactive element has distinct, designed hover, focus-visible, pressed and disabled states.
3. Prices and times line up in columns across rows and cards.
4. The sticky stack (header, tabs, chips, order bar) never covers an anchor target and respects notches and the iOS toolbar (`dvh`, safe-area insets).
5. Tapping the status bar area, pull-to-refresh, back-swipe and rotation all behave natively.
6. Links to phone, maps, email, calendar and share open the right native app.
7. Stroke weight, radii and offsets are identical everywhere; rotated elements use the same three angles (−3°, 4°, 11°).
8. Optical alignment: display text aligns to the grid by its letterforms, not its box; icons are centered optically in buttons.
9. No orphaned single words in headings; no widowed prices.
10. Empty, loading, error and offline states are designed (§5.7). Loading uses outlined skeleton rows in the row shape with a slow checker shimmer, never spinners.
11. 404, OG images, favicon, print stylesheet, selection color and scrollbars are all on-brand.
12. The site looks deliberate at 320, 390, 430, 768, 1024, 1280, 1536 and 1920 px, in portrait and landscape.
13. Dark surroundings: the Overtime skin is used where specified; the site does not auto-invert on `prefers-color-scheme` (Paper is the brand), but `color-scheme` is declared so form controls and scrollbars match each skin.
14. One easter egg more than anyone expects (typing `lager`), and no others.

### 9.4 Testing

- **Unit (Vitest):** `lib/hours` (exhaustive, table-driven), `lib/events` (schema, classify, slug, matchup, fallback), `lib/menu` (schema, filters, seasonal windows, today's features), token contrast, time formatting.
- **Component (Testing Library):** OpenNow states, MenuRow disclosure, Segmented keyboard behaviour, AgeGate storage and focus trap, Sticker tap-vs-drag threshold.
- **E2E (Playwright):** projects for iPhone 15, iPhone SE, iPad (portrait), desktop Chromium and WebKit. Flows: first visit → gate Yes → home; gate Not yet → food menu; menu tab + filter + deep link; event list → event page → `.ics` download; visit page links; redirects from old URLs; feed failure falls back to seed (route mocking); reduced-motion run of the gate; a frozen-clock matrix for the open-now pill (open, before open, after close, Tuesday, game night).
- **Visual regression:** Playwright screenshots of `/dev/kit` and each route at 390 and 1280 px in both skins with animations disabled and the clock frozen.
- **CI (GitHub Actions):** typecheck, lint (Biome or ESLint + Prettier), unit, build, e2e against the build, Lighthouse CI with the budgets above. Vercel preview per PR.

---

## 10. Build plan

Small, reviewable increments pushed to `main` behind Vercel previews. Each milestone ends deployed and demoable on a phone.

| # | Milestone | Done when |
| --- | --- | --- |
| M0 | **Foundation.** Scaffold, tokens, fonts, lint, CI, Vercel project connected to the repo, `/dev/kit` route. | Blank Paper page with the checker rail deploys from `main`; contrast test passes. |
| M1 | **Graphic kit.** BarleyMark, Wordmark, Seal, Checker, Chevrons, Pill, Sticker, Ticket, GlassGlyph, Icon set, Grain, Button, TextLink. | `/dev/kit` shows every primitive in both skins; visual snapshots recorded. |
| M2 | **Shell.** Header, mobile menu, footer, page transitions, 404, error. | Navigation between stub pages works with transitions on phone and desktop; keyboard and screen-reader pass. |
| M3 | **Menu.** Data schema + file source, the full `/menu` page, filters, deep links, sticky order bar, print stylesheet. | A stranger finds the price of a Mushroom & Swiss in under 10 s on a phone; all menu tests green. |
| M4 | **Hours & Visit.** `lib/hours`, OpenNow, HoursCard, `/visit`, street diagram. | Frozen-clock e2e matrix passes; JSON-LD validates. |
| M5 | **Events.** Sources + fallback, `/events`, event pages, matchup, countdown, ticker, `.ics`. | Works on seed data today and on the live feed the moment O1 is fixed, with no code change. |
| M6 | **Home.** Hero + pour, on-tap slice, kitchen strip, coming up, sourcing ledger + NY map, visit band, Overtime switch. | Home meets the performance budgets with all set pieces on. |
| M7 | **Gate & goblin.** Bootstrap script, gate, placeholder goblin, sound plumbing (hidden), footer hatch, `lager` easter egg. | First-visit flow under 2 s from Yes to site; returning visitors load no gate code. |
| M8 | **Remaining pages & polish.** Beer, About, Gift cards, Bands, Privacy, OG images, sitemap, redirects, §9.3 checklist line by line. | Checklist signed off on real devices (an iPhone and an Android phone, an iPad). |
| M9 | **Launch.** Real goblin art and audio if delivered, final content check with Max, Google Business Profile hours match, DNS cutover planned and done with Theo (apex + `www` to Vercel, lower TTL a day ahead, keep Squarespace live until verified, then cancel). | drinksubversive.com serves the new site; old URLs redirect; Search Console shows no errors. |

Dependencies on people: O1 (Ops fix) before M5 is "live"; O5 art before M9; O3/O6 decisions any time (interfaces are ready).

---

## 11. Appendix

### 11.1 Content inventory from the old site

Carried over in `content/`: tagline facts, hours, phone note, seating, parking, dogs, gift cards, mailing list prompt, band form link, socials, map link, About, Malthouse, Brewery, the full menus, upcoming events. Dropped on purpose: the Squarespace cart and search, the broken newsletter block, "CLICK HERE" phrasing, all-caps paragraphs, NBA team logos.

Old-site event history (useful as test data and to show Max the range the design must hold): Knicks watch nights ("Subversive Overtime"), biweekly trivia with Smarty Pints, Oktoberfest (stein-holding contest, German band, the lager goblin's DJ set), the Catskill pumpkin carving contest, free movie nights with Story Screen Cinema, First Friday parties and beer releases, Sunday live music, lobster roll and seafood pop-ups.

### 11.2 Environment variables

`OPS_EVENTS_URL` (default: the production Ops URL) · `REVALIDATE_SECRET` · `SQUARE_ACCESS_TOKEN` (when O3 chooses Square) · `NEWSLETTER_PROVIDER` + provider keys (when O6 is answered) · `NEXT_PUBLIC_SITE_URL`.

### 11.3 Things to ask Max for

1. Lager goblin art (layered if possible) and a recorded scream.
2. Vector logo files and any label art; the names of the typefaces on the labels.
3. More photos (see §3.7), especially people, kids, dogs, cans.
4. Answers to O2, O3, O4, O6, O9.
5. Current tap list and whether the October specials have ended.
