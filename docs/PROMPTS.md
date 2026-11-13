# Prompts for the plan and build runs

Two prompts to paste into fresh sessions on this repository. The repo's `CLAUDE.md` loads automatically and carries the standing rules; these prompts only add the job.

## 1. Plan run

```
Read docs/SPEC.md, CLAUDE.md, content/*.json and look at docs/source/food-menu-2026-10.png and the three
screenshots in docs/mockups/. Then write docs/PLAN.md: the implementation plan for the whole site.

You are planning for a builder who will follow the plan literally, so it has to be executable without
guessing. For each milestone in spec §10:

- the files to create, in order, with one line on what each contains
- the exact spec sections each file implements
- the data shapes and function signatures for everything in src/lib (hours, events, menu, time)
- the tests to write, named, with the cases each must cover
- a "done when" check that can be run or looked at, including which screenshots to take
- anything a person must supply or decide first (the O-items in spec §0.2), and what to build meanwhile

Also decide, with a one-paragraph reason each: Radix or React Aria; Biome or ESLint+Prettier; how the
View Transitions wipe is implemented in the current Next.js version; how the age-gate bootstrap script
avoids a flash of content; how the NY State outline is generated at build time.

Where the spec is ambiguous or two sections conflict, do not pick silently: list the conflict under
"Questions for Theo" at the top and state the assumption the plan makes.

Do not write application code in this run. Do not change the spec; if you think the spec is wrong
somewhere, say so in the plan.
```

## 2. Build run (one milestone at a time)

```
Build milestone M<n> from docs/PLAN.md, following docs/SPEC.md and CLAUDE.md.

You are the designer. I am the art director. I will review the render, not your description of it.
The spec gives exact values: use them. Where it gives a rule instead of a value (spec §3A), apply the
rule and be ready to show how. Numbers, not adjectives: if you catch yourself aiming for "clean" or
"modern", go back to the grid, sizes and timings in the spec.

Order of work:
1. Read the plan section for this milestone and the spec sections it cites. Nothing else is in scope.
2. Build a small complete version first: one screen, real content from content/*.json (real names,
   dates and prices, never placeholder text), at 390 px. Open it, screenshot it, and fix what you
   see before going wider. Get that screen fully right, including its pressed, focus, empty and
   reduced-motion states, before starting the next.
3. Write the tests named in the plan as you go, not at the end.
4. When the milestone works, run the review loop from spec §3A: take screenshots at 390 and 1280 px in
   both skins (first screen and full page) and look at them before the code; build the motion sheet
   for any new set piece; check the ?grid construction overlay; have a separate reviewer agent that
   sees only the screenshots and the spec list at least five concrete faults against §3A and §9.3;
   fix them, then remove one
   element, color or animation per screen and keep each removal that does not make the screen worse.
   Look at docs/source/food-menu-2026-10.png next to your screenshots: the site should plainly be a
   relative of that menu.
5. Run typecheck, lint, unit tests, the Playwright suite and the performance budgets. Fix what fails.
6. Commit in small steps with clear messages and push. Report what was built, what you cut in the
   subtraction pass, the test results as they are (including failures), and anything that needs Theo
   or Max. End with the audit: what you computed, what you estimated, and what you could not verify
   without a person watching it on a phone. Expect one correction pass from Theo's screenshots.

Stop and ask rather than guess if a needed asset or decision is missing and the spec gives no default.
Never invent copy, facts, prices or events. Never mention malting.
```

## Notes on using them

- Run the plan once, read "Questions for Theo", answer them in the spec or plan, then start builds.
- One milestone per build session keeps context small and reviews short. M1 (the graphic kit) is the
  one to review hardest: every later screen inherits its quality.
- For M1 and M6, ask for a checkpoint: the builder shows the first screen as a rendered still and its
  plan for the rest in a few lines, then waits for a yes before finishing.
- Timing mistakes survive screenshot review, because a still cannot show them. Read the motion sheets
  in /dev/kit and watch the set pieces yourself on a phone.
- If a build drifts toward a generic look, point it at spec §3A "Tells of a generated site" and the
  menu PNG, and ask for the review loop again rather than describing the fix yourself.
