import { describe, expect, it } from "vitest";
import {
  addDays,
  diffDays,
  fromMinutes,
  type HHmm,
  type IsoDate,
  isHHmm,
  isIsoDate,
  isoWithOffset,
  nyInstant,
  nyParts,
  toMinutes,
  WEEKDAYS,
  weekdayOf,
} from "@/lib/time/ny";

const d = (s: string) => s as IsoDate;
const t = (s: string) => s as HHmm;

describe("guards", () => {
  it("accepts real ISO dates and rejects impossible ones", () => {
    expect(isIsoDate("2026-11-13")).toBe(true);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-1-1")).toBe(false);
  });
  it("accepts 24 h HH:mm only", () => {
    expect(isHHmm("16:30")).toBe(true);
    expect(isHHmm("00:00")).toBe(true);
    expect(isHHmm("24:00")).toBe(false);
    expect(isHHmm("7:00")).toBe(false);
    expect(isHHmm("12:60")).toBe(false);
  });
});

describe("nyParts", () => {
  it("reads a winter instant in EST", () => {
    expect(nyParts(new Date("2026-11-13T23:30:00Z"))).toEqual({
      date: "2026-11-13",
      weekday: "fri",
      minutes: 18 * 60 + 30,
      offsetMinutes: -300,
    });
  });
  it("reads a summer instant in EDT", () => {
    expect(nyParts(new Date("2026-07-04T16:05:00Z"))).toEqual({
      date: "2026-07-04",
      weekday: "sat",
      minutes: 12 * 60 + 5,
      offsetMinutes: -240,
    });
  });
  it("puts a just-after-midnight UTC instant on the previous NY date", () => {
    expect(nyParts(new Date("2026-11-14T02:00:00Z")).date).toBe("2026-11-13");
  });
});

describe("calendar math", () => {
  it("knows 2026-11-13 is a Friday", () => {
    expect(weekdayOf(d("2026-11-13"))).toBe("fri");
    expect(WEEKDAYS[0]).toBe("mon");
    expect(WEEKDAYS).toHaveLength(7);
  });
  it("adds days across month, year and both DST dates", () => {
    expect(addDays(d("2026-11-30"), 1)).toBe("2026-12-01");
    expect(addDays(d("2026-12-31"), 1)).toBe("2027-01-01");
    expect(addDays(d("2026-10-31"), 1)).toBe("2026-11-01");
    expect(addDays(d("2026-11-01"), 1)).toBe("2026-11-02");
    expect(addDays(d("2027-03-13"), 1)).toBe("2027-03-14");
    expect(addDays(d("2027-03-14"), 1)).toBe("2027-03-15");
    expect(addDays(d("2027-01-01"), -1)).toBe("2026-12-31");
  });
  it("diffs days as b − a", () => {
    expect(diffDays(d("2026-11-13"), d("2026-11-25"))).toBe(12);
    expect(diffDays(d("2027-03-15"), d("2027-03-13"))).toBe(-2);
  });
  it("converts minutes both ways and wraps past midnight", () => {
    expect(toMinutes(t("16:30"))).toBe(990);
    expect(fromMinutes(990)).toBe("16:30");
    expect(fromMinutes(1470)).toBe("00:30");
  });
});

describe("nyInstant", () => {
  it("is 17:00Z at noon on 2026-11-01 (EST after the change)", () => {
    expect(nyInstant(d("2026-11-01"), 720).toISOString()).toBe("2026-11-01T17:00:00.000Z");
  });
  it("is 16:00Z at noon on 2027-03-14 (EDT after the change)", () => {
    expect(nyInstant(d("2027-03-14"), 720).toISOString()).toBe("2027-03-14T16:00:00.000Z");
  });
  it("resolves the nonexistent 02:30 on 2027-03-14 one hour later", () => {
    // 03:30 EDT = 07:30Z
    expect(nyInstant(d("2027-03-14"), 150).toISOString()).toBe("2027-03-14T07:30:00.000Z");
  });
  it("resolves the doubled 01:30 on 2026-11-01 to the first occurrence", () => {
    // 01:30 EDT = 05:30Z
    expect(nyInstant(d("2026-11-01"), 90).toISOString()).toBe("2026-11-01T05:30:00.000Z");
  });
  it("rolls minutes past 1440 to the next date", () => {
    // 00:30 on 2026-11-14, EST
    expect(nyInstant(d("2026-11-13"), 1470).toISOString()).toBe("2026-11-14T05:30:00.000Z");
  });
});

describe("isoWithOffset", () => {
  it("prints -05:00 in winter and -04:00 in summer", () => {
    expect(isoWithOffset(d("2026-11-13"), 19 * 60)).toBe("2026-11-13T19:00:00-05:00");
    expect(isoWithOffset(d("2026-07-04"), 19 * 60)).toBe("2026-07-04T19:00:00-04:00");
  });
  it("rolls past midnight onto the next date", () => {
    expect(isoWithOffset(d("2026-11-13"), 1470)).toBe("2026-11-14T00:30:00-05:00");
  });
});
