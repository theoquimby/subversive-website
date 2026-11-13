import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Plan M3: axe on both tabs, filters open and closed.
// Rows dimmed by a filter are a deliberate "not matching" state (plan Q6), excluded by name.
async function axe(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const r = await new AxeBuilder({ page }).exclude("[data-dim]").analyze();
  return r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const show of ["drinks", "food"]) {
  test(`axe: /menu ${show}, filters closed`, async ({ page }) => {
    await page.goto(`/menu?show=${show}`, { waitUntil: "networkidle" });
    expect(await axe(page)).toEqual([]);
  });

  test(`axe: /menu ${show}, filters on`, async ({ page }) => {
    await page.goto(`/menu?show=${show}`, { waitUntil: "networkidle" });
    const pill = page.locator(".fpill");
    if (await pill.isVisible()) await pill.click();
    await page.locator(".fchip").first().click();
    expect(await axe(page)).toEqual([]);
  });
}
