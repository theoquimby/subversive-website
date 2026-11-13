"use client";

// Event filter chips (spec §6.3): All · Games · Music · Trivia & movies · Festivals, only
// the ones with events. Filtering is client-side over the server-rendered list: tickets
// that don't match are hidden, and a month left empty hides its label too.
import { eventLabels } from "@content/microcopy";
import { useEffect, useState } from "react";

export type FilterKey = "all" | "games" | "music" | "trivia-movies" | "festivals";

export function EventFilters({ present }: { present: FilterKey[] }) {
  const [on, setOn] = useState<FilterKey>("all");
  useEffect(() => {
    const list = document.querySelector<HTMLElement>("[data-event-list]");
    if (!list) return;
    for (const el of list.querySelectorAll<HTMLElement>("[data-category]")) {
      el.hidden = on !== "all" && el.dataset.category !== on;
    }
    for (const month of list.querySelectorAll<HTMLElement>("[data-month]")) {
      month.hidden = !month.querySelector("[data-category]:not([hidden])");
    }
  }, [on]);
  const keys: FilterKey[] = ["all", ...present.filter((k) => k !== "all")];
  if (keys.length < 3) return null; // one kind of event: nothing to filter
  return (
    <fieldset className="event-filters">
      <legend className="sr-only">{eventLabels.filters}</legend>
      {keys.map((k) => (
        <button key={k} type="button" className="fchip" aria-pressed={on === k} onClick={() => setOn(k)}>
          {eventLabels.categories[k]}
        </button>
      ))}
    </fieldset>
  );
}
