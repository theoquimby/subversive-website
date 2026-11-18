import { afterEach, describe, expect, it, vi } from "vitest";
import { alcoholAllowed, orderables } from "@/lib/order/catalog";
import {
  lineItems,
  OrderProblem,
  orderRequest,
  place,
  quote,
  quoteRequest,
  squarePhone,
} from "@/lib/order/order";
import { sameOrigin } from "@/lib/order/origin";
import { type SquareEnv, SquareError, squareEnv } from "@/lib/square/api";

const LOC = "LOC1";
const usd = (amount: number) => ({ amount, currency: "USD" });
const item = (
  id: string,
  name: string,
  extra: Record<string, unknown> = {},
  top: Record<string, unknown> = {},
) => ({
  type: "ITEM",
  id,
  ...top,
  item_data: {
    name,
    variations: [
      {
        type: "ITEM_VARIATION",
        id: `${id}-V`,
        item_variation_data: { name: "Regular", pricing_type: "FIXED_PRICING", price_money: usd(1800) },
      },
    ],
    ...extra,
  },
});
const CATALOG = [
  item("BURGER", "Classic Smash Burger", {
    modifier_list_info: [
      { modifier_list_id: "ADD", min_selected_modifiers: -1, max_selected_modifiers: -1 },
      { modifier_list_id: "SIDE" },
    ],
  }),
  item("WINGS", "Wings (6)", {
    modifier_list_info: [{ modifier_list_id: "SAUCE", min_selected_modifiers: 1, max_selected_modifiers: 1 }],
  }),
  item("LIL", "Lil' Burger", {
    variations: [
      {
        type: "ITEM_VARIATION",
        id: "LIL-A",
        item_variation_data: { name: "Plain", pricing_type: "FIXED_PRICING", price_money: usd(900) },
      },
      {
        type: "ITEM_VARIATION",
        id: "LIL-B",
        item_variation_data: { name: "With fries", pricing_type: "FIXED_PRICING", price_money: usd(1100) },
      },
    ],
  }),
  item("OLD", "Chili Cheese Dog", { is_archived: true }),
  item("ELSEWHERE", "Frites", {}, { present_at_all_locations: false, present_at_location_ids: ["OTHER"] }),
  item("OPEN", "House Salad", {
    variations: [
      {
        type: "ITEM_VARIATION",
        id: "OPEN-V",
        item_variation_data: { name: "Market", pricing_type: "VARIABLE_PRICING" },
      },
    ],
  }),
  {
    type: "MODIFIER_LIST",
    id: "ADD",
    modifier_list_data: {
      name: "Add",
      modifiers: [
        { type: "MODIFIER", id: "BACON", modifier_data: { name: "Bacon", price_money: usd(300) } },
        { type: "MODIFIER", id: "TOMATO", modifier_data: { name: "Tomato", price_money: usd(50) } },
        { type: "MODIFIER", id: "SECRET", modifier_data: { name: "Staff only", hidden_online: true } },
      ],
    },
  },
  {
    type: "MODIFIER_LIST",
    id: "SIDE",
    modifier_list_data: {
      name: "Side",
      min_selected_modifiers: 1,
      max_selected_modifiers: 1,
      modifiers: [
        { type: "MODIFIER", id: "FRIES", modifier_data: { name: "Fries" } },
        { type: "MODIFIER", id: "SALAD", modifier_data: { name: "Side salad" } },
      ],
    },
  },
  {
    type: "MODIFIER_LIST",
    id: "SAUCE",
    modifier_list_data: {
      name: "Sauce",
      modifiers: [{ type: "MODIFIER", id: "BUFFALO", modifier_data: { name: "Buffalo" } }],
    },
  },
  { type: "TAX", id: "T", junk: true },
  "not an object",
];

const catalog = orderables(CATALOG, LOC);
const items = {
  classic: catalog.get("classic"),
  "chicken-wings": catalog.get("chicken wings"),
  "lil-burger": catalog.get("lil' burger"),
} as Record<string, NonNullable<ReturnType<typeof catalog.get>>>;

