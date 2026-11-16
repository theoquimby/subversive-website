// The cart (ordering from the site's own menu, 2026-11-15).
//
// It lives in the browser only: a short list of lines kept in localStorage so it survives
// a reload and a walk between pages. A line is a menu item, a quantity and the options
// chosen for it; two adds of the same item with the same options are one line. Nothing
// here knows a price: prices and totals always come from the server, which asks Square.
// Read it in components with useCart(); change it with the functions below.
import { useSyncExternalStore } from "react";

export interface CartLine {
  /** the menu item's id on the site (its row id) */
  itemId: string;
  /** shown in the cart; the server takes the real name from Square */
  name: string;
  quantity: number;
  /** the size or kind chosen, when the item has more than one */
  variationId?: string;
  /** Square modifier ids chosen for this line, sorted */
  modifiers: string[];
  /** their names, in the same order, for display only */
  modifierNames: string[];
}

const KEY = "sv.cart.v1";
const MAX_LINES = 30;
const MAX_QUANTITY = 20;
const EMPTY: readonly CartLine[] = Object.freeze([]);

let lines: readonly CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

const lineKey = (l: Pick<CartLine, "itemId" | "variationId" | "modifiers">) =>
  `${l.itemId}|${l.variationId ?? ""}|${l.modifiers.join(",")}`;

function isLine(x: unknown): x is CartLine {
  if (!x || typeof x !== "object") return false;
  const l = x as Record<string, unknown>;
  return (
    typeof l.itemId === "string" &&
    typeof l.name === "string" &&
    (l.variationId === undefined || typeof l.variationId === "string") &&
    typeof l.quantity === "number" &&
    Number.isInteger(l.quantity) &&
    l.quantity > 0 &&
    l.quantity <= MAX_QUANTITY &&
    Array.isArray(l.modifiers) &&
    l.modifiers.every((m) => typeof m === "string") &&
    Array.isArray(l.modifierNames) &&
    l.modifierNames.every((m) => typeof m === "string")
  );
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    if (Array.isArray(raw)) lines = raw.filter(isLine).slice(0, MAX_LINES);
  } catch {
    // private mode or a damaged value: start empty
  }
}

function commit(next: readonly CartLine[]) {
  lines = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // private mode: the cart lasts for this page only
  }
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  load();
  listeners.add(onChange);
  // another tab changed the cart
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const snapshot = () => {
  load();
  return lines;
};

/** The cart's lines. Empty on the server and before the browser has read storage. */
export function useCart(): readonly CartLine[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export const cartCount = (cart: readonly CartLine[]) => cart.reduce((n, l) => n + l.quantity, 0);

export function addToCart(line: Omit<CartLine, "quantity">, quantity = 1) {
  load();
  const fresh = { ...line, modifiers: [...line.modifiers], modifierNames: [...line.modifierNames] };
  const key = lineKey(fresh);
  const at = lines.findIndex((l) => lineKey(l) === key);
  if (at >= 0) {
    commit(
      lines.map((l, i) => (i === at ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) } : l)),
    );
  } else if (lines.length < MAX_LINES) {
    commit([...lines, { ...fresh, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) }]);
  }
}

/** Set a line's quantity; zero removes it. */
export function setQuantity(index: number, quantity: number) {
  load();
  if (quantity <= 0) commit(lines.filter((_, i) => i !== index));
  else commit(lines.map((l, i) => (i === index ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) } : l)));
}

export function clearCart() {
  load();
  commit(EMPTY);
}
