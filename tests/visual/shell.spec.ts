import { expect, test } from "@playwright/test";

// M2 review captures (plan M2 "done when"): home, /menu stub, 404, open mobile menu, footer;
// 390 and 1280. PHASE=before|after → docs/review/M2/<phase>-<shot>-<width>.png
const phase = process.env.PHASE ?? "before";
const dir = "docs/review/M2";

for (const w of [390, 1280]) {
  test(`shell ${w}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${dir}/${phase}-home-${w}-first.png` });
    await page.screenshot({ path: `${dir}/${phase}-home-${w}-full.png`, fullPage: true });

    await page.goto("/menu");
    await page.screenshot({ path: `${dir}/${phase}-menu-${w}-first.png` });

    await page.goto("/no-such-page");
    await page.screenshot({ path: `${dir}/${phase}-404-${w}-first.png` });

    await page.locator("footer").screenshot({ path: `${dir}/${phase}-footer-${w}.png` });

    if (w < 1024) {
      await page.goto("/menu");
      await page.getByRole("button", { name: "Menu" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.screenshot({ path: `${dir}/${phase}-mobile-menu-${w}.png` });
    }
  });
}
