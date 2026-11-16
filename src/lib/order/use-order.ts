"use client";

// What the browser knows about ordering: asked once per page load from /api/order/config,
// and only when ordering has been switched on for this build (NEXT_PUBLIC_ORDERING=on), so
// a site without ordering makes no extra request. Also where the cart sheet's open state
// lives, so the header, an item's Add button and the sheet itself agree.
import { useSyncExternalStore } from "react";
import type { OrderConfig } from "./config";

export const ORDERING_BUILT = process.env.NEXT_PUBLIC_ORDERING === "on";

let config: OrderConfig | null = null;
let asked = false;
let open = false;
const listeners = new Set<() => void>();
const tell = () => {
  for (const l of listeners) l();
};

function ask() {
  if (asked || !ORDERING_BUILT || typeof window === "undefined") return;
  asked = true;
  fetch("/api/order/config", { headers: { accept: "application/json" } })
    .then((r) => (r.ok ? (r.json() as Promise<OrderConfig>) : null))
    .then((c) => {
      config = c?.enabled ? c : null;
      tell();
    })
    .catch(() => {
      // offline or the route failed: ordering is simply not offered
    });
}

function subscribe(onChange: () => void) {
  ask();
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** The ordering set-up, or null while unknown, switched off, or not available. */
export function useOrderConfig(): OrderConfig | null {
  return useSyncExternalStore(
    subscribe,
    () => config,
    () => null,
  );
}

export function useCartOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}

export function setCartOpen(next: boolean) {
  if (open === next) return;
  open = next;
  tell();
}

/** Cents as dollars: "$18.00". */
export const dollars = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
