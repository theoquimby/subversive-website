import { expect, type Page, test } from "@playwright/test";

// Phone solidity (2026-11-15, after Theo's iPhone showed content in the strip by the
// Dynamic Island and behind Safari's bottom bar, cut-off sheets, and asked that every link
// land at the right scroll position). What a test browser can check: that the things iOS
// Safari samples at each edge are there, that sheets fit the screen, and where links land.
// The tinting itself only shows on a real iPhone.

const scrollTo = (page: Page, y: number) =>
  page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
const rgb = (page: Page, sel: string) =>
  page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const route of ["/", "/menu", "/events", "/visit"]) {
  test(`the header stays pinned at the top edge while scrolling: ${route}`, async ({ page }) => {
    await page.goto(route);
    for (const y of [600, 1400, 900]) {
      await scrollTo(page, y);
      await page.waitForTimeout(300);
      const box = await page.locator("#site-header").boundingBox();
      expect(Math.round(box?.y ?? -1), `header top at scrollY ${y}`).toBe(0);
      expect(box?.width).toBe(page.viewportSize()?.width);
    }
    // opaque, and the page's own colour: this is what Safari paints the island's strip from
    expect(await rgb(page, "#site-header")).toBe(await rgb(page, "body"));
    expect(await rgb(page, "body")).not.toBe("rgba(0, 0, 0, 0)");
  });
}

test("a strip in the page's colour is fixed at the bottom edge on phones and tablets", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024, "phones and tablets");
  for (const route of ["/", "/events"]) {
    await page.goto(route);
    await scrollTo(page, 700);
    const strip = page.locator(".edge-bottom");
    const box = await strip.boundingBox();
    const vh = page.viewportSize()?.height ?? 0;
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(vh);
    expect(box?.height).toBeGreaterThanOrEqual(6);
    expect(box?.width).toBe(page.viewportSize()?.width);
    expect(await rgb(page, ".edge-bottom")).toBe(await rgb(page, "body"));
    // Safari finds the edge element by hit-testing: the strip must be what a touch 4 px inside
    // the bottom edge, at the middle, lands on
    const hit = await page.evaluate(
      () => document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 4)?.className,
    );
    expect(hit).toBe("edge-bottom");
    const top = await page.evaluate(() => document.elementFromPoint(window.innerWidth / 2, 4)?.className);
    expect(top).toBe("edge-top");
    expect(await rgb(page, ".edge-top")).toBe(await rgb(page, "body"));
    // it covers only the header's empty top: the logo and Order are still what a tap lands on
    await page.evaluate(() => window.scrollTo(0, 0));
    const brand = await page.locator("#site-header .brand").boundingBox();
    const onLink = (x: number, y: number) =>
      page.evaluate((at) => !!document.elementFromPoint(at.x, at.y)?.closest("a"), { x, y });
    expect(await onLink((brand?.x ?? 0) + 20, (brand?.y ?? 0) + (brand?.height ?? 0) / 2)).toBe(true);
  }
});

test("a sheet fits the screen, its close mark is reachable and its last line can be scrolled to", async ({
  page,
}) => {
  await page.goto("/menu?show=food");
  // the longest item on the menu, then the index with its filters
  for (const open of ['a[data-item="chicken-wings"]', ".mbar-index"]) {
    await page.locator(open).click();
    const sheet = page.locator(".sheet");
    await expect(sheet).toBeVisible();
    const box = await sheet.boundingBox();
    const vh = page.viewportSize()?.height ?? 0;
    expect(box?.y).toBeGreaterThanOrEqual(0);
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBeLessThanOrEqual(vh);
    await expect(sheet.getByRole("button", { name: "Close" })).toBeInViewport({ ratio: 1 });
    // whatever is last in the sheet can be brought fully into view inside it
    const last = sheet.locator(".sheet__body > * > *:last-child, .sheet__body > *:last-child").last();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport({ ratio: 1 });
    // ...with room under it to clear Safari's floating bar on a phone
    if ((page.viewportSize()?.width ?? 0) < 768) {
      const gap = await sheet.locator(".sheet__body").evaluate((b) => {
        b.scrollTop = b.scrollHeight;
        const lastEl = b.lastElementChild as HTMLElement;
        return b.getBoundingClientRect().bottom - lastEl.getBoundingClientRect().bottom;
      });
      expect(gap).toBeGreaterThanOrEqual(80);
    }
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toBeHidden();
  }
});

