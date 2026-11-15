import { expect, test } from "@playwright/test";

// The private-event inquiry form posts to Ops (contract §5). The test build points it at a
// stand-in address (ci.yml: NEXT_PUBLIC_OPS_ORIGIN) and these tests answer for Ops.
const OPS = "https://ops.test/api/public/inquiry";
const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type" };

test("a filled form is sent to Ops as the contract asks, and thanks the guest", async ({ page }) => {
  let sent: Record<string, unknown> | null = null;
  await page.route(OPS, async (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    sent = route.request().postDataJSON();
    await route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.goto("/private-events");
  await page.getByLabel("Name").fill("Pat Example");
  await page.getByLabel("Email").fill("pat@example.com");
  await page.getByLabel(/^Date/).fill("12/05/2026");
  await page.getByLabel(/^Guests/).fill("40");
  await page.getByText("Birthday", { exact: true }).click();
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByRole("status")).toContainText("We have your inquiry");
  expect(sent).toEqual({
    name: "Pat Example",
    email: "pat@example.com",
    date: "2026-12-05",
    guests: 40,
    type: "Birthday",
    website: "",
  });
});

test("the form asks for a name and a way to reach the person before sending anything", async ({ page }) => {
  let calls = 0;
  await page.route(OPS, (route) => {
    calls++;
    return route.fulfill({
      status: 200,
      headers: cors,
      contentType: "application/json",
      body: '{"ok":true}',
    });
  });
  await page.goto("/private-events");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByText("Please add your name.")).toBeVisible();
  await page.getByLabel("Name").fill("Pat Example");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByText("Please add an email or a phone number.")).toBeVisible();
  await page.getByLabel("Phone").fill("518 555 0100");
  await page.getByLabel(/^Date/).fill("next Friday");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByText("Please write the date as MM/DD/YYYY.")).toBeVisible();
  expect(calls).toBe(0);
});

test("an error from Ops is shown beside its field; a failure says to call or email", async ({ page }) => {
  let n = 0;
  await page.route(OPS, async (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    n++;
    if (n === 1) {
      return route.fulfill({
        status: 400,
        headers: cors,
        contentType: "application/json",
        body: '{"ok":false,"error":"Check the email address.","field":"email"}',
      });
    }
    return route.abort();
  });
  await page.goto("/private-events");
  await page.getByLabel("Name").fill("Pat Example");
  await page.getByLabel("Email").fill("pat@example");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByText("Check the email address.")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.locator(".inquiry [role=alert]")).toContainText("Please email or call us instead.");
});

test("the phone and the email link are there as the other ways to ask", async ({ page }) => {
  await page.goto("/private-events");
  const main = page.locator("main");
  await expect(main.locator('a[href^="tel:"]')).toBeVisible();
  await expect(main.getByRole("link", { name: "Email us" })).toHaveAttribute("href", /^mailto:/);
});
