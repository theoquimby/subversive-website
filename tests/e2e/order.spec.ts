import { expect, type Page, test } from "@playwright/test";

// Ordering from the site's own menu. The test build has ordering built in but no Square
// keys, so the real routes answer "off"; these tests stand in for the three routes and for
// Square's card form, and check what the browser shows and what it sends. Whether Square
// itself accepts the order and the payment can only be checked against Square's sandbox
// with real test keys (see docs/ordering.md).

const SIDE = {
  id: "SIDE",
  name: "Side",
  min: 1,
  max: 1,
  options: [
    { id: "FRIES", name: "Fries", price: 0 },
    { id: "SALAD", name: "Side salad", price: 0 },
  ],
};
const ADD = {
  id: "ADD",
  name: "Add",
  min: 0,
  max: 2,
  options: [
    { id: "BACON", name: "Bacon", price: 300 },
    { id: "TOMATO", name: "Tomato", price: 50 },
  ],
};
const config = (over: Record<string, unknown> = {}) => ({
  enabled: true,
  sandbox: true,
  applicationId: "sandbox-app",
  locationId: "LOC1",
  open: true,
  prepMinutes: 20,
  items: {
    classic: {
      name: "Classic Smash Burger",
      variations: [{ id: "BURGER-V", name: "Regular", price: 1800 }],
      lists: [ADD, SIDE],
    },
    frites: { name: "Frites", variations: [{ id: "FRITES-V", name: "Regular", price: 1200 }], lists: [] },
  },
  ...over,
});

const FAKE_SQUARE = `window.Square = { payments: () => ({ card: async () => ({
  attach: async (el) => { el.innerHTML = '<input aria-label="Card number" />'; },
  tokenize: async (details) => { window.__tokenized = details; return { status: "OK", token: "tok-test" }; },
  destroy: async () => {},
}) }) };`;

