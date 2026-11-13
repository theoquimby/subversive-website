import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Plan M6 flows. Clock frozen in the browser; the seed drives events.
test("the first phone screen holds the pill, the headline, the subline and both buttons", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const loc of [
    page.locator(".hero .open-now"),
    page.locator(".hero__title"),
    page.locator(".hero__sub"),
    page.getByRole("link", { name: "See the menu" }),
    page.locator(".hero").getByRole("link", { name: /Order pickup/ }),
  ]) {
    await expect(loc).toBeInViewport({ ratio: 1 });
  }
  await expect(page.locator(".hero__title")).toHaveText("Beer.Burgers.Catskill.");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("See the menu goes to /menu; Order pickup is external", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero").getByRole("link", { name: /Order pickup/ })).toHaveAttribute(
    "rel",
    "noopener",
  );
  await page.getByRole("link", { name: "See the menu" }).click();
  await expect(page).toHaveURL(/\/menu$/);
});

test("a game night does not take over the first screen: the pill carries it in one line", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-13T17:00:00-05:00") });
  await page.goto("/");
  await expect(page.locator("[data-hero]")).toHaveAttribute("data-skin", "paper");
  await expect(page.locator(".hero .open-now")).toContainText("Open late tonight · Knicks at 7:00");
  await expect(page.locator(".hero .matchup")).toHaveCount(0);
});

test("the pour plays once per session", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-poured", "");
  await page.waitForTimeout(1400);
  await page.goto("/menu");
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-poured", "");
});

test("axe: home", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
});
