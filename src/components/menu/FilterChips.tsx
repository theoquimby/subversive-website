"use client";

// Filter chips (spec §6.2): multi-select toggles that dim non-matching rows to 30% so the
// list never jumps, and announce the count politely ("4 beers match"). On a phone they
// collapse behind a "Filter" pill. Each list keeps its own selection.
import { menuLabels } from "@content/microcopy";
import { useEffect, useMemo, useState } from "react";
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

export function FilterChips({
  show,
  beers,
  dishes,
}: {
  show: Show;
  /** the rows a drink filter can match (beer only) */
  beers: ItemView[];
  dishes: ItemView[];
}) {
  const [drinkOn, setDrinkOn] = useState<ReadonlySet<DrinkFilter>>(new Set());
  const [foodOn, setFoodOn] = useState<ReadonlySet<FoodFilter>>(new Set());
  const [open, setOpen] = useState(false);

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

  const toggle = <T,>(set: ReadonlySet<T>, v: T) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
  };

  return (
    <>
      <button
        type="button"
        className="fpill"
        aria-expanded={open}
        aria-controls="menu-filters"
        data-active={active > 0 ? "" : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{menuLabels.filter}</span>
        {active > 0 ? <span className="fpill__n tabular">{active}</span> : null}
      </button>
      <div id="menu-filters" className="filters" data-open={open ? "" : undefined}>
        <fieldset className="filters__chips">
          <legend className="sr-only">{menuLabels.filters[show]}</legend>
          {show === "drinks"
            ? DRINK_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="fchip"
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
                  className="fchip"
                  aria-pressed={foodOn.has(f)}
                  onClick={() => setFoodOn((s) => toggle(s, f))}
                >
                  {menuLabels.foodFilters[f]}
                </button>
              ))}
        </fieldset>
        <p className="filters__count tabular" aria-live="polite">
          {active > 0 ? menuLabels.matches(count, show) : ""}
        </p>
      </div>
    </>
  );
}
