import { describe, expect, it } from "vitest";
import { currentAnnouncements, parseAnnouncements } from "@/lib/site/announcements";
import { mergeSite, opsSiteSchema } from "@/lib/site/ops";
import { getSite } from "@/lib/site/site";

const HOURS = {
  mon: null,
  tue: null,
  wed: null,
  thu: { open: "16:30", close: "20:00", kitchenClose: "19:45" },
  fri: null,
  sat: null,
  sun: null,
};

const LIST = [
  { id: "thanksgiving", text: "Closed Thanksgiving Day.", tone: "closure", until: "2026-11-26" },
  {
    id: "okt",
    text: "Oktoberfest tickets are on sale.",
    tone: "event",
    link: { href: "/events/oktoberfest", label: "Details" },
    from: "2026-11-20",
  },
  { id: "plain", text: "A line with no tone.", link: { href: "https://example.com/x", label: "More" } },
  { id: "fourth", text: "A fourth line." },
];

describe("announcements from Ops", () => {
  it("parses entries and fills defaults", () => {
    const list = parseAnnouncements(LIST);
    expect(list).toHaveLength(4);
    expect(list[2]).toEqual({
      id: "plain",
      text: "A line with no tone.",
      link: { href: "https://example.com/x", label: "More" },
      tone: "info",
      from: null,
      until: null,
    });
  });
  it("drops a bad entry and keeps the rest", () => {
    const list = parseAnnouncements([
      { id: "long", text: "x".repeat(141) },
      { id: "date", text: "Bad date.", until: "2026-13-01" },
      { id: "js", text: "Bad link.", link: { href: "javascript:alert(1)", label: "Go" } },
      { id: "proto", text: "Protocol-relative link.", link: { href: "//evil.example", label: "Go" } },
      { id: "tone", text: "Unknown tone.", tone: "party" },
      { text: "No id." },
      { id: "ok", text: "Fine." },
    ]);
    expect(list.map((a) => a.id)).toEqual(["ok"]);
  });
  it("gives none for anything that is not a list", () => {
    expect(parseAnnouncements(undefined)).toEqual([]);
    expect(parseAnnouncements({ id: "x" })).toEqual([]);
  });
  it("shows only those that stand today, both ends inclusive, at most three", () => {
    const list = parseAnnouncements(LIST);
    expect(currentAnnouncements(list, "2026-11-19").map((a) => a.id)).toEqual([
      "thanksgiving",
      "plain",
      "fourth",
    ]);
    expect(currentAnnouncements(list, "2026-11-20").map((a) => a.id)).toEqual([
      "thanksgiving",
      "okt",
      "plain",
    ]);
    expect(currentAnnouncements(list, "2026-11-26").map((a) => a.id)).toContain("thanksgiving");
    expect(currentAnnouncements(list, "2026-11-27").map((a) => a.id)).toEqual(["okt", "plain", "fourth"]);
  });
  it("shows a repeated id once", () => {
    const list = parseAnnouncements([
      { id: "a", text: "One." },
      { id: "a", text: "Again." },
    ]);
    expect(currentAnnouncements(list, "2026-11-20").map((a) => a.text)).toEqual(["One."]);
  });
});

describe("the site feed with announcements", () => {
  const base = { hours: HOURS, notice: null };
  it("is unchanged without them", () => {
    const live = mergeSite(getSite(), opsSiteSchema.parse(base), "2026-11-20");
    expect(live.announcements).toEqual([]);
  });
  it("keeps the hours when the list is broken", () => {
    const ops = opsSiteSchema.parse({ ...base, announcements: "not a list" });
    expect(mergeSite(getSite(), ops, "2026-11-20").hours.thu?.kitchenClose).toBe("19:45");
  });
  it("lays today's announcements over the site", () => {
    const live = mergeSite(getSite(), opsSiteSchema.parse({ ...base, announcements: LIST }), "2026-11-27");
    expect(live.announcements.map((a) => a.id)).toEqual(["okt", "plain", "fourth"]);
  });
});