describe("what can be ordered, from Square's catalog", () => {
  it("matches Square's names to the menu's and keeps only what the taproom sells at a fixed price", () => {
    expect([...catalog.keys()].sort()).toEqual(["chicken wings", "classic", "lil' burger"]);
    expect(catalog.get("classic")?.variations).toEqual([{ id: "BURGER-V", name: "Regular", price: 1800 }]);
  });

  it("reads each option list's limits, the item's own first, and hides options hidden online", () => {
    const [add, side] = catalog.get("classic")?.lists ?? [];
    expect(add).toMatchObject({ id: "ADD", min: 0, max: 2 });
    expect(add?.options.map((o) => o.name)).toEqual(["Bacon", "Tomato"]);
    expect(side).toMatchObject({ id: "SIDE", min: 1, max: 1 });
    expect(catalog.get("chicken wings")?.lists[0]).toMatchObject({ min: 1, max: 1 });
  });
});

describe("an order's lines, checked against the catalog", () => {
  const ok = { itemId: "classic", quantity: 2, modifiers: ["BACON", "FRIES"] };

  it("become Square line items: the variation's id, the quantity as text, the options", () => {
    expect(lineItems([ok], items)).toEqual([
      {
        catalog_object_id: "BURGER-V",
        quantity: "2",
        modifiers: [{ catalog_object_id: "BACON" }, { catalog_object_id: "FRIES" }],
      },
    ]);
    expect(
      lineItems([{ itemId: "lil-burger", variationId: "LIL-B", quantity: 1, modifiers: [] }], items),
    ).toEqual([{ catalog_object_id: "LIL-B", quantity: "1" }]);
  });

  const refuses = (line: Parameters<typeof lineItems>[0][number], code: string) => {
    try {
      lineItems([line], items);
      throw new Error("was accepted");
    } catch (e) {
      expect(e).toBeInstanceOf(OrderProblem);
      expect((e as OrderProblem).code).toBe(code);
    }
  };

  it("refuses an item Square does not have", () =>
    refuses({ itemId: "lobster-roll", quantity: 1, modifiers: [] }, "unknown-item"));
  it("refuses a missing required choice", () =>
    refuses({ itemId: "classic", quantity: 1, modifiers: ["BACON"] }, "bad-options"));
  it("refuses more than a list allows", () =>
    refuses({ itemId: "classic", quantity: 1, modifiers: ["FRIES", "SALAD"] }, "bad-options"));
  it("refuses an option from another item's list", () =>
    refuses({ itemId: "classic", quantity: 1, modifiers: ["FRIES", "BUFFALO"] }, "bad-options"));
  it("refuses an option hidden online", () =>
    refuses({ itemId: "classic", quantity: 1, modifiers: ["FRIES", "SECRET"] }, "bad-options"));
  it("refuses the same option twice", () =>
    refuses({ itemId: "classic", quantity: 1, modifiers: ["FRIES", "FRIES"] }, "bad-options"));
  it("refuses an item with sizes when none, or a wrong one, is chosen", () => {
    refuses({ itemId: "lil-burger", quantity: 1, modifiers: [] }, "bad-options");
    refuses({ itemId: "lil-burger", variationId: "BURGER-V", quantity: 1, modifiers: [] }, "bad-options");
  });
});

