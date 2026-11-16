"use client";

// The header's yellow Order button. With ordering off (the default) it is exactly what it
// was: a link to the brewery's Square ordering page in a new tab, and it stays that way
// without JavaScript. With ordering on it opens the visitor's order when there is
// something in it, and otherwise goes to the food menu to start one.
import { useRouter } from "next/navigation";
import { cartCount, useCart } from "@/lib/order/cart";
import { setCartOpen, useOrderConfig } from "@/lib/order/use-order";
import { Icon } from "../graphics/Icon";

export function OrderEntry({ href, label }: { href: string; label: string }) {
  const config = useOrderConfig();
  const count = cartCount(useCart());
  const router = useRouter();

  if (!config) {
    return (
      <a className="btn btn--primary site-header__order" href={href} target="_blank" rel="noopener">
        <span className="btn__label">{label}</span>
        <Icon name="external" className="btn__icon" />
      </a>
    );
  }
  return (
    <button
      type="button"
      className="btn btn--primary site-header__order"
      onClick={() => (count > 0 ? setCartOpen(true) : router.push("/menu?show=food"))}
    >
      <span className="btn__label">
        {label}
        {count > 0 ? <span className="tabular"> · {count}</span> : null}
      </span>
    </button>
  );
}
