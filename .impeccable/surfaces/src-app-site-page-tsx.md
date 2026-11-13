---

version: 1
slug: "src-app-site-page-tsx"
primary_target: "src/app/(site)/page.tsx"
related_targets: []
---

# Home (`/`)

Scope: the home page. Visitor mode: Persuade. Audience: someone on a phone deciding whether to come. Job: see what's pouring and whether it's open, then go to the menu or get directions. Constraints: no photo above the fold (LCP), no game-night takeover, copy only from `content/` and the label.

Proof scope (2026-11-13): the first screen and the tap-to-pour interaction. The sections below it keep their current paper form until the rollout.

## Direction contract

THESIS: The label, poured. The first screen is the beer label standing up: one glass drawn in the label's gold line, filled with a real beer in its real colour, and the visitor pours the next one. It refuses the brewery template (fat serif headline, two buttons, a rounded photo).

OWN-WORLD: Spruce green ground edge to edge, header included. One thin gold line draws everything: the glass, the Catskill ridge behind it, the rule it stands on. Light geometric capitals in gold for names; bone for running text. The only saturated colour is the beer itself. No boxes, no shadows, no black.

STORY: This is a brewery, here is what it pours tonight, it is open (or when), go to the menu or get directions. The visitor learns the tap list by playing with it.

FIRST VIEWPORT: Phone: status pill top left; the beer's name in large light gold capitals with style and ABV beneath; a horizon rule across the full width at about two-thirds height with the Catskill ridge drawn on it; the glass, about 45% of the screen tall, standing on the rule right of centre and overlapping the name's lower edge; under the rule the brewery line, then See the menu (gold, primary) and Directions. Desktop: the same scene wider, name left, glass right of centre, the rule full-bleed.

FORM: An object on a horizon, from the label (position 1 of 1: pinned by the user's choice "Label leads"). Signature interaction: tap or swipe the glass and the next beer pours over the last; arrows and a count for keyboard and screen readers. Motion grammar: the pour (liquid rises, foam settles), the line (gold lines draw once), honest press states. seed: none (direction pinned by the user)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Finish review (2026-11-13, independent reviewer; verdict on the first pass: no)

Fixed in the proof: the pour (old beer drains, stream inside the bowl, head rides the new beer); glass 45% of a phone screen with its rim rising into the name's second line, 60% on desktop a little right of centre; one continuous ridge along the horizon behind the glass; arrows without rings, seated on the rule; description shown on phones; one line weight (1.5 px gold) for glass, ridge and rule; status line without a box, gold dot; the small type set in the label face; both actions above the fold at 320 × 568; the glass draws on once.

Left for the rollout: the header's Order pill competes with the primary action; the black "On tap" tab at the green/cream seam; grain on the gold buttons; the gap under a long name on desktop; the NY State outline and "Crafted in Catskill NY" line (need the label artwork from Max). Not re-reviewed after the fix pass. DESIGN.md not yet written (after sign-off). FORM's `seed: none`: the roll was skipped because Theo pinned the direction.
