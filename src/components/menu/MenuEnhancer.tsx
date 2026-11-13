"use client";

// Small behaviours the rows need once JavaScript is there (spec §6.2, §4.4):
//   · a deep link to a row opens it (the :target flash is CSS and needs no script)
//   · rows whose description fits in two lines and have nothing else to show lose the
//     "more" mark, so no row promises more than it has
//   · the sticky bar's height is published as --menu-bar-h for scroll-margin-top
//   · printing opens every row, then puts them back
import { useEffect } from "react";

export function MenuEnhancer() {
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

    // data-stuck: the bar has left its place in the flow (its sentinel scrolled past it)
    const sentinel = menu.querySelector<HTMLElement>(".menu-bar-sentinel");
    let stuckFrame = 0;
    const checkStuck = () => {
      stuckFrame = 0;
      if (!bar || !sentinel) return;
      const stuck = sentinel.getBoundingClientRect().top < bar.getBoundingClientRect().top - 1;
      bar.toggleAttribute("data-stuck", stuck);
    };
    const onScroll = () => {
      if (!stuckFrame) stuckFrame = requestAnimationFrame(checkStuck);
    };
    checkStuck();
    window.addEventListener("scroll", onScroll, { passive: true });

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
      cancelAnimationFrame(stuckFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", openTarget);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);
  return null;
}