async function standIn(
  page: Page,
  over: Record<string, unknown> = {},
  placed: { status: number; body: unknown } = {
    status: 200,
    body: { ok: true, total: 2274, reference: "AB12CD", prepMinutes: 20 },
  },
) {
  const sent: { quote: unknown[]; order: unknown[] } = { quote: [], order: [] };
  await page.route("**/api/order/config", (r) => r.fulfill({ json: config(over) }));
  await page.route("**/api/order/quote", (r) => {
    sent.quote.push(r.request().postDataJSON());
    return r.fulfill({ json: { total: 2274, tax: 174 } });
  });
  await page.route("**/api/order", (r) => {
    sent.order.push(r.request().postDataJSON());
    return r.fulfill({ status: placed.status, json: placed.body });
  });
  await page.route("https://sandbox.web.squarecdn.com/v1/square.js", (r) =>
    r.fulfill({ contentType: "text/javascript", body: FAKE_SQUARE }),
  );
  return sent;
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("with ordering off the site is as it was: Order links out to Square, no Add button", async ({
  page,
}) => {
  await page.goto("/menu?show=food&item=classic");
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Classic" })).toBeVisible();
  await expect(page.locator(".order-add")).toHaveCount(0);
  await page.getByRole("button", { name: "Close" }).click();
  const order = page.locator("#site-header .site-header__order");
  await expect(order).toHaveAttribute("href", /square/);
  await expect(order).toHaveAttribute("rel", "noopener");
});

test("add a burger with its options, see Square's total, pay, and get a confirmation", async ({ page }) => {
  const sent = await standIn(page);
  await page.goto("/menu?show=food&item=classic");
  const sheet = page.getByRole("dialog");
  const add = sheet.getByRole("button", { name: "Add to order" });
  // a side is required: no adding until one is chosen
  await expect(add).toBeDisabled();
  await sheet.getByRole("button", { name: /Bacon/ }).click();
  await sheet.getByRole("button", { name: "Fries" }).click();
  // a list that takes one swaps the choice
  await sheet.getByRole("button", { name: "Side salad" }).click();
  await expect(sheet.getByRole("button", { name: "Fries" })).toHaveAttribute("aria-pressed", "false");
  await sheet.getByRole("button", { name: "One more" }).click();
  await expect(add).toBeEnabled();
  await add.click();
  await expect(sheet.locator(".order-add__status")).toHaveText("Added to your order.");
  await sheet.getByRole("button", { name: "Your order · 2" }).click();

  const cart = page.getByRole("dialog").filter({ hasText: "Your order" }).last();
  await expect(cart.locator(".cart__name")).toHaveText("Classic");
  await expect(cart.locator(".cart__mods")).toHaveText("Bacon · Side salad");
  await expect(cart.locator(".cart__total dd")).toHaveText("$22.74");
  await expect(cart.getByText("Test mode: no real payment is taken.")).toBeVisible();
  expect(sent.quote.at(-1)).toEqual({
    lines: [{ itemId: "classic", quantity: 2, modifiers: ["BACON", "SALAD"] }],
  });

  // Square's form is in, and Pay waits for a name and a phone number
  await expect(cart.getByLabel("Card number")).toBeVisible();
  const pay = cart.getByRole("button", { name: "Pay $22.74" });
  await pay.click();
  await expect(cart.getByRole("alert")).toHaveText("Please add a name for the order.");
  expect(sent.order).toHaveLength(0);
  await cart.getByLabel("Name for the order").fill("Sam");
  await cart.getByLabel("Phone").fill("(518) 555-0100");
  await pay.click();

  await expect(cart.getByText("Thanks, Sam. Your order is in.")).toBeVisible();
  await expect(cart.getByText("Order AB12CD")).toBeVisible();
  expect(sent.order).toHaveLength(1);
  expect(sent.order[0]).toMatchObject({
    lines: [{ itemId: "classic", quantity: 2, modifiers: ["BACON", "SALAD"] }],
    name: "Sam",
    phone: "(518) 555-0100",
    token: "tok-test",
  });
  // no price and no card detail is ever sent by the browser; the total it was shown goes
  // along only so the server can refuse to charge a different one
  expect((sent.order[0] as { expectedTotal: number }).expectedTotal).toBe(2274);
  expect(Object.keys(sent.order[0] as object).sort()).toEqual([
    "expectedTotal",
    "idempotencyKey",
    "lines",
    "name",
    "phone",
    "token",
  ]);
  expect((sent.order[0] as { idempotencyKey: string }).idempotencyKey).toMatch(/^[A-Za-z0-9-]{16,40}$/);
  // the cart is emptied; the header's Order button no longer counts anything
  await cart.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("#site-header .site-header__order")).toHaveText("Order");
});

test("a declined card says so, keeps the order, and the next try uses a new key", async ({ page }) => {
  const sent = await standIn(page, {}, { status: 402, body: { error: "declined" } });
  await page.goto("/menu?show=food&item=frites");
  await page.getByRole("dialog").getByRole("button", { name: "Add to order" }).click();
  // close the item, then the header's Order button opens the order
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
  await expect(page.locator("#site-header .site-header__order")).toHaveText("Order · 1");
  await page.locator("#site-header .site-header__order").click();
  const cart = page.getByRole("dialog").filter({ hasText: "Your order" }).last();
  await cart.getByLabel("Name for the order").fill("Sam");
  await cart.getByLabel("Phone").fill("518 555 0100");
  const pay = cart.getByRole("button", { name: /^Pay/ });
  await pay.click();
  await expect(cart.getByRole("alert")).toHaveText("The card was declined. Please try another card.");
  await expect(cart.locator(".cart__name")).toHaveText("Frites");
  await pay.click();
  await expect.poll(() => sent.order.length).toBe(2);
  const keys = sent.order.map((o) => (o as { idempotencyKey: string }).idempotencyKey);
  expect(keys[0]).not.toBe(keys[1]);
});

test("when the kitchen is closed nothing can be added or paid for", async ({ page }) => {
  await standIn(page, { open: false });
  await page.goto("/menu?show=food&item=frites");
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("The kitchen is closed, so orders can't be placed right now.")).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Add to order" })).toHaveCount(0);
});

test("an item Square does not have offers no Add button", async ({ page }) => {
  await standIn(page);
  await page.goto("/menu?show=food&item=house-salad");
  await expect(page.getByRole("dialog").getByRole("heading", { name: "House Salad" })).toBeVisible();
  await expect(page.locator(".order-add")).toHaveCount(0);
});
