"use client";

// Marks today's row in the hours card (spec §4.9) in New York time, in the browser, so a
// cached page is never wrong. Renders nothing; it only sets data-today on the rows.
import { useEffect } from "react";
import { nyParts } from "@/lib/time/ny";

export function TodayMarker() {
  useEffect(() => {
    const mark = () => {
      const { date, weekday } = nyParts(new Date());
      for (const table of document.querySelectorAll<HTMLElement>("[data-hours]")) {
        for (const row of table.querySelectorAll<HTMLElement>("tr[data-weekday], tr[data-date]")) {
          const on = row.dataset.weekday === weekday || row.dataset.date === date;
          row.toggleAttribute("data-today", on);
          if (on) row.setAttribute("aria-current", "date");
          else row.removeAttribute("aria-current");
        }
      }
    };
    mark();
    const id = window.setInterval(mark, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
