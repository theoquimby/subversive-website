import { test } from "@playwright/test";

// M3 review captures (plan M3 "done when"): /menu and /menu?show=food at 390 and 1280,
// first screen and full, and one with a row open and filters on.
// PHASE=before|after → docs/review/M3/<phase>-<shot>-<width>-<first|full>.png
const phase = process.env.PHASE ?? "after";
const dir = "docs/review/M3";

for (const w of [320, 390, 1280]) {
  test(`menu ${w}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: w, height: w < 600 ? 844 : 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const [name, path] of [
      ["menu", "/menu"],
      ["menu-food", "/menu?show=food"],
    ] as const) {
      await page.goto(path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `${dir}/${phase}-${name}-${w}-first.png` });
      if (w !== 320) await page.screenshot({ path: `${dir}/${phase}-${name}-${w}-full.png`, fullPage: true });
    }
    if (w === 320) return;
    await page.goto("/menu", { waitUntil: "networkidle" });
    const pill = page.locator(".fpill");
    if (await pill.isVisible()) await pill.click();
    await page.getByRole("button", { name: "Hoppy" }).click();
    await page.getByRole("button", { name: "Farmhouse" }).click();
    await page.locator("details#off-axis summary").click();
    await page.evaluate(() => {
      const row = document.getElementById("new-york-nectar") as HTMLElement;
      window.scrollTo({ top: row.getBoundingClientRect().top + window.scrollY - 260, behavior: "instant" });
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${dir}/${phase}-menu-filtered-${w}-first.png` });
  });
}
