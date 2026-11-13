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

test("a chip lands its section heading below the sticky stack", async ({ page }) => {
  await page.goto("/menu?show=food");
  const chip = page.locator('.chips[data-for="food"] a', { hasText: "Salads" });
  await chip.click();
  const heading = page.locator("#salads-title");
  await expect(heading).toBeInViewport();
  await expect
    .poll(async () => {
      const bar = await page.locator(".menu-bar").boundingBox();
      const h = await heading.boundingBox();
      return !!bar && !!h && h.y >= bar.y + bar.height - 1;
    })
    .toBe(true);
  await expect(chip).toHaveAttribute("aria-current", "true");
});

test("filters dim non-matching rows and announce the count", async ({ page }) => {
  await page.goto("/menu");
  const pill = page.locator(".fpill");
  if (await pill.isVisible()) await pill.click();
  await page.getByRole("button", { name: "Light" }).click();
  await page.getByRole("button", { name: "Sour" }).click();
  await expect(page.locator(".filters__count")).toHaveText("4 beers match");
  await expect(page.locator('[data-row="new-york-nectar"]')).toHaveAttribute("data-dim", "");
  await expect(page.locator('[data-row="cheap-dills"]')).not.toHaveAttribute("data-dim", "");
});

test("/menu#cheap-dills opens the row and scrolls it into view", async ({ page }) => {
  await page.goto("/menu?show=food#cheap-dills");
  await expect(drinks(page)).toBeVisible();
  const row = page.locator("#cheap-dills");
  await expect(row).toBeInViewport();
  // short rows are plain; a long one opens
  await page.goto("/menu#chinga-la-migra");
  await expect(page.locator("details#chinga-la-migra")).toHaveAttribute("open", "");
});

const pastFirstSection = (page: Page) =>
  page.evaluate(() => {
    const first = document.querySelector('[data-list="drinks"] [data-section]') as HTMLElement;
    const bottom = first.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top: bottom + 200, behavior: "instant" });
  });

test("the order bar appears after the first section and links to Square", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, "phone only");
  await page.goto("/menu");
  const bar = page.locator(".order-bar");
  await expect(bar).not.toHaveAttribute("data-visible", "");
  await pastFirstSection(page);
  await expect(bar).toHaveAttribute("data-visible", "");
  const order = bar.getByRole("link", { name: /Order pickup/ });
  await expect(order).toHaveAttribute("rel", "noopener");
  await expect(order).toHaveAttribute("href", /square/);
});

test("share falls back to copy with a toast", async ({ page, context, browserName }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, "the share button lives in the phone order bar");
  test.skip(browserName === "webkit", "WebKit has a share sheet; the fallback is Chromium's path");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined });
  });
  await page.goto("/menu");
  await pastFirstSection(page);
  await expect(page.locator(".order-bar")).toHaveAttribute("data-visible", "");
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();
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
  test("both lists are visible and long rows open", async ({ page }) => {
    await page.goto("/menu");
    await expect(drinks(page)).toBeVisible();
    await expect(food(page)).toBeVisible();
    await expect(page.locator(".menu-bar__nojs a", { hasText: "Food" })).toBeVisible();
    const row = page.locator("details#chinga-la-migra");
    await row.locator("summary").click();
    await expect(row).toHaveAttribute("open", "");
  });
});

test("open filters keep the bar inside a 320 px screen", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/menu");
  await page.locator(".fpill").click();
  await page.getByRole("button", { name: "Hoppy" }).click();
  await expect(page.locator(".fpill")).toBeInViewport({ ratio: 1 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
