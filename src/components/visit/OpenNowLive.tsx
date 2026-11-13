"use client";

// The pill's live half (spec §4.2): the server's line is shown first; on mount, every
// 30 s and whenever the tab comes back, the status is recomputed from the clock here, so a
// cached page is never wrong. Pure lib/hours does the work; this only supplies "now".
import { useEffect, useState } from "react";
import { formatStatus, type StatusLine } from "@/lib/hours/format";
import type { HoursEvent } from "@/lib/hours/schedule";
import { statusAt } from "@/lib/hours/status";
import type { Site } from "@/lib/site/schema";
import { OpenNowPill } from "./OpenNowPill";

export function OpenNowLive({
  initial,
  hours,
  events,
  className,
}: {
  initial: StatusLine;
  hours: Site["hours"];
  events: HoursEvent[];
  className?: string;
}) {
  const [line, setLine] = useState(initial);
  useEffect(() => {
    const update = () => setLine(formatStatus(statusAt(new Date(), { hours }, events)));
    update();
    const id = window.setInterval(update, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hours, events]);

  return <OpenNowPill line={line} className={className} />;
}
