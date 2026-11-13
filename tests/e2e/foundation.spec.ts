import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Plan M0 tests: home 200 with no console errors and no CSP violations; no horizontal
// scroll at 320; checker rail present; /dev/kit is 404 unless the build set the flag.

async function watch(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (e) => {
      console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  return problems;
}

test("home is served with no console errors and no CSP violations", async ({ page }) => {
  const problems = await watch(page);
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  expect(res?.headers()["content-security-policy"]).toContain("default-src 'self'");
  await page.waitForLoadState("networkidle");
  expect(problems).toEqual([]);
});

// on a paper page; Home is a label page and carries no rail (tests/e2e/home.spec.ts)
test("the checker rail is the first thing on the page", async ({ page }) => {
  await page.goto("/visit");
  const rail = page.locator("[data-checker]").first();
  await expect(rail).toBeVisible();
  const box = await rail.boundingBox();
  expect(box?.y).toBe(0);
  expect(box?.height).toBeGreaterThanOrEqual(22); // one row at the top since M2 (refinement)
});

test("no horizontal scroll at 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the skip link appears on first Tab and targets main", async ({ page, isMobile }) => {
  test.skip(isMobile, "no physical keyboard on phones");
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.locator(".skip-link");
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await expect(skip).toHaveAttribute("href", "#main");
});

test("home passes axe", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test("/dev/kit exists only when the build set NEXT_PUBLIC_DEV_KIT=1", async ({ page }) => {
  const res = await page.goto("/dev/kit");
  if (process.env.NEXT_PUBLIC_DEV_KIT === "1") {
    expect(res?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  } else {
    expect(res?.status()).toBe(404);
  }
});

test("robots.txt disallows /dev", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toMatch(/Disallow: \/dev/);
});
