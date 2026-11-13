import { test } from "@playwright/test";

// M4 review captures: /visit at 390 and 1280, first screen and full.
const phase = process.env.PHASE ?? "after";
const dir = "docs/review/M4";

for (const w of [390, 1280]) {
  test(`visit ${w}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.clock.install({ time: new Date("2026-11-13T17:00:00-05:00") });
    await page.setViewportSize({ width: w, height: w < 600 ? 844 : 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/visit", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${dir}/${phase}-visit-${w}-first.png` });
    await page.screenshot({ path: `${dir}/${phase}-visit-${w}-full.png`, fullPage: true });
  });
}
