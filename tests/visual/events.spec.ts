import { test } from "@playwright/test";

// M5 review captures (clock frozen at Fri 2026-11-13 17:00 NY): /events, a game and a
// non-game event page, 390 and 1280.
const phase = process.env.PHASE ?? "after";
const dir = "docs/review/M5";
const SHOTS = [
  ["events", "/events"],
  ["game", "/events/2026-11-15-subversive-overtime-knicks-at-raptors"],
  ["trivia", "/events/2026-12-10-trivia-with-smarty-pints"],
] as const;

for (const w of [390, 1280]) {
  test(`events ${w}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.clock.install({ time: new Date("2026-11-13T17:00:00-05:00") });
    await page.setViewportSize({ width: w, height: w < 600 ? 844 : 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const [name, path] of SHOTS) {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${dir}/${phase}-${name}-${w}-first.png` });
      await page.screenshot({ path: `${dir}/${phase}-${name}-${w}-full.png`, fullPage: true });
    }
  });
}
