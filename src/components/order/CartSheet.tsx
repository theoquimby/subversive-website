"use client";

// The order: what is in it, who it is for, what it costs, and the card. One sheet, the same
// paper sheet the menu uses.
//
// The card is typed into Square's own form (an iframe from Square, loaded only when this
// sheet opens with something in it), which hands back a one-time token; the card's number
// never touches this site. The total shown is Square's, tax included, asked for whenever
// the cart changes. Paying sends the lines, the name, the phone number, the token and the
// total that was shown to /api/order, with a key made once per attempt so a retry can
// never charge twice. The server charges Square's total, and only if it is the one shown.
import { orderLabels } from "@content/microcopy";
import { Dialog } from "radix-ui";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { type CartLine, clearCart, setQuantity, useCart } from "@/lib/order/cart";
import type { OrderConfig } from "@/lib/order/config";
import { dollars, setCartOpen, useCartOpen, useOrderConfig } from "@/lib/order/use-order";
import { Sheet } from "../ui/Sheet";

// ---- the little of Square's browser SDK that is used here
interface TokenResult {
  status: string;
  token?: string;
  errors?: { message?: string }[];
}
interface SquareCard {
  attach(target: HTMLElement): Promise<void>;
  tokenize(details?: unknown): Promise<TokenResult>;
  destroy(): Promise<void>;
}
interface SquareSdk {
  payments(applicationId: string, locationId: string): { card(options?: unknown): Promise<SquareCard> };
}
declare global {
  interface Window {
    Square?: SquareSdk;
  }
}

let sdk: Promise<SquareSdk> | null = null;
function loadSdk(sandbox: boolean): Promise<SquareSdk> {
  sdk ??= new Promise<SquareSdk>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = sandbox
      ? "https://sandbox.web.squarecdn.com/v1/square.js"
      : "https://web.squarecdn.com/v1/square.js";
    s.onload = () => (window.Square ? resolve(window.Square) : reject(new Error("Square did not load")));
    s.onerror = () => reject(new Error("Square did not load"));
    document.head.append(s);
  }).catch((e) => {
    sdk = null; // let a later opening try again
    throw e;
  });
  return sdk;
}

const toLines = (cart: readonly CartLine[]) =>
  cart.map((l) => ({
    itemId: l.itemId,
    ...(l.variationId ? { variationId: l.variationId } : {}),
    quantity: l.quantity,
    modifiers: l.modifiers,
  }));

