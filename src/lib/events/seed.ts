// The fallback and test fixture: content/events.seed.json, in the feed's exact shape.
import raw from "@content/events.seed.json";
import { parseFeed } from "./schema";
import type { EventsSource } from "./source";

export const seedEventsSource: EventsSource = {
  async fetch() {
    return parseFeed(raw);
  },
};
