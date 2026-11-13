import { expect, test } from "@playwright/test";

// Plan M5 flows, on the seed (OPS_EVENTS_URL is empty in tests).
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("list → ticket → event page", async ({ page }) => {
  await page.goto("/events");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("What's on");
  const ticket = page.locator('[data-event-list] a[href^="/events/"]').first();
  const href = await ticket.getAttribute("href");
  await ticket.click();
  await expect(page).toHaveURL(href ?? "");
  await expect(page.locator(".event-hero__title")).toBeVisible();
});

test("filter chips hide non-matching tickets", async ({ page }) => {
  await page.goto("/events");
  const trivia = page.locator('[data-category="trivia-movies"]');
  const games = page.locator('[data-category="games"]');
  await page.getByRole("button", { name: "Trivia & movies" }).click();
  await expect(trivia.first()).toBeVisible();
  await expect(games.first()).toBeHidden();
  await page.getByRole("button", { name: "All" }).click();
  await expect(games.first()).toBeVisible();
});

test(".ics download: filename and text/calendar; unknown id is 404", async ({ request }) => {
  const res = await request.get("/api/events/seed-2026-12-10-trivia/ics");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/calendar");
  expect(res.headers()["content-disposition"]).toContain(
    'filename="2026-12-10-trivia-with-smarty-pints.ics"',
  );
  expect(await res.text()).toContain("DTSTART;TZID=America/New_York:20261210T183000");
  expect((await request.get("/api/events/nope/ics")).status()).toBe(404);
});

test("an old-title slug redirects to the event", async ({ page }) => {
  const res = await page.goto("/events/2026-12-10-trivia-night");
  expect(res?.url()).toContain("/events/2026-12-10-trivia-with-smarty-pints");
});

test("a past slug that is gone says this one's over, noindex", async ({ page }) => {
  await page.goto("/events/2026-10-03-oktoberfest");
  await expect(page.getByText("This one's over").first()).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("an unknown slug is a 404", async ({ page }) => {
  const res = await page.goto("/events/not-a-slug");
  expect(res?.status()).toBe(404);
});

test("the revalidate route refuses without the secret", async ({ request }) => {
  expect((await request.post("/api/revalidate")).status()).toBe(401);
});

test("add to calendar opens its menu", async ({ page }) => {
  await page.goto("/events/2026-12-10-trivia-with-smarty-pints");
  await page.getByRole("button", { name: "Add to calendar" }).click();
  await expect(page.getByRole("menuitem", { name: /Google Calendar/ })).toHaveAttribute(
    "href",
    /calendar\.google\.com/,
  );
  await expect(page.getByRole("menuitem", { name: "Apple Calendar" })).toHaveAttribute(
    "href",
    "/api/events/seed-2026-12-10-trivia/ics",
  );
});
