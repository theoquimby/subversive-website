import raw from "@content/site.json";
import { describe, expect, it } from "vitest";
import { parseSite } from "@/lib/site/schema";
import { getSite } from "@/lib/site/site";

describe("site.json (plan §5.2)", () => {
  it("parses", () => {
    const site = getSite();
    expect(site.name).toBe("Subversive");
    expect(site.address.city).toBe("Catskill");
    expect(site.hours.tue).toBeNull();
  });

  it("never returns _archived or _meta", () => {
    const site = getSite() as unknown as Record<string, unknown>;
    expect(site._archived).toBeUndefined();
    expect(site._meta).toBeUndefined();
  });

  it("fails when a weekday is missing", () => {
    const broken = structuredClone(raw) as Record<string, unknown> & { hours: Record<string, unknown> };
    delete broken.hours.sat;
    expect(() => parseSite(broken)).toThrow();
  });

  it("rejects a malformed time", () => {
    const broken = structuredClone(raw) as Record<string, unknown> & {
      hours: Record<string, { open: string } | null>;
    };
    const fri = broken.hours.fri;
    if (fri) fri.open = "4:30pm";
    expect(() => parseSite(broken)).toThrow();
  });
});
