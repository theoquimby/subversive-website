import { expect, type Page, test } from "@playwright/test";

// Plan M3 flows (spec §6.2), phone and desktop projects.
const drinks = (page: Page) => page.locator('[data-list="drinks"]');
const food = (page: Page) => page.locator('[data-list="food"]');

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("/menu shows drinks; ?show=food shows food", async ({ page }) => {
  await page.goto("/menu");
  await expect(drinks(page)).toBeVisible();
  await expect(food(page)).toBeHidden();
  await page.goto("/menu?show=food");
  await expect(food(page)).toBeVisible();
  await expect(drinks(page)).toBeHidden();
  await expect(page.getByRole("radio", { name: "Food" })).toHaveAttribute("aria-checked", "true");
});

test("the tab survives a reload and syncs ?show=", async ({ page }) => {
  await page.goto("/menu");
  await page.getByRole("radio", { name: "Food" }).click();
  await expect(food(page)).toBeVisible();
  await expect(page).toHaveURL(/\?show=food/);
  await page.goto("/menu");
  await expect(food(page)).toBeVisible();
  await page.getByRole("radio", { name: "Drinks" }).click();
  await expect(page).not.toHaveURL(/show=/);
});

test("arrow keys move the switch", async ({ page, isMobile }) => {
  test.skip(isMobile, "no physical keyboard on phones");
  await page.goto("/menu");
  await page.getByRole("radio", { name: "Drinks" }).focus();
  // Radix moves focus on a timer after keydown; a real key is held longer than 0 ms
  await page.keyboard.press("ArrowRight", { delay: 60 });
  await expect(page.getByRole("radio", { name: "Food" })).toBeFocused();
  await expect(food(page)).toBeVisible();
});

const wideIndex = (page: Page) => page.locator('.mbar-links[data-for="food"]').isVisible();

test("a section link lands its heading below the sticky bar and becomes the current one", async ({
  page,
}) => {
  await page.goto("/menu?show=food");
  const wide = await wideIndex(page);
  if (wide) await page.locator('.mbar-links[data-for="food"] a', { hasText: "Salads" }).click();
  else {
    // a phone: the bar names the section being read; its sheet lists them all
    await page.locator(".mbar-index").click();
    await page.getByRole("dialog").getByRole("link", { name: "Salads" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  }
  const heading = page.locator("#salads-title");
  await expect(heading).toBeInViewport();
  await expect
    .poll(async () => {
      const bar = await page.locator(".menu-bar").boundingBox();
      const h = await heading.boundingBox();
      return !!bar && !!h && h.y >= bar.y + bar.height - 1;
    })
    .toBe(true);
  if (wide)
    await expect(page.locator('.mbar-links[data-for="food"] a', { hasText: "Salads" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  else await expect(page.locator('.mbar-index__here[data-for="food"]')).toHaveText("Salads");
});

test("the bar is one row, 48 px tall, with nothing else pinned", async ({ page }) => {
  await page.goto("/menu");
  const bar = await page.locator(".menu-bar").boundingBox();
  expect(bar?.height).toBeLessThanOrEqual(49);
  await expect(page.locator(".order-bar, .chips, .fpill")).toHaveCount(0);
});

test("filters dim non-matching rows and announce the count", async ({ page }) => {
  await page.goto("/menu");
  await page.locator(".mbar-index").click();
  await page.getByRole("button", { name: "Light" }).click();
  await page.getByRole("button", { name: "Sour" }).click();
  await expect(page.locator(".index-count")).toHaveText("4 beers match");
  await expect(page.locator('[data-row="new-york-nectar"]')).toHaveAttribute("data-dim", "");
  await expect(page.locator('[data-row="cheap-dills"]')).not.toHaveAttribute("data-dim", "");
  // the choice holds after the sheet is closed, and the bar says how many are on
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator(".mbar-index__n")).toHaveText("2");
  await expect(page.locator('[data-row="new-york-nectar"]')).toHaveAttribute("data-dim", "");
});

test("/menu#cheap-dills scrolls the row into view; every description is shown whole", async ({ page }) => {
  await page.goto("/menu?show=food#cheap-dills");
  await expect(drinks(page)).toBeVisible();
  const row = page.locator("#cheap-dills");
  await expect(row).toBeInViewport();
  // no row hides part of its description behind a toggle (redesign 2026-11-15)
  await page.goto("/menu#chinga-la-migra");
  await expect(page.locator("#chinga-la-migra")).toBeInViewport();
  await expect(page.locator("details.mrow__box")).toHaveCount(0);
  const clipped = await page.evaluate(
    () =>
      [...document.querySelectorAll(".mrow__desc")].filter((d) => d.scrollHeight > d.clientHeight + 1).length,
  );
  expect(clipped).toBe(0);
});

test("a row opens its item's detail view; Back closes it", async ({ page }) => {
  await page.goto("/menu");
  await page.locator('a[data-item="new-york-nectar"]').click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "New York Nectar" })).toBeVisible();
  await expect(page).toHaveURL(/[?&]item=new-york-nectar/);
  // a beer: the glass, and a price for each pour size
  await expect(sheet.locator("svg.glass")).toBeVisible();
  await expect(sheet.locator(".item__prices dt")).toHaveText(["9 oz", "16 oz"]);
  await expect(sheet.locator(".item__prices dd")).toHaveText(["5", "8"]);
  await expect(sheet.locator(".item__photo")).toHaveCount(0);
  await page.goBack();
  await expect(sheet).toBeHidden();
  await expect(page).not.toHaveURL(/item=/);
  await expect(page).toHaveURL(/\/menu/);
});

test("a shared item link opens on its item, in its own list; Close clears the address", async ({ page }) => {
  await page.goto("/menu?item=mushroom-and-swiss");
  await expect(food(page)).toBeVisible();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "Mushroom & Swiss" })).toBeVisible();
  await expect(sheet.locator(".item__prices dd")).toHaveText("20");
  await expect(sheet.locator(".item__desc")).toContainText("Swiss cheese");
  // the section's add-ons come along
  await expect(sheet.locator(".item__more")).toContainText("bacon");
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toBeHidden();
  await expect(page).not.toHaveURL(/item=/);
});

