import { describe, expect, it } from "vitest";
import { orderables } from "@/lib/order/catalog";
import { lineItems, OrderProblem, orderRequest, quoteRequest } from "@/lib/order/order";
import { sameOrigin } from "@/lib/order/origin";

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
  };
  it("takes a plain order", () => expect(orderRequest.safeParse(base).success).toBe(true));
  it.each([
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
