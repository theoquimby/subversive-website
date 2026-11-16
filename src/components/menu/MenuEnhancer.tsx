"use client";

// Small behaviours the menu needs once JavaScript is there (spec §6.2):
//   · arriving by an in-site link: the pre-paint script in the HTML only runs on a full
//     page load, so on a client navigation this sets data-show and data-today itself,
//     before paint (critique 11/13, P0: the list controls never appeared for most visitors)
//   · the sticky bar's height is published as --menu-bar-h for scroll-margin-top
import { useEffect, useLayoutEffect } from "react";
import { nyParts } from "@/lib/time/ny";
import { SHOW_KEY } from "./menu-boot";

/** The same choice the pre-paint script makes: the hash target's list, ?show=, the device's last choice, drinks. */
function resolveShow(): "drinks" | "food" {
  try {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const list = id ? document.getElementById(id)?.closest("[data-list]")?.getAttribute("data-list") : null;
    if (list === "food" || list === "drinks") return list;
    const q = new URLSearchParams(window.location.search).get("show");
    if (q === "food" || q === "drinks") return q;
    if (localStorage.getItem(SHOW_KEY) === "food") return "food";
  } catch {
    // private mode or a malformed hash: drinks
  }
  return "drinks";
}

export function MenuEnhancer() {
  useLayoutEffect(() => {
    const menu = document.querySelector<HTMLElement>("[data-menu]");
    if (!menu) return;
    if (!menu.dataset.show) menu.dataset.show = resolveShow();
    if (!menu.dataset.today) menu.dataset.today = nyParts(new Date()).weekday;
  }, []);

  useEffect(() => {
    const menu = document.querySelector<HTMLElement>("[data-menu]");
    const bar = document.querySelector<HTMLElement>(".menu-bar");
    if (!menu || !bar) return;
    const ro = new ResizeObserver(() => menu.style.setProperty("--menu-bar-h", `${bar.offsetHeight}px`));
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);
  return null;
}