describe("what the order routes accept", () => {
  const base = {
    lines: [{ itemId: "classic", quantity: 1, modifiers: [] }],
    name: "Sam",
    phone: "(518) 555-0100",
    token: "cnon:x",
    idempotencyKey: "0f8fad5b-d9cb-469f-a165-70867728950e",
    expectedTotal: 1944,
  };
  it("takes a plain order", () => expect(orderRequest.safeParse(base).success).toBe(true));
  it.each([
    ["no total to hold Square's against", { ...base, expectedTotal: undefined }],
    ["a total that is not whole cents", { ...base, expectedTotal: 19.44 }],
    ["no lines", { ...base, lines: [] }],
    ["a quantity of zero", { ...base, lines: [{ itemId: "classic", quantity: 0, modifiers: [] }] }],
    ["a quantity of fifty", { ...base, lines: [{ itemId: "classic", quantity: 50, modifiers: [] }] }],
    [
      "a price sent by the browser",
      { ...base, lines: [{ itemId: "classic", quantity: 1, modifiers: [], price: 1 }] },
    ],
    ["no name", { ...base, name: "  " }],
    ["a phone that is not a number", { ...base, phone: "call me" }],
    ["no card token", { ...base, token: "" }],
    ["a key too long for Square's payment call", { ...base, idempotencyKey: "x".repeat(44) }],
    ["an extra field", { ...base, total: 1 }],
  ])("refuses %s", (_, body) => expect(orderRequest.safeParse(body).success).toBe(false));
  it("a quote needs only lines", () => {
    expect(quoteRequest.safeParse({ lines: base.lines }).success).toBe(true);
    expect(quoteRequest.safeParse({ lines: base.lines, name: "x" }).success).toBe(false);
  });
});

describe("the order routes answer only this site's pages", () => {
  const req = (headers: Record<string, string>) =>
    new Request("https://site.test/api/order", { method: "POST", headers });
  it("accepts the site's own origin and a request with none", () => {
    expect(sameOrigin(req({ origin: "https://site.test", host: "site.test" }))).toBe(true);
    expect(sameOrigin(req({ host: "site.test" }))).toBe(true);
  });
  it("refuses another site's", () => {
    expect(sameOrigin(req({ origin: "https://evil.test", host: "site.test" }))).toBe(false);
    expect(sameOrigin(req({ origin: "null", host: "site.test" }))).toBe(false);
  });
});

describe("what is kept out of ordering", () => {
  const sold = (extra: Record<string, unknown>) =>
    item("FRITES", "Frites", {
      variations: [
        {
          type: "ITEM_VARIATION",
          id: "FRITES-V",
          item_variation_data: {
            name: "Regular",
            pricing_type: "FIXED_PRICING",
            price_money: usd(1200),
            location_overrides: [
              { location_id: "OTHER", sold_out: true, price_money: usd(900) },
              { location_id: LOC, ...extra },
            ],
          },
        },
      ],
    });
  const at = new Date("2026-11-18T23:00:00Z");

  it("an item the till has marked sold out at the taproom, until Square says it is back", () => {
    expect(orderables([sold({ sold_out: true })], LOC, { now: at }).size).toBe(0);
    expect(
      orderables([sold({ sold_out: true, sold_out_valid_until: "2026-11-19T10:00:00Z" })], LOC, { now: at })
        .size,
    ).toBe(0);
    expect(
      orderables([sold({ sold_out: true, sold_out_valid_until: "2026-11-18T10:00:00Z" })], LOC, { now: at })
        .size,
    ).toBe(1);
    // sold out somewhere else is not sold out here
    expect(orderables([sold({})], LOC, { now: at }).get("frites")?.variations[0]?.price).toBe(1200);
  });

  it("shows the taproom's own price where Square has one", () => {
    expect(orderables([sold({ price_money: usd(1300) })], LOC).get("frites")?.variations[0]?.price).toBe(
      1300,
    );
    expect(orderables([sold({ pricing_type: "VARIABLE_PRICING" })], LOC).size).toBe(0);
  });

  it("a sold-out option, and an item whose required choice has no options left", () => {
    const list = (soldOut: boolean) => ({
      type: "MODIFIER_LIST",
      id: "SAUCE",
      modifier_list_data: {
        name: "Sauce",
        modifiers: [
          {
            type: "MODIFIER",
            id: "BUFFALO",
            modifier_data: { name: "Buffalo", location_overrides: [{ location_id: LOC, sold_out: soldOut }] },
          },
          { type: "MODIFIER", id: "BBQ", modifier_data: { name: "Barbecue" } },
        ],
      },
    });
    const wings = (min: number) =>
      item("WINGS", "Wings (6)", {
        modifier_list_info: [
          { modifier_list_id: "SAUCE", min_selected_modifiers: min, max_selected_modifiers: 2 },
        ],
      });
    const names = (objects: unknown[]) =>
      orderables(objects, LOC)
        .get("chicken wings")
        ?.lists[0]?.options.map((o) => o.name);
    expect(names([wings(1), list(false)])).toEqual(["Buffalo", "Barbecue"]);
    expect(names([wings(1), list(true)])).toEqual(["Barbecue"]);
    // two sauces are required and only one is left: the wings cannot be ordered
    expect(orderables([wings(2), list(true)], LOC).size).toBe(0);
  });

  const BAR = [
    item("PILS", "Pilsner", { is_alcoholic: true }),
    item("CAN", "Farmhouse Ale 4-pack", { categories: [{ id: "CAT-CANS" }] }),
    item("SPRITZ", "Spritz", { reporting_category: { id: "CAT-COCKTAILS" } }),
    item("RED", "House Red", { category_id: "CAT-WINE" }),
    item("PRETZEL", "Beer Cheese Pretzel", { categories: [{ id: "CAT-SNACKS" }] }),
    { type: "CATEGORY", id: "CAT-CANS", category_data: { name: "Cans To Go" } },
    { type: "CATEGORY", id: "CAT-COCKTAILS", category_data: { name: "Cocktails" } },
    { type: "CATEGORY", id: "CAT-WINE", category_data: { name: "Wine & Cider" } },
    { type: "CATEGORY", id: "CAT-SNACKS", category_data: { name: "Snacks" } },
  ];

  it("beer, wine and cocktails: by Square's own mark or by the category they are filed under", () => {
    expect([...orderables(BAR, LOC).keys()]).toEqual(["beer cheese pretzel"]);
  });

  it("unless the item is named in the allow-list, which is empty by default", () => {
    expect(alcoholAllowed(undefined).size).toBe(0);
    expect(alcoholAllowed(" ").size).toBe(0);
    const allow = alcoholAllowed("CAN, House Red");
    expect([...orderables(BAR, LOC, { alcohol: allow }).keys()].sort()).toEqual([
      "beer cheese pretzel",
      "farmhouse ale 4-pack",
      "house red",
    ]);
  });
});

