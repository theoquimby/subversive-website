# Ordering from the site's own menu: go-live runbook

Built 2026-11-15, audited 2026-11-18. **Off by default.** With nothing set, the site
behaves exactly as before: the Order button links out to the Square ordering page and no
item shows an Add button.

It has still never talked to Square. Doing that needs keys only Theo can create, so the
steps below are the test. Do them in order. Parts 1 to 3 use Square's sandbox (a practice
copy of Square where no money moves); Part 4 is the real thing.

## What it does

- On the Menu, a food item Square also sells shows **Add to order**, with its sizes and
  options read from Square's item list.
- The order sheet shows Square's own total (tax included), asks for a name and a phone
  number, and takes the card in Square's own form. The card number never reaches this
  site.
- Paying creates a pickup order in Square ("as soon as possible", ready in 20 minutes) and
  charges exactly that order's total. A paid order shows up on the till as an open pickup
  order under the customer's name.
- Orders are only taken while the kitchen is open (the same hours as the site's "open now"
  line).
- Left out on purpose: anything the till has marked sold out, and all alcohol (see
  "Alcohol" below).
- If Square cannot be reached, the site quietly goes back to the old Order link.

## Part 1. Make the keys (Square Developer Dashboard, about 10 minutes)

1. Go to `developer.squareup.com/apps` and sign in with the brewery's Square login.
2. Create an application. Name it **Subversive website**: Square shows this name on each
   order as where it came from.
3. Open the application. At the top is a switch between **Sandbox** and **Production**.
   Set it to **Sandbox**.
4. On the **Credentials** page, copy two values:
   - **Sandbox Application ID** (starts `sandbox-`). Not a secret.
   - **Sandbox Access token**. This is a secret: it can do anything in the sandbox
     account. Never paste it into chat, email or the repo.
5. On the **Locations** page, copy the **Location ID** of the sandbox location.
6. Still in the Developer Dashboard, open **Sandbox test accounts** and open the default
   account's **Square Dashboard**. This is the practice till's back office. In it:
   - Add two or three items whose names match the site's menu exactly (for example
     `Classic Smash Burger`, `Wings (6)`, `Frites`). Give each a fixed price.
   - Give one of them a required option list (for example a Side with two choices) so
     options get tested.
   - Create a sales tax and apply it to those items. Without this the total will show no
     tax.

## Part 2. Put the keys in Vercel (Preview only)

In the Vercel project, Settings, Environment Variables. Add each of these for the
**Preview** environment only (not Production yet):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_ORDERING` | `on` |
| `SQUARE_APPLICATION_ID` | the Sandbox Application ID |
| `SQUARE_LOCATION_ID` | the sandbox Location ID |
| `SQUARE_ACCESS_TOKEN` | the Sandbox Access token. Tick **Sensitive**. |

Do **not** set `SQUARE_ENVIRONMENT` for Preview. Leaving it unset means sandbox.
Do **not** set `ORDER_ALCOHOL_ALLOW`.

Then **redeploy** a preview (push any branch, or Redeploy on an existing preview). The
switch is read when the site is built, so changing a value does nothing until the next
deploy.

A safety net: if the Application ID is a sandbox one and the environment says production
(or the other way round), ordering stays off rather than guessing.

## Part 3. Test on the preview, on a phone

The order sheet should say "Test mode: no real payment is taken."

Test cards (Square's own; any future expiry date, any real ZIP such as `12414`):

| Card | What should happen |
|---|---|
| `4111 1111 1111 1111`, CVV `111` | Payment goes through |
| `4000 0000 0000 0002`, CVV `111` | "The card was declined. Please try another card." |
| `4111 1111 1111 1111`, CVV `911` | "Please check the card details and try again." |
| `4111 1111 1111 1111`, ZIP `99999` | "Please check the card details and try again." |

Check each of these and tick it off:

1. The Menu shows **Add to order** on the items you created, and on nothing else.
2. The item with a required option will not add until an option is chosen.
3. The order sheet shows a Tax line and a Total, and the tax is what the till would charge.
4. The card form appears inside the sheet on an iPhone and on an Android phone.
5. Paying with the first card shows "Thanks, (name). Your order is in." and an order code.
6. In the sandbox Square Dashboard, under Orders, the order is there: paid, pickup, the
   right name and phone, the right items and options, the right tax.
7. The declined card shows the declined message, and the sandbox Dashboard shows no
   payment for it.
8. Pay once, then check Orders shows one order and one payment, not two.
9. In the sandbox Dashboard, mark one item sold out at the location. Within about a
   minute it loses its Add button on the site.
10. Outside kitchen hours, the sheet says the kitchen is closed and there is no Pay
    button.

If any of these fails, stop and send Claude what you saw; do not go on to Part 4.

The sandbox cannot be opened in the Square till app (as far as we know), so "does it
show on the kitchen's screen and print a ticket" is checked in Part 4 with one real order.

## Part 4. Switch to real money

Before you start, in the real Square Dashboard:

- Every food item sold online has the sales tax applied to it. The site asks Square to add
  "the taxes set on these items"; an item with no tax set is sold with no tax.
- Item names match the menu (see "Names must match").
- The till is set to alert and print for new pickup orders, the same as it does for the
  Square ordering page today.

Then:

1. In the Developer Dashboard, same application, flip the switch to **Production**. Copy
   the **Production Application ID** (no `sandbox-` at the front), the **Production Access
   token** (a secret: it can do anything in the brewery's real Square account), and the
   taproom's **Location ID** from the Locations page.
2. In Vercel, add these for the **Production** environment only:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_ORDERING` | `on` |
   | `SQUARE_ENVIRONMENT` | `production` |
   | `SQUARE_APPLICATION_ID` | the Production Application ID |
   | `SQUARE_LOCATION_ID` | the taproom's Location ID |
   | `SQUARE_ACCESS_TOKEN` | the Production Access token. Tick **Sensitive**. |

