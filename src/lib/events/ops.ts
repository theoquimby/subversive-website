// The Ops feed, read-only (CLAUDE.md: never change Ops). Today (O1) it answers with a
// login redirect, which counts as a failure; when O1 is fixed the live feed takes over
// with no code change. An empty OPS_EVENTS_URL turns the fetch off (seed only).
import { parseFeed } from "./schema";
import type { EventsSource } from "./source";

export const OPS_EVENTS_DEFAULT = "https://subversive-ops.vercel.app/api/public/events";

export const opsEventsSource: EventsSource = {
  async fetch() {
    const base = process.env.OPS_EVENTS_URL ?? OPS_EVENTS_DEFAULT;
    if (!base) throw new Error("OPS_EVENTS_URL is empty");
    const res = await fetch(`${base}?days=120`, {
      redirect: "manual",
      headers: { accept: "application/json" },
    });
    if (res.status !== 200) throw new Error(`ops feed: HTTP ${res.status}`);
    if (!(res.headers.get("content-type") ?? "").includes("json")) throw new Error("ops feed: not JSON");
    return parseFeed(await res.json());
  },
};
