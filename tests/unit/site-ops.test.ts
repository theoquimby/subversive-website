import { describe, expect, it } from "vitest";
import { mergeSite, opsSiteSchema } from "@/lib/site/ops";
import { getSite } from "@/lib/site/site";

// The example answer from the Ops contract (website-integration.md §1).
const EXAMPLE = {
  timezone: "America/New_York",
  hours: {
    mon: { open: "16:30", close: "20:00", kitchenClose: "20:00" },
    tue: null,
    wed: { open: "16:30", close: "20:00", kitchenClose: "20:00" },
    thu: { open: "16:30", close: "20:00", kitchenClose: "19:45" },
    fri: { open: "16:30", close: "20:30", kitchenClose: "20:15" },
    sat: { open: "12:00", close: "20:30", kitchenClose: "20:15" },
    sun: { open: "12:00", close: "18:30", kitchenClose: "18:15" },
  },
  notice: { text: "Closed Thanksgiving Day.", until: "2026-11-25" },
  season: null,
  seasons: [],
  name: "Subversive",
  address: { street: "96 West Bridge Street", city: "Catskill", state: "NY", zip: "12414", geo: null },
  phone: { display: "(518) 303-1270", tel: "+15183031270", note: "Only answered during taproom hours." },
  email: null,
  links: { order: "https://example.com/order" },
  updatedAt: "2026-11-15T22:35:29.657Z",
};

describe("the Ops site feed", () => {
  it("accepts the contract's example", () => {
    expect(() => opsSiteSchema.parse(EXAMPLE)).not.toThrow();
  });
  it("rejects hours that are not times", () => {
    const bad = {
      ...EXAMPLE,
      hours: { ...EXAMPLE.hours, mon: { open: "4pm", close: "20:00", kitchenClose: "20:00" } },
    };
    expect(() => opsSiteSchema.parse(bad)).toThrow();
  });
  it("lays hours, a notice and one link over site.json and keeps the rest", () => {
    const file = getSite();
    const live = mergeSite(file, opsSiteSchema.parse(EXAMPLE), "2026-11-20");
    expect(live.hours.thu?.kitchenClose).toBe("19:45");
    expect(live.notice?.text).toBe("Closed Thanksgiving Day.");
    expect(live.links.order).toBe("https://example.com/order");
    expect(live.links.map).toBe(file.links.map);
    expect(live.email).toBe(file.email); // null in the feed keeps the file's
    expect(live.visit).toEqual(file.visit);
  });
  it("drops a notice after its last day, even from an old cache", () => {
    const live = mergeSite(getSite(), opsSiteSchema.parse(EXAMPLE), "2026-11-26");
    expect(live.notice).toBeNull();
  });
});
