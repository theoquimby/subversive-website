import { expect, type Page, test } from "@playwright/test";

// Plan M4: native links, and anchors that clear the sticky header.
test("phone, maps and email links; the email address is never printed", async ({ page }) => {
  await page.goto("/visit");
  const main = page.locator("main");
  await expect(main.locator('a[href="tel:+15183031270"]').first()).toBeVisible();
  const directions = main.getByRole("link", { name: /Directions/ });
  await expect(directions).toHaveAttribute("href", /(g\.page|google|maps\.apple\.com)/);
  await expect(directions).toHaveAttribute("rel", "noopener");
  const email = main.getByRole("link", { name: "Email us" });
  await expect(email).toHaveAttribute("href", /^mailto:/);
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/@[a-z0-9-]+\.[a-z]/i);
});

async function clearsHeader(page: Page, id: string) {
  await page.goto(`/visit#${id}`);
  const target = page.locator(`#${id}`);
  await expect(target).toBeInViewport();
  await expect
    .poll(async () => {
      const header = await page.locator("#site-header").boundingBox();
      const box = await target.boundingBox();
      return !!header && !!box && box.y >= header.y + header.height - 1;
    })
    .toBe(true);
}

test("#hours clears the sticky header", async ({ page }) => clearsHeader(page, "hours"));
test("#contact clears the sticky header", async ({ page }) => clearsHeader(page, "contact"));

test("Apple devices get Apple Maps", async ({ browser }) => {
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1",
  });
  const page = await ctx.newPage();
  await page.goto("/visit");
  await expect(page.locator("main").getByRole("link", { name: /Directions/ })).toHaveAttribute(
    "href",
    /^https:\/\/maps\.apple\.com\/\?q=/,
  );
  await ctx.close();
});