test("an item with a photo shows it; the arrow keys step through the list", async ({ page, isMobile }) => {
  await page.goto("/menu");
  // no item has a photo yet (they come from Max): give one row an address as the server would
  await page.locator('[data-row="puff-puff-pils"]').evaluate((li) => {
    li.setAttribute("data-photo", "/photo-test.jpg");
    li.setAttribute("data-photo-alt", "A glass of pilsner");
  });
  await page.locator('a[data-item="puff-puff-pils"]').click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.locator("img.item__photo")).toHaveAttribute("src", "/photo-test.jpg");
  await expect(sheet.locator("img.item__photo")).toHaveAttribute("alt", "A glass of pilsner");
  await expect(sheet.locator("svg.glass")).toHaveCount(0);
  test.skip(isMobile, "no physical keyboard on phones");
  await page.keyboard.press("ArrowRight");
  await expect(sheet.getByRole("heading", { name: "¡Chinga La Migra!" })).toBeVisible();
  await expect(page).toHaveURL(/item=chinga-la-migra/);
  await page.keyboard.press("ArrowLeft");
  await expect(sheet.getByRole("heading", { name: "Puff Puff Pils" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("Mushroom & Swiss shows 20, two taps from home", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.getByRole("dialog").getByRole("link", { name: /Menu/ }).click();
  } else {
    await page.getByRole("navigation").getByRole("link", { name: "Menu" }).first().click();
  }
  await page.getByRole("radio", { name: "Food" }).click();
  const price = page.locator("#mushroom-and-swiss .mrow__price");
  await expect(price).toHaveText("20");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("both lists are visible and every description is there", async ({ page }) => {
    await page.goto("/menu");
    await expect(drinks(page)).toBeVisible();
    await expect(food(page)).toBeVisible();
    await expect(page.locator(".menu-bar__nojs a", { hasText: "Food" })).toBeVisible();
    // nothing waits on a tap: the long description is simply on the page
    await expect(page.locator("#chinga-la-migra .mrow__desc")).toContainText("CCSM");
  });
});

test("the bar and its sheet stay inside a 320 px screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/menu?show=food");
  await expect(page.locator(".mbar-index")).toBeInViewport({ ratio: 1 });
  await page.locator(".mbar-index").click();
  await page.locator(".choice").first().click();
  await expect(page.getByRole("button", { name: "Close" })).toBeInViewport({ ratio: 1 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
