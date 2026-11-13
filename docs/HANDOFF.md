# Handoff: where things stand (2026-11-13)

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
