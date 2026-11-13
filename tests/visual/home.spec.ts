import { test } from "@playwright/test";

// M6 review captures: / at 390 and 1280, first screen and full, Paper and Overtime hero.
const phase = process.env.PHASE ?? "after";
const dir = "docs/review/M6";
const TIMES = [
  ["paper", "2026-11-13T12:00:00-05:00"],
  ["game-night", "2026-11-13T17:00:00-05:00"],
] as const;

for (const w of [390, 1280]) {
  for (const [skin, time] of TIMES) {
    test(`home ${w} ${skin}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.clock.install({ time: new Date(time) });
      await page.setViewportSize({ width: w, height: w < 600 ? 844 : 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/", { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${dir}/${phase}-home-${w}-${skin}-first.png` });
      if (skin === "paper")
        await page.screenshot({ path: `${dir}/${phase}-home-${w}-full.png`, fullPage: true });
    });
  }
}
