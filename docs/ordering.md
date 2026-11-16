# Ordering from the site's own menu

Built 2026-11-15. **Off by default.** With nothing set, the site behaves exactly as before:
the Order button links out to the Square ordering page and no item shows an Add button.

## What it does

- On the Menu, an item Square also sells shows **Add to order** in its detail view, with
  its sizes and options read from Square's catalog.
- The header's Order button opens the order once there is something in it.
- The order sheet shows Square's own total (tax included), asks for a name and a phone
  number, and takes the card in Square's own form. The card's number never reaches this
  site: Square hands back a one-time token.
- Paying creates a pickup order in Square ("ASAP", ready in 20 minutes) and takes payment
  for exactly that order's total. A paid order appears on the Square POS as an open pickup
  order.
- Orders are only taken while the kitchen is open (the same hours logic as the site's
  "open now" line). Food only: no draft beer, no cans.

## Switching it on (Theo)

Set these in Vercel. The access token is a secret: paste it into Vercel yourself; it must
never be put in the repo or sent in chat.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_ORDERING` | `on` |
| `SQUARE_ENVIRONMENT` | leave unset for the sandbox; `production` to take real money |
| `SQUARE_ACCESS_TOKEN` | from the Square Developer Dashboard (sandbox or production to match) |
| `SQUARE_APPLICATION_ID` | from the same app |
| `SQUARE_LOCATION_ID` | the taproom's location id |

The token needs to read the catalog (`ITEMS_READ`), create orders (`ORDERS_WRITE`) and take
payments (`PAYMENTS_WRITE`).

**Do the sandbox first, on a preview deployment.** In the sandbox the order sheet says
"Test mode: no real payment is taken." Test cards: Visa `4111 1111 1111 1111`, CVV `111`,
any future date, any ZIP. A declined card: `4000 0000 0000 0002`.

## Not yet verified against Square

Everything was built from Square's documentation and tested with Square stood in for.
None of it has talked to Square yet. Before production, check in the sandbox:

1. The catalog loads (`GET /v2/catalog/list?types=ITEM,MODIFIER_LIST`): the reference
   page for this call would not load on the day, so its exact shape is from memory.
2. Items with a fixed price report `pricing_type: "FIXED_PRICING"` (same caveat).
3. An order shows tax and total, and appears on the POS as an open pickup order once paid.
4. A declined card shows "The card was declined" and leaves nothing charged.
5. The card form renders inside the sheet on an iPhone.
6. The sandbox catalog has to contain items whose names match the menu (the sandbox starts
   empty; add two or three by hand).

## Names must match

An item can be ordered when Square has an item with the same name as the menu, or one of
the known longer names ("Classic Smash Burger" for "Classic", "Wings (6)" for "Chicken
Wings": the list is in `src/lib/menu/square-prices.ts`). Anything else simply shows no Add
button.

## For Max to decide

- Tips: none are asked for today.
- Prep time: 20 minutes, fixed.
- Scheduled pickup (order now for 6:30): not built.
- Cans to go: not offered, because they need an age check.
- Whether the Square ordering page stays up alongside this.

## What is not there

- No rate limiting on the order routes beyond Square's own.
- No email or text receipt from the site (Square can send its own if configured).
- An order whose payment fails stays in Square as an unpaid order, which Square does not
  show to the kitchen.
