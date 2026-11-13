// The menu's pre-paint script (spec §6.2, §2.5). It runs while the HTML is parsed, before
// either list paints, and sets on the [data-menu] wrapper:
//   data-show  — "drinks" | "food": the hash target's list, else ?show=, else the device's
//                last choice, else drinks. CSS hides the other list, so nothing flashes.
//   data-today — the New York weekday, which reveals that day's feature box.
// With no JavaScript neither attribute is set: both lists show, stacked, with anchor links.
import { NY_WEEKDAY_JS } from "@/lib/time/ny";

export const SHOW_KEY = "sv.menu.show";

export function menuBootScript(drinkIds: readonly string[], foodIds: readonly string[]): string {
  const d = JSON.stringify(drinkIds);
  const f = JSON.stringify(foodIds);
  return `(function(e){var s="drinks";try{var h=decodeURIComponent(location.hash.slice(1)),q=new URLSearchParams(location.search).get("show"),m=localStorage.getItem("${SHOW_KEY}");if(${f}.indexOf(h)>=0)s="food";else if(${d}.indexOf(h)>=0)s="drinks";else if(q==="food"||q==="drinks")s=q;else if(m==="food")s="food"}catch(x){}e.dataset.show=s;try{e.dataset.today=${NY_WEEKDAY_JS}}catch(x){}})(document.currentScript.parentElement)`;
}
