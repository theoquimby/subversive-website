import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Plan M1: axe on /dev/kit in both skins. Runs only against a build made with the dev kit.
test.skip(process.env.NEXT_PUBLIC_DEV_KIT !== "1", "the kit exists only in dev-kit builds");

for (const skin of ["paper", "overtime"] as const) {
  test(`/dev/kit passes axe in the ${skin} skin`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dev/kit");
    if (skin === "overtime") {
      await page.getByText("Overtime", { exact: true }).click();
      await expect(page.locator(".kit-root")).toHaveAttribute("data-skin", "overtime");
    }
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
}