const newKey = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`.slice(
        0,
        36,
      );

type Phase =
  | { at: "cart" }
  | { at: "paying" }
  | { at: "done"; name: string; reference: string; prepMinutes: number };

export function CartSheet() {
  const config = useOrderConfig();
  const open = useCartOpen();
  const cart = useCart();
  if (!config) return null;
  return <Cart config={config} open={open} cart={cart} />;
}

function Cart({ config, open, cart }: { config: OrderConfig; open: boolean; cart: readonly CartLine[] }) {
  const id = useId();
  const [phase, setPhase] = useState<Phase>({ at: "cart" });
  const [quote, setQuote] = useState<{ total: number; tax: number | null } | null>(null);
  const [problem, setProblem] = useState("");
  const [cardReady, setCardReady] = useState(false);
  const cardBox = useRef<HTMLDivElement>(null);
  const card = useRef<SquareCard | null>(null);
  // An attempt whose answer never came back, kept whole (key, card token and what was
  // sent) so that pressing Pay again sends Square the very same request: Square then
  // answers with the first result instead of charging again. Anything changed (the
  // cart, the name, the phone, the total) makes it a new attempt with a new key.
  const pending = useRef<{ key: string; token: string; sent: string } | null>(null);
  const count = cart.length;

  // what it costs, from Square, whenever the cart changes while the sheet is open
  useEffect(() => {
    if (!open || count === 0) {
      setQuote(null);
      return;
    }
    const stop = new AbortController();
    setQuote(null);
    fetch("/api/order/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lines: toLines(cart) }),
      signal: stop.signal,
    })
      .then(async (r) => {
        const body = (await r.json()) as {
          total?: number;
          tax?: number | null;
          error?: string;
          itemId?: string;
        };
        if (r.ok && typeof body.total === "number") {
          setQuote({ total: body.total, tax: body.tax ?? null });
          setProblem("");
        } else if (body.itemId) {
          const line = cart.find((l) => l.itemId === body.itemId);
          setProblem(orderLabels.unavailable(line?.name ?? ""));
        } else setProblem(orderLabels.failed);
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setProblem(orderLabels.failed);
      });
    return () => stop.abort();
  }, [open, cart, count]);

  // Square's card form, once there is something to pay for
  const wantCard = open && count > 0 && config.open && phase.at !== "done";
  useEffect(() => {
    if (!wantCard) return;
    let gone = false;
    loadSdk(config.sandbox)
      .then((sq) => sq.payments(config.applicationId, config.locationId).card())
      .then(async (c) => {
        if (gone || !cardBox.current) {
          await c.destroy();
          return;
        }
        await c.attach(cardBox.current);
        card.current = c;
        setCardReady(true);
      })
      .catch(() => {
        if (!gone) setProblem(orderLabels.failed);
      });
    return () => {
      gone = true;
      setCardReady(false);
      card.current?.destroy().catch(() => {});
      card.current = null;
    };
  }, [wantCard, config.sandbox, config.applicationId, config.locationId]);

  const pay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase.at !== "cart" || !card.current || !quote) return;
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    if (!name) return setProblem(orderLabels.needName);
    if (!/^\+?[0-9 ().-]{7,24}$/.test(phone)) return setProblem(orderLabels.needPhone);
    setProblem("");
    setPhase({ at: "paying" });
    const order = { lines: toLines(cart), name, phone, expectedTotal: quote.total };
    const sent = JSON.stringify(order);
    if (pending.current?.sent !== sent) pending.current = null;
    try {
      if (!pending.current) {
        const token = await card.current.tokenize({
          amount: (quote.total / 100).toFixed(2),
          currencyCode: "USD",
          intent: "CHARGE",
          customerInitiated: true,
          sellerKeyedIn: false,
          billingContact: { givenName: name, phone },
        });
        if (token.status !== "OK" || !token.token) {
          setProblem(orderLabels.cardProblem);
          setPhase({ at: "cart" });
          return;
        }
        pending.current = { key: newKey(), token: token.token, sent };
      }
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...order,
          token: pending.current.token,
          idempotencyKey: pending.current.key,
        }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        reference?: string;
        prepMinutes?: number;
        error?: string;
        itemId?: string;
        total?: number;
        tax?: number | null;
      };
      if (res.ok && body.ok) {
        pending.current = null;
        clearCart();
        setPhase({
          at: "done",
          name,
          reference: body.reference ?? "",
          prepMinutes: body.prepMinutes ?? config.prepMinutes,
        });
        return;
      }
      // A clear "no" (declined, closed, not available): nothing was charged, the card
      // token is spent, and the next attempt is a new one with a new key. A server error
      // is not a clear "no", so that attempt is kept and repeated as it was.
      if (res.status < 500) pending.current = null;
      if (body.error === "changed" && typeof body.total === "number") {
        // Square's total moved since it was shown (a price or a tax changed): nothing was
        // charged; show the new total, and Pay now names it.
        // TODO(Max): a line of copy for this moment; until there is one, the total just updates.
        setQuote({ total: body.total, tax: body.tax ?? null });
      } else {
        const gone = body.itemId ? cart.find((l) => l.itemId === body.itemId) : undefined;
        setProblem(
          gone
            ? orderLabels.unavailable(gone.name)
            : body.error === "declined"
              ? orderLabels.declined
              : body.error === "card"
                ? orderLabels.cardProblem
                : body.error === "closed"
                  ? orderLabels.closed
                  : body.error === "bad-phone"
                    ? orderLabels.needPhone
                    : orderLabels.failed,
        );
      }
    } catch {
      // the answer never arrived: keep the attempt, so pressing again cannot charge twice
      setProblem(orderLabels.failed);
    }
    setPhase({ at: "cart" });
  };

  const onOpenChange = (next: boolean) => {
    setCartOpen(next);
    if (!next && phase.at === "done") setPhase({ at: "cart" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} closeLabel={orderLabels.close} className="sheet--cart">
      <Dialog.Title className="cart__title">{orderLabels.yourOrder}</Dialog.Title>
      {config.sandbox ? <p className="cart__test">{orderLabels.sandbox}</p> : null}

      {phase.at === "done" ? (
        <div className="cart__done" role="status">
          <p className="cart__thanks">{orderLabels.thanks(phase.name)}</p>
          <p>{orderLabels.ready(phase.prepMinutes)}</p>
          {phase.reference ? (
            <p className="cart__ref tabular">{orderLabels.reference(phase.reference)}</p>
          ) : null}
        </div>
      ) : count === 0 ? (
        <p className="cart__empty">{orderLabels.empty}</p>
      ) : (
        <form className="cart" onSubmit={pay} noValidate>
          <ul className="cart__lines">
            {cart.map((l, i) => (
              <li key={`${l.itemId}|${l.variationId ?? ""}|${l.modifiers.join(",")}`} className="cart__line">
                <div className="cart__what">
                  <span className="cart__name">{l.name}</span>
                  {l.modifierNames.length ? (
                    <span className="cart__mods">{l.modifierNames.join(" · ")}</span>
                  ) : null}
                </div>
                <div className="stepper">
                  <button
                    type="button"
                    className="stepper__btn"
                    aria-label={l.quantity === 1 ? orderLabels.remove(l.name) : orderLabels.fewer}
                    onClick={() => setQuantity(i, l.quantity - 1)}
                  >
                    <span aria-hidden="true">−</span>
                  </button>
                  <output className="stepper__n tabular" aria-label={orderLabels.quantity}>
                    {l.quantity}
                  </output>
                  <button
                    type="button"
                    className="stepper__btn"
                    aria-label={orderLabels.more}
                    disabled={l.quantity >= 20}
                    onClick={() => setQuantity(i, l.quantity + 1)}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <dl className="cart__totals">
            {quote?.tax != null ? (
              <div>
                <dt>{orderLabels.tax}</dt>
                <dd className="tabular">{dollars(quote.tax)}</dd>
              </div>
            ) : null}
            <div className="cart__total">
              <dt>{orderLabels.total}</dt>
              <dd className="tabular">{quote ? dollars(quote.total) : "…"}</dd>
            </div>
          </dl>

          {config.open ? (
            <>
              <p className="cart__pickup">{orderLabels.pickup(config.prepMinutes)}</p>
              <div className="field">
                <label className="field__label" htmlFor={`${id}-name`}>
                  {orderLabels.name}
                </label>
                <input
                  id={`${id}-name`}
                  name="name"
                  className="field__input"
                  autoComplete="name"
                  maxLength={80}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor={`${id}-phone`}>
                  {orderLabels.phone}
                </label>
                <input
                  id={`${id}-phone`}
                  name="phone"
                  type="tel"
                  className="field__input"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={24}
                />
              </div>
              <div className="field">
                <span className="field__label">{orderLabels.card}</span>
                {/* Square's own form goes in here */}
                <div ref={cardBox} className="cart__card" data-ready={cardReady ? "" : undefined} />
              </div>
              <button
                type="submit"
                className="btn btn--primary cart__pay"
                disabled={!quote || !cardReady || phase.at === "paying"}
              >
                <span className="btn__label">
                  {phase.at === "paying"
                    ? orderLabels.paying
                    : quote
                      ? orderLabels.pay(dollars(quote.total))
                      : orderLabels.payPlain}
                </span>
              </button>
            </>
          ) : (
            <p className="cart__closed">{orderLabels.closed}</p>
          )}
          <p className="field__error cart__problem" role="alert">
            {problem}
          </p>
        </form>
      )}
    </Sheet>
  );
}
