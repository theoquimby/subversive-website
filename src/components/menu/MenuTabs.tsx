"use client";

// Drinks | Food (spec §6.2): both lists are in the HTML; this switches data-show on the
// wrapper (CSS hides the other list), remembers the choice per device and keeps ?show= in
// step. Set as two words with a short ink stroke under the one that is showing.
import { menuLabels } from "@content/microcopy";
import { Segmented } from "../ui/Segmented";
import { setShow, useShow } from "./show-store";

const OPTIONS = [
  { value: "drinks", label: menuLabels.drinks },
  { value: "food", label: menuLabels.food },
] as const;

export function MenuTabs() {
  const show = useShow();
  const change = (next: "drinks" | "food") => {
    setShow(next);
    // keep the bar where it is: if the reader is down in one list, start the other at its top
    const list = document.querySelector<HTMLElement>(`[data-list="${next}"]`);
    const bar = document.querySelector<HTMLElement>(".menu-bar");
    if (list && bar) {
      const top = list.getBoundingClientRect().top + window.scrollY - bar.offsetHeight;
      if (window.scrollY > top) window.scrollTo({ top, behavior: "instant" });
    }
  };
  return (
    <Segmented
      className="seg--text"
      label={menuLabels.switchList}
      options={OPTIONS}
      value={show}
      onValueChange={change}
    />
  );
}
