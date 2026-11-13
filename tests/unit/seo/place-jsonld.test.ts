import { describe, expect, it } from "vitest";
import { jsonLdText, placeJsonLd } from "@/lib/seo/jsonld";
import { getSite } from "@/lib/site/site";

const site = getSite();
const ld = placeJsonLd(site, "https://example.test/") as {
  openingHoursSpecification: { dayOfWeek: string; opens: string; closes: string }[];
  [k: string]: unknown;
};

describe("placeJsonLd (spec §8.7)", () => {
  it("is a Brewery and a Restaurant at the address", () => {
    expect(ld["@type"]).toEqual(["Brewery", "Restaurant"]);
    expect(ld.menu).toBe("https://example.test/menu");
    expect(ld.acceptsReservations).toBe(false);
  });

  it("opening hours match site.json, and Tuesday is absent", () => {
    const days = ld.openingHoursSpecification.map((h) => h.dayOfWeek.replace("https://schema.org/", ""));
    expect(days).toEqual(["Monday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
    const fri = ld.openingHoursSpecification.find((h) => h.dayOfWeek.endsWith("Friday"));
    expect(fri).toMatchObject({ opens: site.hours.fri?.open, closes: site.hours.fri?.close });
  });

  it("no geo while site.json has none", () => {
    expect(site.address.geo).toBeNull();
    expect(ld.geo).toBeUndefined();
  });

  it("escapes < so no value can close the script tag", () => {
    expect(jsonLdText({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
  });

  it("snapshot for the Schema.org validator", () => {
    expect(ld).toMatchSnapshot();
  });
});
