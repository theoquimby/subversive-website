// The event page's "Good to know" row (spec §6.3), computed, never typed: the kitchen's
// close that day; the bar staying open through the final buzzer when a game runs past the
// normal close; "Free" only when the description says so.
import { formatTime } from "@/lib/hours/format";
import type { DaySchedule } from "@/lib/hours/schedule";
import type { SiteEvent } from "./enrich";

export function goodToKnow(e: SiteEvent, schedule: DaySchedule): string[] {
  const facts: string[] = [];
  if (!schedule.closed && schedule.kitchenClose !== null)
    facts.push(`Kitchen til ${formatTime(schedule.kitchenClose)}`);
  if (e.kind === "GAME" && schedule.reason?.type === "late" && schedule.reason.eventId === e.id) {
    facts.push("Bar open through the final buzzer");
  }
  if (/\bfree\b/i.test(e.description)) facts.push("Free");
  return facts;
}
