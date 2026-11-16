"use client";

// The menu's index (review pass 2026-11-15). It replaces the chip row, the Filter pill and
// the filter chips with one button at the right of the bar. On a phone the button names
// the section being read and opens a sheet: the list's sections, then its filters. On a
// wide screen the sections are plain links in the bar and the button says Filter.
// The section under about a third of the screen is the current one. Filters dim the rows
// that do not match, so the list never jumps, and the count is announced politely.
import { menuLabels } from "@content/microcopy";
import { Dialog } from "radix-ui";
import { type MouseEvent, useEffect, useMemo, useState } from "react";
import {
  DRINK_FILTERS,
  type DrinkFilter,
  FOOD_FILTERS,
  type FoodFilter,
  matchCount,
  matchesDrink,
  matchesFood,
  type Show,
} from "@/lib/menu/filters";
import type { ItemView } from "@/lib/menu/view";
import { Sheet } from "../ui/Sheet";
import { useShow } from "./show-store";

export interface Chip {
  /** the section the link jumps to */
  id: string;
  label: string;
  /** every section that marks this link current (Burgers covers two) */
  sections: string[];
}

const toggle = <T,>(set: ReadonlySet<T>, v: T) => {
  const next = new Set(set);
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
};

export function MenuIndex({
  drinks,
  food,
  beers,
  dishes,
}: {
  drinks: Chip[];
  food: Chip[];
  /** the rows a drink filter can match (beer only) */
  beers: ItemView[];
  dishes: ItemView[];
}) {
  const show = useShow();
  const [open, setOpen] = useState(false);
  const [here, setHere] = useState<Record<Show, string>>({
    drinks: drinks[0]?.id ?? "",
    food: food[0]?.id ?? "",
  });
  const [drinkOn, setDrinkOn] = useState<ReadonlySet<DrinkFilter>>(new Set());
  const [foodOn, setFoodOn] = useState<ReadonlySet<FoodFilter>>(new Set());

  // which section is being read
  useEffect(() => {
    const chips = show === "drinks" ? drinks : food;
    const bar = document.querySelector<HTMLElement>(".menu-bar");
    const targets = chips.flatMap((c) =>
      c.sections
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => !!el)
        .map((el) => ({ el, chip: c.id })),
    );
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = Math.max((bar?.getBoundingClientRect().bottom ?? 0) + 24, window.innerHeight * 0.35);
      let next = targets[0]?.chip ?? "";
      for (const t of targets) if (t.el.getBoundingClientRect().top <= line) next = t.chip;
      setHere((h) => (h[show] === next ? h : { ...h, [show]: next }));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [show, drinks, food]);

  // dim rows in both lists to match their own selection
  useEffect(() => {
    const apply = (list: Show, rows: ItemView[], match: (i: ItemView) => boolean) => {
      const byId = new Map(rows.map((r) => [r.id, r]));
      for (const el of document.querySelectorAll<HTMLElement>(`[data-list="${list}"] [data-row]`)) {
        const row = byId.get(el.dataset.row ?? "");
        el.toggleAttribute("data-dim", !!row && !match(row));
      }
    };
    apply("drinks", beers, (i) => matchesDrink(i, drinkOn));
    apply("food", dishes, (i) => matchesFood(i, foodOn));
  }, [beers, dishes, drinkOn, foodOn]);

  const active = show === "drinks" ? drinkOn.size : foodOn.size;
  const count = useMemo(
    () =>
      show === "drinks"
        ? matchCount(beers, (i) => matchesDrink(i, drinkOn))
        : matchCount(dishes, (i) => matchesFood(i, foodOn)),
    [show, beers, dishes, drinkOn, foodOn],
  );

  const labelOf = (list: Show) =>
    (list === "drinks" ? drinks : food).find((c) => c.id === here[list])?.label ?? "";

  const go = (e: MouseEvent, id: string) => {
    e.preventDefault();
    setOpen(false);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ block: "start", behavior: calm ? "instant" : "smooth" });
  };

  const links = (list: Show, chips: Chip[]) => (
    <div className="mbar-links" data-for={list}>
      {chips.map((c) => (
        <a
          key={c.id}
          href={`#${c.id}`}
          data-chip={c.id}
          aria-current={here[list] === c.id ? "true" : undefined}
        >
          {c.label}
        </a>
      ))}
    </div>
  );

  return (
    <>
      {links("drinks", drinks)}
      {links("food", food)}
      <button
        type="button"
        className="mbar-index"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">{menuLabels.sections}</span>
        <span className="mbar-index__here" data-for="drinks">
          {labelOf("drinks")}
        </span>
        <span className="mbar-index__here" data-for="food">
          {labelOf("food")}
        </span>
        <span className="mbar-index__filter">{menuLabels.filter}</span>
        {active > 0 ? <span className="mbar-index__n tabular">{active}</span> : null}
        <svg className="mbar-index__mark" viewBox="0 0 12 8" aria-hidden="true" focusable="false">
          <path d="M1.5 1.8C3.2 3.4 4.6 4.8 6 6.3C7.5 4.7 9 3.2 10.6 1.6" />
        </svg>
      </button>

      <Sheet open={open} onOpenChange={setOpen} closeLabel={menuLabels.close} className="sheet--index">
        <Dialog.Title className="sheet__label">
          {show === "drinks" ? menuLabels.drinks : menuLabels.food}
        </Dialog.Title>
        <ol className="index-list">
          {(show === "drinks" ? drinks : food).map((c) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                aria-current={here[show] === c.id ? "true" : undefined}
                onClick={(e) => go(e, c.id)}
              >
                {c.label}
              </a>
            </li>
          ))}
        </ol>
        <p className="sheet__label" id="index-filters-label">
          {menuLabels.filters[show]}
        </p>
        {/* biome-ignore lint/a11y/useSemanticElements: a fieldset's legend cannot sit in this flow; the group is labelled */}
        <div className="index-filters" role="group" aria-labelledby="index-filters-label">
          {show === "drinks"
            ? DRINK_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="choice"
                  aria-pressed={drinkOn.has(f)}
                  onClick={() => setDrinkOn((s) => toggle(s, f))}
                >
                  {menuLabels.drinkFilters[f]}
                </button>
              ))
            : FOOD_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="choice"
                  aria-pressed={foodOn.has(f)}
                  onClick={() => setFoodOn((s) => toggle(s, f))}
                >
                  {menuLabels.foodFilters[f]}
                </button>
              ))}
        </div>
        <p className="index-count tabular" aria-live="polite">
          {active > 0 ? menuLabels.matches(count, show) : ""}
        </p>
      </Sheet>
    </>
  );
}