3. Pick a quiet time while the kitchen is open and someone is at the till. Redeploy
   Production.
4. On your own phone, order the cheapest item with your own card. Check:
   - The sheet does **not** say "Test mode".
   - The till shows a new open pickup order, paid, with your name, the item and its
     options. The kitchen ticket prints or the kitchen screen shows it.
   - The total and tax match what the till would have charged for the same item.
   - Your card shows one charge.
5. On the till, mark the order ready and picked up, as for any pickup order.
6. Refund the test order from the Square Dashboard (Transactions, the payment, Refund).
7. Tell the staff it is live and what a website order looks like on the till.

## Turning it off again

Emergency stop (no deploy): in the Developer Dashboard, on the Production Credentials
page, **Replace** the access token. The old one stops working at once, so the site can no
longer create an order or take a payment. Orders already paid are not affected. The site
may go on showing Add buttons that end in "Something went wrong" until the next step is
done, so do that next.

Proper: in Vercel, delete `NEXT_PUBLIC_ORDERING` from Production (or set it to anything
but `on`) and redeploy. Vercel's "Instant Rollback" to the deploy before ordering was
switched on does the same in one click.

## Alcohol

The site does not sell alcohol to go. Three separate things keep it out:

1. Only the Menu's food sections are offered at all.
2. Any Square item marked "alcoholic" in Square is left out.
3. Any Square item filed under a category whose name contains beer, draft, cans, cider,
   wine, cocktail, spirits, liquor, seltzer or alcohol is left out.

`ORDER_ALCOHOL_ALLOW` (a comma-separated list of Square item names or ids) lets named
items through checks 2 and 3. It is empty and should stay empty until Max decides
otherwise and there is an age check.

## Names must match

An item can be ordered when Square has an item with the same name as the menu, or one of
the known longer names ("Classic Smash Burger" for "Classic", "Wings (6)" for "Chicken
Wings": the list is in `src/lib/menu/square-prices.ts`). Anything else simply shows no Add
button.

## What is still unverified until real keys exist

Checked on 2026-11-18 against Square's published documentation, and correct there: the
web addresses for sandbox and production, the card form's script addresses and the
security settings it needs, how an order, a pickup, a payment and the tax request are
written, the test card numbers above, and that `2026-09-16` is a real version of Square's
API. What documentation cannot prove:

1. **The item list loads.** The exact web address for reading the item list is from memory
   (its reference page would not load, twice). Part 3 step 1 proves it.
2. **Tax comes out right.** Square's docs say the taxes set on each item are added; the
   real account's tax set-up decides whether that matches the till. Part 3 step 3, then
   Part 4 step 4.
3. **The order reaches the kitchen.** Docs say a paid order with a pickup shows on the
   till. Whether it alerts and prints the way the kitchen expects is Part 4 step 4.
4. **Sold-out items disappear.** Built from the docs' description of how Square marks an
   item sold out at one location. Part 3 step 9.
5. **Square's "alcoholic" mark and category names** are read as documented, but the real
   item list has not been seen. After Part 4 step 3, look down the Menu: nothing alcoholic
   should have an Add button.
6. **A repeated request is not charged twice.** The site sends Square the identical
   request on a retry, and if Square's answer is unclear it asks Square whether the order
   is paid before saying anything failed. Square's exact answer to a repeat is from the
   docs, not from a test.
7. **The card form on real phones**, inside the sheet. Part 3 step 4.
8. **The newest Square version** (`2026-11-18`) has not been tried; the code asks for
   `2026-09-16`, which Square still serves.

## For Max to decide

- Tips: none are asked for today.
- Prep time: 20 minutes, fixed.
- Scheduled pickup (order now for 6:30): not built.
- Cans to go: not offered (see "Alcohol").
- Whether the Square ordering page stays up alongside this.
- A last-orders cut-off: today an order is accepted up to the minute the kitchen closes.
- One line of copy for "the total changed since you saw it" (marked `TODO(Max)` in
  `src/components/order/CartSheet.tsx`); until then the total simply updates.

## Known gaps (not built)

1. **No limit on how fast orders can be tried.** Card thieves use small checkout forms to
   test stolen cards. Square's own fraud checks apply, but the site adds none. Worth
   adding before or soon after go-live (Vercel's firewall can limit `/api/order` per
   visitor without code).
2. **No receipt from the site.** The customer sees a confirmation on screen with a short
   order code, and nothing by email or text. Square has a receipt page for every payment;
   showing its link, or asking for an email, needs a line of copy and a field.
3. **The confirmation says "about 20 minutes"**, not a clock time.
4. **A price changed in Square can take up to a minute** to show on the site. The
   customer is never charged a total other than the one shown: the order is refused and
   the new total shown instead.
5. **An item sold out at the till can still be ordered for up to a minute**, and Square
   does not refuse it. The kitchen would have to call the customer.
6. **An order whose payment fails stays in Square as an unpaid order.** Square does not
   show unpaid orders to the kitchen.
7. **An option cannot itself be alcohol-checked.** If a food item in Square had "add a
   beer" as an option, it would be offered. Check the option lists once.
