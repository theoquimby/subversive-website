import { expect, test } from "@playwright/test";

// Plan M3: print media hides nav, photos and bars; both lists print, two columns.
test("print shows a clean two-column menu", async ({ page }) => {
  await page.goto("/menu");
  await page.emulateMedia({ media: "print" });
  for (const sel of [".site-header", ".site-footer", ".menu-bar", ".order-bar", ".pour-line"]) {
    await expect(page.locator(sel).first()).toBeHidden();
  }
  await expect(page.locator('[data-list="drinks"]')).toBeVisible();
  await expect(page.locator('[data-list="food"]')).toBeVisible();
  await expect(page.locator("[data-checker]").first()).toBeVisible();
  const columns = await page
    .locator('[data-list="drinks"]')
    .evaluate((el) => getComputedStyle(el).columnCount);
  expect(columns).toBe("2");
});
