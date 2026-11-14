import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Home's first screen (overhaul proof, 2026-11-13: "The label, poured"). The clock is
// frozen in the browser where a test needs tonight; the menu and the seed drive the rest.

const name = (page: Page) => page.locator(".tap-hero__name");
const count = (page: Page) => page.locator(".tap-hero__count");
const footTop = (page: Page) =>
  page.evaluate(() => document.querySelector(".hero__foot")?.getBoundingClientRect().top ?? -1);

test("the first phone screen holds the pill, the beer, the glass, the brewery line and both actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 659 });
  await page.goto("/");
  for (const loc of [
    page.locator(".hero .open-now"),
    name(page),
    page.locator(".tap-hero__meta"),
    page.getByRole("button", { name: "Tap to pour the next beer" }),
    page.getByRole("heading", { level: 1 }),
    page.locator(".hero").getByRole("link", { name: "See the menu" }),
    page.locator(".hero").getByRole("link", { name: /Directions/ }),
  ]) {
    await expect(loc).toBeInViewport({ ratio: 1 });
  }
  // the flagship is in the glass on arrival
  await expect(name(page)).toHaveText("New York Nectar");
  await expect(page.locator(".tap-hero__meta")).toHaveText("New York IPA · 7.0%");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the first screen is on the menu's paper, with its checker rail, and no photo to wait for", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("[data-hero]")).toHaveAttribute("data-skin", "paper");
  await expect(page.locator("[data-checker]").first()).toBeVisible();
  await expect(page.locator(".hero img")).toHaveCount(0);
});

test("tapping the glass pours the next beer and nothing on the page moves", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 659 });
  await page.goto("/");
  const before = await footTop(page);
  await expect(count(page)).toHaveText(/^01 \/ \d\d$/);
  await page.getByRole("button", { name: "Tap to pour the next beer" }).click();
  await expect(name(page)).not.toHaveText("New York Nectar");
  await expect(count(page)).toHaveText(/^02 \/ \d\d$/);
  // a screen reader hears the new beer; the link follows it to its row on the menu
  const poured = (await name(page).innerText()).trim();
  await expect(page.locator(".tap-hero [aria-live]")).toContainText(new RegExp(poured, "i"));
  await expect(page.locator(".tap-hero__more")).toHaveAttribute("href", /^\/menu#.+/);
  expect(await footTop(page)).toBe(before);
});

test("the arrows do the same from a keyboard, and wrap", async ({ page }) => {
  await page.goto("/");
  const total = Number((await count(page).innerText()).split("/")[1]);
  await page.getByRole("button", { name: "Previous beer", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(count(page)).toHaveText(new RegExp(`^${String(total).padStart(2, "0")} /`));
  await page.getByRole("button", { name: "Next beer", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(count(page)).toHaveText(/^01 \//);
  await expect(name(page)).toHaveText("New York Nectar");
});

test("a sideways swipe on the glass pours once, in the swipe's direction", async ({ page }) => {
  await page.goto("/");
  const box = await page.locator(".tap-hero__glass").boundingBox();
  if (!box) throw new Error("no glass");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width - 8, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 8, y, { steps: 4 });
  await page.mouse.up();
  await expect(count(page)).toHaveText(/^02 \//);
});

test("every beer's name stays inside its two lines and clear of the glass on the narrowest phone", async ({
  page,
}) => {
  // layout only: no pour animation, so eleven clicks stay quick on a loaded machine
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const total = Number((await count(page).innerText()).split("/")[1]);
  const before = await footTop(page);
  for (let i = 0; i < total; i++) {
    const fault = await page.evaluate(() => {
      const h = document.querySelector(".tap-hero__name");
      const s = h?.querySelector("span");
      if (!h || !s) return "missing";
      const over =
        s.scrollWidth > h.clientWidth + 1 ||
        s.getBoundingClientRect().height > h.getBoundingClientRect().height + 1;
      // the glass's rim rises into the name's block: no letter may sit under it
      const g = document.querySelector(".tap-hero__glass")?.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(s);
      const hit = g
        ? [...range.getClientRects()].some((r) => r.right > g.left && r.bottom > g.top + 1)
        : true;
      return over || hit ? s.textContent : null;
    });
    expect(fault).toBeNull();
    expect(await footTop(page)).toBe(before);
    // a scripted click: the real pointer path has its own tests above, and eleven
    // actionability waits time out on a loaded WebKit
    await page
      .getByRole("button", { name: "Next beer", exact: true })
      .evaluate((b) => (b as HTMLButtonElement).click());
    await expect(count(page)).not.toHaveText(new RegExp(`^${String(i + 1).padStart(2, "0")} /`));
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("See the menu goes to /menu; Directions is external", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero").getByRole("link", { name: /Directions/ })).toHaveAttribute(
    "rel",
    "noopener",
  );
  await page.locator(".hero").getByRole("link", { name: "See the menu" }).click();
  await expect(page).toHaveURL(/\/menu$/);
});

test("a game night does not take over the first screen: the pill carries it in one line", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-13T17:00:00-05:00") });
  await page.goto("/");
  await expect(page.locator(".hero .open-now")).toContainText("Open late tonight · Knicks at 7:00");
  await expect(page.locator(".hero .matchup")).toHaveCount(0);
});

test("with reduced motion the glass arrives full and still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // the scene's own keyframe animations (the pour, the line, the bubbles); a colour
  // transition on the status pill when the browser corrects the time is not motion here
  const moving = await page.evaluate(
    () =>
      document
        .querySelector(".hero__scene")
        ?.getAnimations({ subtree: true })
        .filter((a) => a instanceof CSSAnimation).length ?? -1,
  );
  expect(moving).toBe(0);
});

test("axe: home", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
});

test("axe: home, after a pour", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Next beer", exact: true }).click();
  const r = await new AxeBuilder({ page }).include(".hero").analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
});
