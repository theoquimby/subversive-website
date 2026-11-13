import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Plan M2: axe on each stub and the 404, and with the mobile menu open.
const ROUTES = ["/", "/menu", "/events", "/visit", "/beer", "/about", "/no-such-page"];

for (const route of ROUTES) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    // axe reads computed styles: let the page settle first (parallel workers load the server)
    await page.goto(route, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}

test("axe: mobile menu open", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone menu");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/menu");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
});