test("a link to another page lands at the top, from wherever it was tapped", async ({ page }) => {
  const hops: [string, string, RegExp][] = [
    ["/", '.site-footer a[href="/about"]', /\/about$/],
    ["/about", '.site-footer a[href="/private-events"]', /\/private-events$/],
    ["/events", ".events-month a[data-ticket] >> nth=-1", /\/events\/.+/],
    ["/visit", '.site-footer a[href="/"] >> nth=0', /\/$/],
  ];
  for (const [from, link, to] of hops) {
    await page.goto(from);
    const a = page.locator(link);
    await a.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => window.scrollY), `scrolled before leaving ${from}`).toBeGreaterThan(100);
    await a.click();
    await expect(page).toHaveURL(to);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY), { message: `top of ${to}` }).toBe(0);
  }
});

test("a link to a place on a page lands it just below the pinned header", async ({ page }) => {
  // Home's "All hours" goes to the hours on Visit
  await page.goto("/");
  const allHours = page.locator('a[href="/visit#hours"]').last();
  await allHours.scrollIntoViewIfNeeded();
  await allHours.click();
  await expect(page).toHaveURL(/\/visit#hours$/);
  const below = async (sel: string, stack: string[]) =>
    page.evaluate(
      ([s, st]) => {
        const edge = Math.max(
          ...(st as string[]).map((x) => document.querySelector(x)?.getBoundingClientRect().bottom ?? 0),
        );
        return Math.round(
          (document.querySelector(s as string) as HTMLElement).getBoundingClientRect().top - edge,
        );
      },
      [sel, stack] as const,
    );
  await expect
    .poll(() => below("#hours", ["#site-header"]), { message: "hours under the header" })
    .toBeGreaterThanOrEqual(0);
  expect(await below("#hours", ["#site-header"])).toBeLessThan(120);

  // the hero's "On the menu" goes to that beer's row, under the header and the menu's bar
  await page.goto("/");
  const more = page.locator(".tap-hero__more");
  const href = await more.getAttribute("href");
  const id = (href ?? "").split("#")[1] ?? "";
  await more.click();
  await expect(page).toHaveURL(new RegExp(`/menu#${id}$`));
  await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
  await expect
    .poll(() => below(`[id="${id}"]`, ["#site-header", ".menu-bar"]), { message: "row under the bar" })
    .toBeGreaterThanOrEqual(0);
});

test("Back returns to where the reader was", async ({ page }) => {
  await page.goto("/events");
  const ticket = page.locator(".events-month a[data-ticket]").last();
  await ticket.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(100);
  await ticket.click();
  await expect(page).toHaveURL(/\/events\/.+/);
  await page.goBack();
  await expect(page).toHaveURL(/\/events$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before - 80);
});

test("between page changes nothing fixed covers the screen: only the two edge strips are pinned", async ({
  page,
}) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 1024, "phones and tablets");
  for (const route of ["/", "/menu", "/events"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    const fixed = await page.evaluate(() => {
      const out: string[] = [];
      const check = (el: Element, pseudo?: string) => {
        const s = getComputedStyle(el, pseudo);
        if (s.position === "fixed" && s.display !== "none" && (pseudo ? s.content !== "none" : true))
          out.push(`${el.tagName.toLowerCase()}.${el.className}${pseudo ?? ""}`);
      };
      for (const el of document.querySelectorAll("body, body *")) {
        check(el);
        check(el, "::before");
        check(el, "::after");
      }
      return out;
    });
    // the mobile menu's toast and the share toast are fixed but small and away from the edges' middle
    expect(fixed.filter((f) => !f.includes("toast")).sort()).toEqual(["div.edge-bottom", "div.edge-top"]);
  }
});
