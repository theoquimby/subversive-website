import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("axe: /visit", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/visit", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
});
