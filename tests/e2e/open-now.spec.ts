import { expect, test } from "@playwright/test";

// Plan M4: frozen-clock matrix. The browser clock decides (the pill recomputes on mount);
// the server's line is only the first paint.
const NY = (iso: string) => new Date(iso);
const CASES = [
  ["open", "2026-11-16T17:00:00-05:00", "Open now · til 8"],
  ["before open", "2026-11-13T15:00:00-05:00", "Opens today at 4:30"],
  ["after close", "2026-11-16T21:00:00-05:00", "Closed now · opens Wed at 4:30"],
  ["Tuesday", "2026-11-17T12:00:00-05:00", "Closed Tuesdays · back Wed at 4:30"],
  ["game night", "2026-11-13T17:00:00-05:00", "Open late tonight · Knicks at 7:00"],
] as const;

for (const [name, when, text] of CASES) {
  test(`pill: ${name}`, async ({ page }) => {
    await page.clock.install({ time: NY(when) });
    await page.goto("/visit");
    const pill = page.locator(".visit-head .open-now");
    await expect(pill).toContainText(text);
  });
}

test("the pill links to /visit#hours", async ({ page }) => {
  await page.goto("/menu");
  await expect(page.locator(".menu-head .open-now")).toHaveAttribute("href", "/visit#hours");
  await page.locator(".menu-head .open-now").click();
  await expect(page).toHaveURL(/\/visit#hours$/);
  await expect(page.locator("#hours-title")).toBeInViewport();
});
