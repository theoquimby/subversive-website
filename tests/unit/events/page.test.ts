import { describe, expect, it, vi } from "vitest";
import { opsImage } from "@/lib/events/feature";
import { parseFeed } from "@/lib/events/schema";

const base = { id: "okt", date: "2026-10-03", title: "Oktoberfest", kind: "FESTIVAL", closed: false };

describe("a featured event's page from Ops", () => {
  it("is read when sent", () => {
    const page = {
      hero: "https://ops.example.com/uploads/okt.jpg",
      intro: "Three days.",
      sections: [{ title: "Food", body: "Pretzels." }],
      schedule: [{ time: "12:00", what: "Tapping" }],
      links: [{ label: "Tickets", href: "https://example.com/t" }],
    };
    const feed = parseFeed({ timezone: "America/New_York", events: [{ ...base, page }] });
    expect(feed.events[0]?.page).toEqual(page);
  });
  it("is dropped when it does not fit, and the event is kept", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const feed = parseFeed({
      timezone: "America/New_York",
      events: [{ ...base, page: { hero: "http://insecure.example/x.jpg", schedule: "noon" } }, base],
    });
    warn.mockRestore();
    expect(feed.events).toHaveLength(2);
    expect(feed.events[0]?.page).toBeUndefined();
    expect(feed.events[1]?.page).toBeUndefined();
  });
  it("shows a photograph only from the Ops origin", () => {
    expect(opsImage("https://ops.example.com/u/a.jpg", "https://ops.example.com")).toBe(
      "https://ops.example.com/u/a.jpg",
    );
    expect(opsImage("https://elsewhere.example/a.jpg", "https://ops.example.com")).toBeNull();
    expect(opsImage("https://ops.example.com/u/a.jpg", "")).toBeNull();
    expect(opsImage(undefined, "https://ops.example.com")).toBeNull();
  });
});
