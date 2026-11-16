import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Plan M3: axe on both tabs, with the index sheet open and with an item's detail view.
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

  test(`axe: /menu ${show}, the index open with a filter on`, async ({ page }) => {
    await page.goto(`/menu?show=${show}`, { waitUntil: "networkidle" });
    await page.locator(".mbar-index").click();
    await page.locator(".choice").first().click();
    expect(await axe(page)).toEqual([]);
  });
}

for (const item of ["new-york-nectar", "house-salad"]) {
  test(`axe: /menu with the detail view of ${item}`, async ({ page }) => {
    await page.goto(`/menu?item=${item}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });
}
