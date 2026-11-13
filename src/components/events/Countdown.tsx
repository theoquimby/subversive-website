"use client";

// Countdown to tipoff (spec §4.7): "Tip in 2h 14m", then "On now", then "Final". Computed
// in the browser every 30 s; the server renders nothing so cached HTML is never wrong.
import { useEffect, useState } from "react";
import type { SiteEvent } from "@/lib/events/enrich";
import { countdownLabel } from "@/lib/events/matchup";

export function Countdown({
  event,
}: {
  event: Pick<SiteEvent, "startsAt" | "endsAt" | "matchup" | "displayTitle">;
}) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => setLabel(countdownLabel(event as SiteEvent, new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [event]);
  return (
    <p className="countdown tabular" aria-live="off">
      {label}
    </p>
  );
}
