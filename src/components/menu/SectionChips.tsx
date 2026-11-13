"use client";

// Section chips (spec §6.2): plain anchor links (they work before and without JavaScript),
// one row per list; CSS shows the active list's row. The chip for the section under the
// sticky stack is marked current and kept in view in its own scroller.
import { useEffect, useRef } from "react";
import type { Show } from "@/lib/menu/filters";
import { useShow } from "./show-store";

export interface Chip {
  /** the section the chip jumps to */
  id: string;
  label: string;
  /** every section that lights this chip (Burgers covers two) */
  sections: string[];
}

export function SectionChips({ drinks, food }: { drinks: Chip[]; food: Chip[] }) {
  const show = useShow();
  const rows = useRef<Record<Show, HTMLDivElement | null>>({ drinks: null, food: null });

  useEffect(() => {
    const chips = show === "drinks" ? drinks : food;
    const row = rows.current[show];
    if (!row) return;
    const bar = document.querySelector<HTMLElement>(".menu-bar");
    const targets = chips.flatMap((c) =>
      c.sections
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => !!el)
        .map((el) => ({ el, chip: c.id })),
    );
    let current = "";
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = (bar?.getBoundingClientRect().bottom ?? 0) + 24;
      let next = targets[0]?.chip ?? "";
      for (const t of targets) if (t.el.getBoundingClientRect().top <= line) next = t.chip;
      if (next === current) return;
      current = next;
      for (const a of row.querySelectorAll<HTMLAnchorElement>("a[data-chip]")) {
        const on = a.dataset.chip === next;
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
        if (on) {
          const left = a.offsetLeft - row.clientWidth / 2 + a.offsetWidth / 2;
          row.scrollTo({ left, behavior: "smooth" });
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [show, drinks, food]);

  const render = (list: Show, chips: Chip[]) => (
    <div
      className="chips"
      data-for={list}
      ref={(el) => {
        rows.current[list] = el;
      }}
    >
      {chips.map((c) => (
        <a key={c.id} href={`#${c.id}`} className="chip" data-chip={c.id}>
          {c.label}
        </a>
      ))}
    </div>
  );

  return (
    <>
      {render("drinks", drinks)}
      {render("food", food)}
    </>
  );
}
