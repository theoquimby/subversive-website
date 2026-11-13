import { expect, test } from "@playwright/test";

// /dev/kit section by section (plan M1 visual test): each primitive at 390 and 1280, both
// skins, animations off, clock frozen, sticker pop-in shown at rest.
// PHASE=before|after → docs/review/M1/sections/<phase>-<section>-<width>-<skin>.png
const phase = process.env.PHASE ?? "before";
const sections = ["marks", "glass", "stickers", "tickets", "seal", "buttons", "photos", "icons", "motion"];

for (const w of [390, 1280]) {
  for (const skin of ["paper", "overtime"] as const) {
    test(`kit sections ${w} ${skin}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.clock.install({ time: new Date("2026-11-13T23:30:00Z") });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/dev/kit");
      await page.evaluate(() => document.fonts.ready);
      if (skin === "overtime") {
        await page.getByText("Overtime", { exact: true }).click();
        await expect(page.locator(".kit-root")).toHaveAttribute("data-skin", "overtime");
      }
      // the floating switch would cover section captures
      await page.addStyleTag({ content: ".kit-switch{display:none!important}" });
      for (const s of sections) {
        const el = page.locator(`section[aria-labelledby="kit-${s}"]`);
        await el.scrollIntoViewIfNeeded();
        await el.screenshot({
          path: `docs/review/M1/sections/${phase}-${s}-${w}-${skin}.png`,
          animations: "disabled",
        });
      }
    });
  }
}
