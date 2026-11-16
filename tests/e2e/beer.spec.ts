import { expect, test } from "@playwright/test";

// Our beer: the supplier map lives here only (Theo, 2026-11-15; it was also on Home).
test("where it comes from: choosing a source moves the map; a click opens its detail view", async ({
  page,
}) => {
  await page.goto("/beer");
  const rows = page.locator(".smap__row");
  await expect(rows.first()).toBeVisible();
  // a source with a town: its road is drawn and its town is named
  await rows.filter({ hasText: "Indian Ladder" }).click();
  await expect(page.locator(".smap__route")).toHaveCount(1);
  await expect(page.locator(".smap__label").first()).toHaveText("Altamont");
  // a statewide source lights the whole state and, having a photograph, opens a detail
  const grain = rows.filter({ hasText: "100% New York" });
  await grain.click();
  await expect(page.locator(".smap__state")).toHaveAttribute("data-all", "");
  await expect(grain).toHaveAttribute("aria-expanded", "true");
  // the photograph really loads (it once stayed hidden waiting for a scroll reveal)
  await page.locator(".smap__detail img").scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator(".smap__detail img").evaluate((i) => (i as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await grain.click();
  await expect(page.locator(".smap__detail")).toHaveCount(0);
});
