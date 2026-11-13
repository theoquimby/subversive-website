import { expect, test } from "@playwright/test";

// Plan M2 shell flows, on phone and desktop projects.
const PAGES = [
  { href: "/menu", label: "Menu", h1: "Menu" },
  { href: "/events", label: "Events", h1: "What's on" },
  { href: "/visit", label: "Visit", h1: "Find us" },
  { href: "/beer", label: "Our beer", h1: "Our beer" },
];

test("every nav link navigates; the header persists; back returns", async ({ page, isMobile }) => {
  await page.goto("/");
  for (const p of PAGES) {
    if (isMobile) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: new RegExp(p.label) })
        .click();
    } else {
      await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: p.label }).click();
    }
    await expect(page).toHaveURL(p.href);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(p.h1);
    await expect(page.locator("#site-header")).toBeVisible();
  }
  await page.goBack();
  await expect(page).toHaveURL("/visit");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Find us");
});

test("desktop nav marks the current page", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop nav");
  await page.goto("/events");
  const current = page.getByRole("navigation", { name: "Main" }).locator('[aria-current="page"]');
  await expect(current).toHaveText("Events");
});

test("unknown URLs get the site's 404 with three working buttons", async ({ page }) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("This keg’s kicked.");
  for (const [name, url] of [
    ["Menu", "/menu"],
    ["Events", "/events"],
    ["Home", "/"],
  ] as const) {
    await page.goto("/no-such-page");
    await page.getByRole("main").getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(url);
  }
});

test("mobile menu locks scroll, traps focus, and Escape returns focus", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone menu");
  await page.goto("/menu");
  const trigger = page.getByRole("button", { name: "Menu", exact: true });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-scroll-locked", /.*/);
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  const inside = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
  expect(inside).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("keyboard: skip link, then the brand, then the nav", async ({ page, isMobile }) => {
  test.skip(isMobile, "no physical keyboard on phones");
  await page.goto("/menu");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#site-header .brand")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Menu" }),
  ).toBeFocused();
});

test("reduced motion: navigations run no view-transition animation", async ({ page, isMobile }) => {
  test.skip(isMobile, "one project is enough");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/menu");
  const animations = await page.evaluate(async () => {
    const link = document.querySelector<HTMLAnchorElement>('nav[aria-label="Main"] a[href="/visit"]');
    link?.click();
    await new Promise((r) => setTimeout(r, 120));
    return (
      document
        .getAnimations()
        .filter((a) =>
          String((a.effect as KeyframeEffect | null)?.pseudoElement ?? "").includes("view-transition"),
        )
        // React keeps a transition alive with zero-length animations of its own; they move nothing
        .filter((a) => Number(a.effect?.getTiming().duration ?? 0) > 0).length
    );
  });
  expect(animations).toBe(0);
});
