import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const ROUTES = [
  "/events",
  "/events/2026-12-10-trivia-with-smarty-pints",
  "/events/2026-12-27-subversive-overtime-knicks-vs-nets",
  "/events/2026-10-03-oktoberfest",
];

for (const route of ROUTES) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}
