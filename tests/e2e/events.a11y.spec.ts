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
    // under a loaded test server a stylesheet can arrive after the network goes quiet;
    // the page is not ready to be judged until every sheet is in (found 2026-11-15)
    await page.waitForFunction(() =>
      [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].every((l) => l.sheet),
    );
    const r = await new AxeBuilder({ page }).analyze();
    // name the first few elements, so a failure says where to look
    const where = (v: (typeof r.violations)[number]) =>
      v.nodes
        .slice(0, 4)
        .map((n) => `${n.target.join(" ")} [${n.any[0]?.message ?? ""}]`)
        .join(" | ");
    expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) ${where(v)}`)).toEqual([]);
  });
}
