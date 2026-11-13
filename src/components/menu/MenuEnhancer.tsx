"use client";

// Small behaviours the menu needs once JavaScript is there (spec §6.2, §4.4):
//   · arriving by an in-site link: the pre-paint script in the HTML only runs on a full
//     page load, so on a client navigation this sets data-show and data-today itself,
//     before paint (critique 11/13, P0: the section chips never appeared for most visitors)
//   · a deep link to a row opens it (the :target flash is CSS and needs no script)
//   · rows whose description fits in two lines and have nothing else to show lose the
//     "more" mark, so no row promises more than it has
//   · the sticky bar's height is published as --menu-bar-h for scroll-margin-top
//   · printing opens every row, then puts them back
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
    if (!menu) return;

    const openTarget = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      if (el instanceof HTMLDetailsElement && !el.open) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };

    const markPlain = () => {
      for (const d of menu.querySelectorAll<HTMLDetailsElement>("details.mrow__box")) {
        if (d.open) continue;
        const desc = d.querySelector<HTMLElement>(".mrow__desc");
        const more = d.querySelector(".mrow__more");
        const clamped = !!desc && desc.scrollHeight > desc.clientHeight + 1;
        d.toggleAttribute("data-plain", !clamped && !more);
      }
    };

    const ro = new ResizeObserver(() => {
      if (bar) menu.style.setProperty("--menu-bar-h", `${bar.offsetHeight}px`);
    });
    if (bar) ro.observe(bar);

    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(markPlain);
    };

    const opened: HTMLDetailsElement[] = [];
    const beforePrint = () => {
      for (const d of menu.querySelectorAll<HTMLDetailsElement>("details.mrow__box:not([open])")) {
        d.open = true;
        opened.push(d);
      }
    };
    const afterPrint = () => {
      for (const d of opened.splice(0)) d.open = false;
    };

    openTarget();
    // fonts change line breaks; measure once they are in
    document.fonts.ready.then(markPlain);
    window.addEventListener("hashchange", openTarget);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener("hashchange", openTarget);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);
  return null;
}
