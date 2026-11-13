import { expect, type Page, test } from "@playwright/test";

// The sticky stack (critique 2026-11-13, P0). Measured faults this guards against:
//   · the header was see-through for the first 80 px of scroll on every route
//   · /menu's sticky bar flipped between two positions across a band of scroll positions
//   · page content showed in a gap above a pinned bar while the header was hidden
//   · the menu's section chips never appeared after an in-site navigation
const ROUTES = ["/", "/menu", "/menu?show=food", "/events", "/visit"];

const scrollTo = (page: Page, y: number) =>
  page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);

for (const route of ROUTES) {
  test(`the header is opaque while pinned: ${route}`, async ({ page }) => {
    await page.goto(route);
    for (const y of [40, 60, 80, 200]) {
      await scrollTo(page, y);
      const alpha = await page.locator("#site-header").evaluate((el) => {
        const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor);
        const parts = (m?.[1] ?? "").split(",").map((s) => Number(s.trim()));
        return parts.length === 4 ? parts[3] : 1;
      });
      expect(alpha, `header background at scrollY ${y}`).toBe(1);
    }
  });
}

test("the menu bar never reverses while scrolling down, and sits flush under the header or the top", async ({
  page,
}) => {
  test.setTimeout(90_000); // 37 scroll steps, each waiting out the 220 ms transition
  await page.goto("/menu");
  const tops: number[] = [];
  for (let y = 100; y <= 460; y += 10) {
    await scrollTo(page, y);
    await page.waitForTimeout(260); // past the 220 ms transition
    const state = await page.evaluate(() => {
      const bar = document.querySelector(".menu-bar") as HTMLElement;
      const header = document.getElementById("site-header") as HTMLElement;
      const hidden = document.documentElement.dataset.header === "hidden";
      return {
        barTop: Math.round(bar.getBoundingClientRect().top),
        headerBottom: hidden ? 0 : Math.round(header.getBoundingClientRect().bottom),
        natural: Math.round(
          (document.querySelector(".menu-bar-sentinel") as HTMLElement).getBoundingClientRect().top,
        ),
      };
    });
    tops.push(state.barTop);
    // pinned: flush under whatever is above it, never floating with a gap
    if (state.natural < state.headerBottom) {
      expect(
        Math.abs(state.barTop - state.headerBottom),
        `gap above the bar at scrollY ${y}`,
      ).toBeLessThanOrEqual(1);
    }
  }
  const reversals = tops.filter((t, i) => i > 0 && t > (tops[i - 1] as number)).length;
  expect(reversals, `bar tops while scrolling down: ${tops.join(",")}`).toBe(0);
});

test("the bar follows the header back when scrolling up", async ({ page }) => {
  await page.goto("/menu");
  await scrollTo(page, 1200);
  await page.waitForTimeout(300);
  await scrollTo(page, 1100);
  await page.waitForTimeout(400);
  const gap = await page.evaluate(() => {
    const bar = document.querySelector(".menu-bar") as HTMLElement;
    const header = document.getElementById("site-header") as HTMLElement;
    const hidden = document.documentElement.dataset.header === "hidden";
    return Math.round(bar.getBoundingClientRect().top - (hidden ? 0 : header.getBoundingClientRect().bottom));
  });
  expect(Math.abs(gap)).toBeLessThanOrEqual(1);
});

test("nothing but the header is pinned on /events", async ({ page }) => {
  await page.goto("/events");
  await scrollTo(page, 1200);
  await page.waitForTimeout(300);
  const pinned = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("main *")]
      .filter((el) => ["sticky", "fixed"].includes(getComputedStyle(el).position))
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.top < 120 && r.bottom > 0 && getComputedStyle(el).opacity !== "0";
      })
      .map((el) => el.className),
  );
  expect(pinned).toEqual([]);
});

test("the menu's section chips are there after an in-site navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "See the menu" }).click();
  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.locator("[data-menu]")).toHaveAttribute("data-show", "drinks");
  await expect(page.locator('.chips[data-for="drinks"]')).toBeVisible();
  await expect(page.locator('[data-list="food"]')).toBeHidden();
});

test("night pages tint the browser chrome night, paper pages paper", async ({ page }) => {
  await page.goto("/events");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", /#0f0e0c/i);
  await page.goto("/menu");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", /#f5ecdc/i);
});
