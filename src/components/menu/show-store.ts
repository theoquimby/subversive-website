// The active list lives in one place: data-show on the [data-menu] wrapper, written first
// by the pre-paint script and then only by setShow. Client leaves read it through useShow.
import { useSyncExternalStore } from "react";
import type { Show } from "@/lib/menu/filters";
import { SHOW_KEY } from "./menu-boot";

const root = () => document.querySelector<HTMLElement>("[data-menu]");

function subscribe(onChange: () => void) {
  const el = root();
  if (!el) return () => {};
  const mo = new MutationObserver(onChange);
  mo.observe(el, { attributes: true, attributeFilter: ["data-show"] });
  return () => mo.disconnect();
}

const read = (): Show => (root()?.dataset.show === "food" ? "food" : "drinks");

export function useShow(): Show {
  return useSyncExternalStore(subscribe, read, () => "drinks");
}

/** Switch lists: the wrapper, the device memory and ?show= (replaced, not pushed). */
export function setShow(next: Show) {
  const el = root();
  if (!el || el.dataset.show === next) return;
  el.dataset.show = next;
  el.dataset.switched = "";
  try {
    localStorage.setItem(SHOW_KEY, next);
  } catch {
    // private mode: the choice simply is not remembered
  }
  const url = new URL(window.location.href);
  if (next === "food") url.searchParams.set("show", "food");
  else url.searchParams.delete("show");
  url.hash = "";
  window.history.replaceState(null, "", url);
}