describe("a phone number, the way Square takes it", () => {
  it.each([
    ["(518) 555-0100", "+15185550100"],
    ["518.555.0100", "+15185550100"],
    ["1 518 555 0100", "+15185550100"],
    ["+1 (518) 555-0100", "+15185550100"],
    ["+44 20 7946 0958", "+442079460958"],
  ])("%s → %s", (raw, out) => expect(squarePhone(raw)).toBe(out));
  it.each(["555-0100", "518 555 0100 ext 22", "+1 518", "0000000000000000000"])("refuses %s", (raw) =>
    expect(squarePhone(raw)).toBeNull(),
  );
});

describe("the Square set-up", () => {
  afterEach(() => vi.unstubAllEnvs());
  const set = (over: Record<string, string>) => {
    const all = {
      NEXT_PUBLIC_ORDERING: "on",
      SQUARE_ACCESS_TOKEN: "t",
      SQUARE_LOCATION_ID: LOC,
      SQUARE_APPLICATION_ID: "sandbox-app",
      SQUARE_ENVIRONMENT: "",
      ...over,
    };
    for (const [k, v] of Object.entries(all)) vi.stubEnv(k, v);
  };

  it("is the sandbox unless production is asked for by name", () => {
    set({});
    expect(squareEnv()).toMatchObject({ sandbox: true, base: "https://connect.squareupsandbox.com/v2" });
    set({ SQUARE_ENVIRONMENT: "production", SQUARE_APPLICATION_ID: "app-live" });
    expect(squareEnv()).toMatchObject({ sandbox: false, base: "https://connect.squareup.com/v2" });
  });

  it("stays off when anything is missing, or when the switch is not on", () => {
    set({ NEXT_PUBLIC_ORDERING: "" });
    expect(squareEnv()).toBeNull();
    set({ SQUARE_ACCESS_TOKEN: "" });
    expect(squareEnv()).toBeNull();
    set({ SQUARE_LOCATION_ID: "" });
    expect(squareEnv()).toBeNull();
  });

  it("stays off when the application id and the environment disagree", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    set({ SQUARE_ENVIRONMENT: "production" }); // a sandbox id, asked to take real money
    expect(squareEnv()).toBeNull();
    set({ SQUARE_APPLICATION_ID: "app-live" }); // a live id, in the sandbox
    expect(squareEnv()).toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});

describe("what is sent to Square, and what is made of its answers", () => {
  afterEach(() => vi.unstubAllGlobals());
  const env: SquareEnv = {
    sandbox: true,
    base: "https://connect.squareupsandbox.com/v2",
    token: "t",
    locationId: LOC,
    applicationId: "sandbox-app",
  };
  const req = {
    lines: [{ itemId: "classic", quantity: 2, modifiers: ["BACON", "FRIES"] }],
    name: "Sam",
    phone: "(518) 555-0100",
    token: "cnon:ok",
    idempotencyKey: "0f8fad5b-d9cb-469f-a165-70867728950e",
    expectedTotal: 4536,
  };
  const order = (over: Record<string, unknown> = {}) => ({
    order: { id: "ORDERID123abc", total_money: usd(4536), total_tax_money: usd(336), ...over },
  });
  type Call = { method: string; path: string; headers: Record<string, string>; body: unknown };
  /** Square, stood in for: each answer is a status and a body, by "METHOD path". */
  const standIn = (answers: Record<string, [number, unknown] | (() => never)>) => {
    const calls: Call[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      const path = url.replace(env.base, "");
      const method = init.method ?? "GET";
      calls.push({
        method,
        path,
        headers: init.headers as Record<string, string>,
        body: init.body ? JSON.parse(String(init.body)) : undefined,
      });
      const answer = answers[`${method} ${path}`];
      if (!answer) throw new Error(`unexpected call: ${method} ${path}`);
      if (typeof answer === "function") return answer();
      return new Response(JSON.stringify(answer[1]), { status: answer[0] });
    });
    return calls;
  };
  const declined = (code: string) => ({
    errors: [{ category: "PAYMENT_METHOD_ERROR", code, detail: "x" }],
  });

  it("a quote asks Square to calculate, with the catalog's taxes, and creates nothing", async () => {
    const calls = standIn({ "POST /orders/calculate": [200, order()] });
    expect(await quote(env, req.lines, items)).toEqual({ total: 4536, tax: 336 });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.headers).toMatchObject({
      authorization: "Bearer t",
      "square-version": "2026-09-16",
      "content-type": "application/json",
    });
    expect(calls[0]?.body).toEqual({
      order: {
        location_id: LOC,
        line_items: [
          {
            catalog_object_id: "BURGER-V",
            quantity: "2",
            modifiers: [{ catalog_object_id: "BACON" }, { catalog_object_id: "FRIES" }],
          },
        ],
        pricing_options: { auto_apply_taxes: true, auto_apply_discounts: true },
      },
    });
  });

  it("an order is a pickup order, as soon as possible, then a payment for exactly its total", async () => {
    const calls = standIn({
      "POST /orders": [200, order()],
      "POST /payments": [200, { payment: { id: "P1", status: "COMPLETED" } }],
    });
    expect(await place(env, req, items)).toEqual({ ok: true, total: 4536, reference: "123ABC" });
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual(["POST /orders", "POST /payments"]);
    const sent = calls[0]?.body as { idempotency_key: string; order: Record<string, unknown> };
    expect(sent.idempotency_key).toBe(`o-${req.idempotencyKey}`);
    // no state is sent: Square creates the order OPEN, which is what the till shows once paid
    expect(sent.order).not.toHaveProperty("state");
    expect(sent.order).toMatchObject({
      location_id: LOC,
      ticket_name: "Sam",
      pricing_options: { auto_apply_taxes: true, auto_apply_discounts: true },
      fulfillments: [
        {
          type: "PICKUP",
          state: "PROPOSED",
          pickup_details: {
            recipient: { display_name: "Sam", phone_number: "+15185550100" },
            schedule_type: "ASAP",
            prep_time_duration: "PT20M",
          },
        },
      ],
    });
    // money is whole cents with its currency; the key fits Square's 45 characters
    expect(calls[1]?.body).toEqual({
      source_id: "cnon:ok",
      idempotency_key: `p-${req.idempotencyKey}`,
      amount_money: { amount: 4536, currency: "USD" },
      order_id: "ORDERID123abc",
      location_id: LOC,
      autocomplete: true,
    });
    expect(`p-${"x".repeat(40)}`.length).toBeLessThanOrEqual(45);
  });

  it("the same request twice sends Square the same two bodies, so Square can spot the repeat", async () => {
    const answers = {
      "POST /orders": [200, order()] as [number, unknown],
      "POST /payments": [200, { payment: { id: "P1" } }] as [number, unknown],
    };
    const first = standIn(answers);
    await place(env, req, items);
    const second = standIn(answers);
    await place(env, req, items);
    expect(second.map((c) => c.body)).toEqual(first.map((c) => c.body));
  });

  it("a total that is not the one the visitor saw is never charged", async () => {
    const calls = standIn({
      "POST /orders": [200, order({ total_money: usd(4752), total_tax_money: usd(352) })],
    });
    expect(await place(env, req, items)).toEqual({ ok: false, reason: "changed", total: 4752, tax: 352 });
    expect(calls.map((c) => c.path)).toEqual(["/orders"]);
  });

  it("a phone number Square would refuse stops the order before anything is created", async () => {
    const calls = standIn({});
    await expect(place(env, { ...req, phone: "555-0100" }, items)).rejects.toMatchObject({
      code: "bad-phone",
    });
    expect(calls).toHaveLength(0);
  });

  it("a declined card is a clear no, and nobody asks Square whether it was paid", async () => {
    const calls = standIn({
      "POST /orders": [200, order()],
      "POST /payments": [400, declined("GENERIC_DECLINE")],
    });
    expect(await place(env, req, items)).toEqual({ ok: false, reason: "declined" });
    expect(calls).toHaveLength(2);
    standIn({ "POST /orders": [200, order()], "POST /payments": [400, declined("CVV_FAILURE")] });
    expect(await place(env, req, items)).toEqual({ ok: false, reason: "card" });
  });

  it("an unclear payment answer is checked with Square: a paid order is a placed order", async () => {
    const calls = standIn({
      "POST /orders": [200, order()],
      "POST /payments": [
        400,
        { errors: [{ category: "INVALID_REQUEST_ERROR", code: "IDEMPOTENCY_KEY_REUSED" }] },
      ],
      "GET /orders/ORDERID123abc": [200, order({ tenders: [{ id: "T1" }], net_amount_due_money: usd(0) })],
    });
    expect(await place(env, req, items)).toEqual({ ok: true, total: 4536, reference: "123ABC" });
    expect(calls.at(-1)).toMatchObject({ method: "GET", path: "/orders/ORDERID123abc" });
  });

  it("and the same when the payment call never answers", async () => {
    standIn({
      "POST /orders": [200, order()],
      "POST /payments": () => {
        throw new DOMException("timed out", "TimeoutError");
      },
      "GET /orders/ORDERID123abc": [200, order({ tenders: [{ id: "T1" }], net_amount_due_money: usd(0) })],
    });
    expect(await place(env, req, items)).toMatchObject({ ok: true });
  });

  it("an unpaid order after an unclear answer is an error, with Square's codes kept for the log", async () => {
    standIn({
      "POST /orders": [200, order()],
      "POST /payments": [500, { errors: [{ category: "API_ERROR", code: "INTERNAL_SERVER_ERROR" }] }],
      "GET /orders/ORDERID123abc": [200, order({ net_amount_due_money: usd(4536) })],
    });
    const failure = await place(env, req, items).catch((e) => e);
    expect(failure).toBeInstanceOf(SquareError);
    expect((failure as SquareError).status).toBe(500);
    expect((failure as SquareError).has("INTERNAL_SERVER_ERROR")).toBe(true);
  });
});
