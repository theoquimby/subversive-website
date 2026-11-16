import { expect, test } from "@playwright/test";

// Our beer: the supplier map lives here only (Theo, 2026-11-15; it was also on Home).
test("where it comes from: choosing a source moves the map; no detail view opens", async ({ page }) => {
  await page.goto("/beer");
  const rows = page.locator(".smap__row");
  await expect(rows.first()).toBeVisible();
  // it opens on the top of the list: grain, the whole state
  await expect(rows.first()).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".smap__state")).toHaveAttribute("data-all", "");
  await expect(page.locator(".smap__route")).toHaveCount(0);
  // moving a pointer over the list changes nothing: a choice is a click
  await rows.filter({ hasText: "Indian Ladder" }).hover();
  await expect(page.locator(".smap__route")).toHaveCount(0);
  // a source with a town: its road is drawn and its town is named
  await rows.filter({ hasText: "Indian Ladder" }).click();
  await expect(page.locator(".smap__route")).toHaveCount(1);
  await expect(page.locator(".smap__label").first()).toHaveText("Altamont");
  // a statewide source lights the whole state; nothing opens under the row
  const grain = rows.filter({ hasText: "100% New York" });
  await grain.click();
  await expect(page.locator(".smap__state")).toHaveAttribute("data-all", "");
  await expect(grain).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".smap__list img")).toHaveCount(0);
  await expect(grain).not.toHaveAttribute("aria-expanded");
});
