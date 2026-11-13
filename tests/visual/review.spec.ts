import { expect, test } from "@playwright/test";

// Review-loop captures (spec §3A, plan §4): each route at 390 × 844 and 1280 × 800,
// first screen and full page, in each skin the route uses. Animations off, clock frozen.
// PHASE=before|after  MILESTONE=M0  → docs/review/M0/<phase>-<route>-<width>-<skin>-<first|full>.png
const phase = process.env.PHASE ?? "before";
const milestone = process.env.MILESTONE ?? "M0";

const routes: { path: string; slug: string; skins: ("paper" | "overtime")[] }[] = [
  { path: "/", slug: "home", skins: ["paper"] },
  { path: "/dev/kit", slug: "kit", skins: ["paper", "overtime"] },
];

const widths = [
  { w: 390, h: 844 },
  { w: 1280, h: 800 },
];

for (const r of routes) {
  for (const { w, h } of widths) {
    for (const skin of r.skins) {
      test(`${r.slug} ${w} ${skin}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await page.clock.install({ time: new Date("2026-11-13T23:30:00Z") });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(r.path);
        await page.evaluate(() => document.fonts.ready);
        if (skin === "overtime") {
          await page.getByText("Overtime", { exact: true }).click();
          await expect(page.locator(".kit-root")).toHaveAttribute("data-skin", "overtime");
        }
        const base = `docs/review/${milestone}/${phase}-${r.slug}-${w}-${skin}`;
        await page.screenshot({ path: `${base}-first.png`, animations: "disabled" });
        await page.screenshot({ path: `${base}-full.png`, fullPage: true, animations: "disabled" });
      });
    }
  }
}
