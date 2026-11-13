# Handoff: where things stand

## Update 2026-11-13 (Theo's PC): M0 done

- Vercel project `subversive-website` is connected to this repo; pushes to `main` deploy to
  https://subversive-website.vercel.app. `NEXT_PUBLIC_DEV_KIT=1` is set on all environments, so
  `/dev/kit` and `?grid` are live until M9. Framework and Node 22 are pinned in the repo
  (`vercel.json`, `engines`), not in the dashboard.
- Theo accepted the plan's assumptions for Q1 and Q3–Q5. What M0 shipped for each is in the M0
  commit messages; the token changes are listed in `src/styles/tokens.ts → adjustments` and on `/dev/kit`.
- On this PC, Playwright runs through installed Edge: `PW_CHANNEL=msedge`. Node and pnpm are not on PATH;
  use the Codex-bundled Node and `corepack pnpm@10`.

### Direction from Theo for M1 onward (2026-11-13)

1. **The bar.** The site should be the best piece of work in a seasoned designer's portfolio: bespoke,
   graphic, with integrity. Nothing that reads as generated. Spec §3A is the working method.
2. **A brewery, not a diner.** Cream stock, a checkerboard and fat black pills can tip into diner.
   Keep the menu's vocabulary but weight it toward the brewery:
   - The barley kernel and the 61° slash are the lead motifs. The checker stays an edge, never a field.
   - Beer is the hero object: glasses that fill in each beer's colour, can and label art when Max sends it.
   - Use spruce, the grain and the fire pit (Overtime) for depth.
   - No diner tells: chrome, red and teal, script neon, pastel, "Eats" signage, booth-card layouts.
   - Max's label art and typefaces (spec O5, §11.3 item 2) are the strongest lever. Ask for them before M1 is signed off.
3. **Refined and high-end, never early 2000s.** Most of this brand's print vocabulary turns
   into clip-art the moment it's overused. The refinement comes from restraint:
   - The hard offset shadow belongs to the one primary action per screen.
   - In practice, at most one sticker per screen.
   - Row badges are flat and straight.
   - Fat outlines only on things you press or that frame a photo.
   - Generous paper, precise type and real photography carry the page.

   Reject on sight:
   - Starbursts as decoration.
   - Bevels, glows or gradients.
   - Tilted everything.
   - Chunky borders on every box.
   - Busy patterns.
   - Clip-art icons.
   - Visible "fun" that isn't earned.
4. **The lager goblin** is Max's Oktoberfest PR character and he wants him in the site in fun ways.
   The spec's appearances (§5.1, §5.2: gate, footer hatch, typing `lager`, 404, Oktoberfest event pages) stand.
   He is drawn by Max, never invented by us. Until his art arrives, he is the marked placeholder.
5. **References Theo pointed to:**
   - [Fable 5.2 design and motion tests](https://productwithattitude.com/articles/claude-fable-5-2-design-motion-tests-prompts)
   - [Five things with Fable 5.2](https://abhijayvuyyuru.substack.com/p/fable-52-five-insane-things-you-can)
   - [designprompts.dev](https://designprompts.dev/)
   - [Figma AI website examples](https://www.figma.com/resource-library/ai-website-examples/)
   - [MindStudio design patterns](https://www.mindstudio.ai/blog/ai-website-design-patterns)
   - A Facebook video of motion prompts (login-walled, not readable)

   What we take from them:
   - Numbers, not adjectives.
   - A construction overlay and frame-strip motion sheets.
   - A separate reviewer who sees only renders.
   - One moving element per screen; words never wait.
   - Real content only.
   - An audit of what could not be verified without a person.

   What we reject: bento grids, glassmorphism, neon or gradient heroes, soft shadows, parallax and
   3D scroll gimmicks, kinetic type everywhere.
6. **"Improve on their menu; nothing heavy-handed; refined fun"** (Theo, M3). Their printed menu is the
   source, but a master designer would set it with more taste. In practice: smaller section pills that
   stay on one line, flat tints instead of outlined chips, quieter dashed rules, an ember kernel (not a
   black slab) for "current", two columns of rows on wide screens.
7. **Motion must be high-end** (Theo, M4–M5). Measured, not assumed: frame-sample every motion piece.
   Lessons so far:
   - Animate clip-path shapes directly, never a registered custom property inside clip-path.
   - One motion per change: a link tap from the open menu lets the page change carry the sheet away.
   - Page changes: React captures only each page's content (not the shell) as a layer, so a clip
     there let old words show through. Pages now sit in an opaque frame and change with a fast
     lift-and-fade out (160 ms) and a gentle settle in (320 ms); the header cross-fades with them.
   - No permanent view-transition names on list items: each becomes a layer that fades over the change.
8. **Max's beer label** (New York Nectar, shared by Theo in chat on 2026-11-13; ask Theo for the file to
   put in `docs/source/`). Thin gold monoline on spruce green: the New York State outline holding the
   beer name in a light geometric monoline cap face, the monoline "SUBVERSIVE / BREWING" wordmark with
   rules either side, a mountain-line mark with "CRAFTED IN CATSKILL NY", the barley mark, a ruled box
   for the beer's sentence, small caps footer lines. This is the refined register to lean on for
   `/beer`, the Home "Where it comes from" map (draw the state in that monoline gold-on-spruce), can
   imagery and OG cards. The label face is a candidate answer to O5 (display/label typeface): ask Max
   for its name before swapping anything.

---

Written at the end of the cloud session that produced the spec, so a session on Theo's computer can continue.

## Done

- `docs/SPEC.md`: full design and engineering spec.
- `docs/PLAN.md`: implementation plan, milestones M0–M9, with 22 questions for Theo at the top (each has a working assumption).
- `docs/PROMPTS.md`: the plan prompt and the per-milestone build prompt.
- `CLAUDE.md`: standing rules for any session in this repo.
- `content/`, `public/photos/`, `public/brand/`, `docs/source/`: content and assets taken from drinksubversive.com.

No application code exists yet.

## Next steps, in order

1. Create the Vercel project and connect it to this repo (Theo's PC has the Vercel CLI logged in):
   `vercel link --yes --project subversive-website` then `vercel git connect`.
   Set `NEXT_PUBLIC_DEV_KIT=1` and `NEXT_PUBLIC_SITE_URL` on the project (plan Q1, Q2).
2. Theo answers plan Q1 (commit to `main` or PRs) and skims Q3–Q5 (JS budget, CSP, contrast changes to ember and sky).
3. Run the build prompt from `docs/PROMPTS.md` for M0, then one milestone per session.

## Waiting on other people or systems

- Ops app: `GET /api/public/events` redirects to `/login`; it needs to be exempt from auth in the `subversive-ops` repo (spec O1). The site uses `content/events.seed.json` until then.
- Max: lager goblin art and scream audio, vector logo and label art, more photos, and answers to spec O2, O3, O4, O6, O9, O10.
- Instagram could not be read (login wall).

## Not done here

- No Vercel project, no deployment, no DNS change.
- The mockup PNGs in `docs/mockups/` predate the malting removal; only their HTML was corrected.
