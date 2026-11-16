"use client";

// "Add to order", in a menu item's detail view. Shown only when ordering is on and Square
// has this item: its sizes (when it has more than one), its options, a quantity, and one
// yellow button. The choices are checked here for the visitor's sake and again on the
// server, which is the check that counts.
import { orderLabels } from "@content/microcopy";
import { useEffect, useState } from "react";
import { addToCart, cartCount, useCart } from "@/lib/order/cart";
import { dollars, setCartOpen, useOrderConfig } from "@/lib/order/use-order";

export function AddToOrder({ itemId, name }: { itemId: string; name: string }) {
  const config = useOrderConfig();
  const cart = useCart();
  const item = config?.items[itemId];
  const [variation, setVariation] = useState<string | null>(null);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(new Set());
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // a different item: start its choices afresh
  // biome-ignore lint/correctness/useExhaustiveDependencies: the item id is the trigger
  useEffect(() => {
    setVariation(null);
    setChosen(new Set());
    setQuantity(1);
    setAdded(false);
  }, [itemId]);

  if (!config || !item) return null;

  const picked =
    item.variations.length === 1 ? item.variations[0] : item.variations.find((v) => v.id === variation);
  const short = item.lists.find((l) => l.options.filter((o) => chosen.has(o.id)).length < l.min);
  const ready = !!picked && !short && config.open;

  const toggle = (listId: string, id: string) => {
    const list = item.lists.find((l) => l.id === listId);
    if (!list) return;
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else {
      const inList = list.options.filter((o) => next.has(o.id));
      // a list that takes one: choosing another swaps it; otherwise stop at the limit
      if (list.max === 1) for (const o of inList) next.delete(o.id);
      else if (inList.length >= list.max) return;
      next.add(id);
    }
    setChosen(next);
    setAdded(false);
  };

  const add = () => {
    if (!picked || !ready) return;
    const options = item.lists.flatMap((l) => l.options.filter((o) => chosen.has(o.id)));
    addToCart(
      {
        itemId,
        name: item.variations.length > 1 && picked.name ? `${name} · ${picked.name}` : name,
        ...(item.variations.length > 1 ? { variationId: picked.id } : {}),
        modifiers: options.map((o) => o.id),
        modifierNames: options.map((o) => o.name),
      },
      quantity,
    );
    setAdded(true);
  };

  const count = cartCount(cart);

  return (
    <div className="order-add">
      {item.variations.length > 1 ? (
        <fieldset className="order-add__group">
          <legend className="sheet__label">{orderLabels.chooseOne}</legend>
          <div className="order-add__choices">
            {item.variations.map((v) => (
              <button
                key={v.id}
                type="button"
                className="choice"
                aria-pressed={variation === v.id}
                onClick={() => {
                  setVariation(v.id);
                  setAdded(false);
                }}
              >
                {v.name} <span className="tabular">{dollars(v.price)}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}
      {item.lists.map((l) => (
        <fieldset key={l.id} className="order-add__group">
          <legend className="sheet__label">
            {l.name}
            {l.min > 0
              ? ` · ${orderLabels.choose(l.min)}`
              : l.max < l.options.length
                ? ` · ${orderLabels.upTo(l.max)}`
                : ""}
          </legend>
          <div className="order-add__choices">
            {l.options.map((o) => (
              <button
                key={o.id}
                type="button"
                className="choice"
                aria-pressed={chosen.has(o.id)}
                onClick={() => toggle(l.id, o.id)}
              >
                {o.name}
                {o.price > 0 ? <span className="tabular"> +{dollars(o.price)}</span> : null}
              </button>
            ))}
          </div>
        </fieldset>
      ))}

      {config.open ? (
        <div className="order-add__row">
          <div className="stepper">
            <button
              type="button"
              className="stepper__btn"
              aria-label={orderLabels.fewer}
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <span aria-hidden="true">−</span>
            </button>
            <output className="stepper__n tabular" aria-label={orderLabels.quantity}>
              {quantity}
            </output>
            <button
              type="button"
              className="stepper__btn"
              aria-label={orderLabels.more}
              disabled={quantity >= 20}
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
          <button type="button" className="btn btn--primary order-add__btn" disabled={!ready} onClick={add}>
            <span className="btn__label">{orderLabels.add}</span>
          </button>
        </div>
      ) : (
        <p className="order-add__note">{orderLabels.closed}</p>
      )}
      <p className="order-add__status" role="status">
        {added ? orderLabels.added : ""}
      </p>
      {count > 0 ? (
        <button type="button" className="text-link order-add__view" onClick={() => setCartOpen(true)}>
          {orderLabels.viewOrder(count)}
        </button>
      ) : null}
    </div>
  );
}
