import { describe, expect, it } from "vitest";
import { groundTilt, groundY } from "@/components/layout/ground";
import { SCENES } from "@/components/season/season-draw";
import {
  activeThemes,
  HANUKKAH,
  occasions,
  oktoberfest,
  seasonFor,
  THEME_IDS,
  thanksgiving,
} from "@/lib/season/holidays";
import { diffDays, type IsoDate, weekdayOf } from "@/lib/time/ny";

const d = (s: string) => s as IsoDate;
const on = (s: string) => activeThemes(d(s));

describe("Thanksgiving", () => {
  it("is the fourth Thursday of November", () => {
    expect(thanksgiving(2026)).toBe("2026-11-26");
    expect(thanksgiving(2027)).toBe("2027-11-25");
    expect(thanksgiving(2028)).toBe("2028-11-23"); // Nov 1 is a Wednesday
    expect(thanksgiving(2029)).toBe("2029-11-22"); // earliest possible
    expect(thanksgiving(2030)).toBe("2030-11-28"); // latest possible (Nov 1 is a Friday)
    for (let y = 2020; y <= 2040; y++) {
      const t = thanksgiving(y);
      expect(weekdayOf(t)).toBe("thu");
      expect(Number(t.slice(8))).toBeGreaterThanOrEqual(22);
      expect(Number(t.slice(8))).toBeLessThanOrEqual(28);
    }
  });
  it("shows from 17 days before through the day after", () => {
    expect(on("2026-11-08")).toEqual([]);
    expect(on("2026-11-09")).toEqual(["thanksgiving"]);
    expect(on("2026-11-13")).toEqual(["thanksgiving"]); // the e2e clock's date
    expect(on("2026-11-27")).toEqual(["thanksgiving", "hanukkah"]); // the day after
    expect(on("2026-11-28")).not.toContain("thanksgiving");
  });
});

describe("Oktoberfest", () => {
  it("runs from the Saturday after 15 September to the first Sunday of October or 3 October", () => {
    expect(oktoberfest(2026)).toEqual({ first: "2026-09-19", last: "2026-10-04" });
    // 15 September on a Saturday: the next Saturday, not that day
    expect(oktoberfest(2018)).toEqual({ first: "2018-09-22", last: "2018-10-07" });
    // first Sunday of October before the 3rd: runs to Unity Day
    expect(oktoberfest(2017)).toEqual({ first: "2017-09-16", last: "2017-10-03" });
    expect(oktoberfest(2023)).toEqual({ first: "2023-09-16", last: "2023-10-03" });
    expect(oktoberfest(2025)).toEqual({ first: "2025-09-20", last: "2025-10-05" });
    // first Sunday exactly 3 October
    expect(oktoberfest(2027)).toEqual({ first: "2027-09-18", last: "2027-10-03" });
  });
  it("shows from a week before to its last day", () => {
    expect(on("2026-09-11")).toEqual([]);
    expect(on("2026-09-12")).toEqual(["oktoberfest"]);
    expect(on("2026-10-04")).toEqual(["oktoberfest"]);
    expect(on("2026-10-05")).toEqual([]);
  });
});

describe("Halloween", () => {
  it("shows from 14 October through 1 November", () => {
    expect(on("2026-10-13")).toEqual([]);
    expect(on("2026-10-14")).toEqual(["halloween"]);
    expect(on("2026-10-31")).toEqual(["halloween"]);
    expect(on("2026-11-01")).toEqual(["halloween"]);
    expect(on("2026-11-02")).toEqual([]);
  });
});

describe("Hanukkah", () => {
  it("uses the published dates for 2026 to 2032", () => {
    expect(Object.keys(HANUKKAH).map(Number)).toEqual([2026, 2027, 2028, 2029, 2030, 2031, 2032]);
    for (const [first, last] of Object.values(HANUKKAH)) {
      expect(diffDays(d(first), d(last))).toBe(8);
    }
  });
  it("shows from 17 days before the first candle through the eighth day", () => {
    expect(on("2026-11-16")).toEqual(["thanksgiving"]);
    expect(on("2026-11-17")).toEqual(["thanksgiving", "hanukkah"]);
    expect(on("2026-12-12")[0]).toBe("hanukkah");
    expect(on("2026-12-13")).toEqual(["christmas"]);
  });
  it("has no theme outside the table", () => {
    for (const y of [2025, 2033]) expect(occasions(y).some((o) => o.id === "hanukkah")).toBe(false);
  });
  it("crosses the year in 2027, alongside Christmas and New Year", () => {
    expect(on("2027-12-25")).toEqual(["christmas", "hanukkah"]);
    expect(on("2027-12-27")).toEqual(["hanukkah", "newyear"]);
    expect(on("2028-01-01")).toEqual(["newyear", "hanukkah"]);
    expect(on("2028-01-02")).toEqual([]);
  });
});

describe("Christmas and New Year", () => {
  it("Christmas shows for three weeks through 26 December", () => {
    expect(on("2026-12-03")).toEqual(["hanukkah"]);
    expect(on("2026-12-04")).toEqual(["hanukkah", "christmas"]);
    expect(on("2026-12-24")).toEqual(["christmas"]);
    expect(on("2026-12-26")).toEqual(["christmas"]);
  });
  it("New Year takes over from 27 December to 1 January", () => {
    expect(on("2026-12-27")).toEqual(["newyear"]);
    expect(on("2027-01-01")).toEqual(["newyear"]);
    expect(on("2027-01-02")).toEqual([]);
  });
  it("2030: Hanukkah ends on the 28th, inside New Year's window", () => {
    expect(on("2030-12-25")).toEqual(["christmas", "hanukkah"]);
    expect(on("2030-12-28")).toEqual(["hanukkah", "newyear"]);
    expect(on("2030-12-29")).toEqual(["newyear"]);
  });
  it("the nearer holiday leads", () => {
    // 2028: Hanukkah 12 to 20 December
    expect(on("2028-12-05")).toEqual(["hanukkah", "christmas"]);
    expect(on("2028-12-21")).toEqual(["christmas"]);
  });
});

describe("St Patrick's Day and the Fourth of July", () => {
  it("St Patrick's Day: 28 February to 18 March, leap year or not", () => {
    expect(on("2027-02-27")).toEqual([]);
    expect(on("2027-02-28")).toEqual(["stpatricks"]);
    expect(on("2028-02-28")).toEqual([]); // leap year: 17 days before is 29 February
    expect(on("2028-02-29")).toEqual(["stpatricks"]);
    expect(on("2027-03-18")).toEqual(["stpatricks"]);
    expect(on("2027-03-19")).toEqual([]);
  });
  it("Fourth of July: 17 June to 5 July", () => {
    expect(on("2027-06-16")).toEqual([]);
    expect(on("2027-06-17")).toEqual(["july4"]);
    expect(on("2027-07-05")).toEqual(["july4"]);
    expect(on("2027-07-06")).toEqual([]);
  });
  it("is quiet in between", () => {
    for (const s of ["2027-01-15", "2027-05-01", "2027-08-15", "2027-09-01"]) expect(on(s)).toEqual([]);
  });
});

describe("the switch", () => {
  const date = d("2026-11-13");
  it("follows the date by default", () => {
    expect(seasonFor(date, {})).toEqual(["thanksgiving"]);
  });
  it("is off in an e2e run unless SEASON is set", () => {
    expect(seasonFor(date, { SV_E2E: "1" })).toEqual([]);
    expect(seasonFor(date, { SV_E2E: "1", SEASON: "christmas" })).toEqual(["christmas"]);
  });
  it("SEASON=off turns it off; SEASON=<id> forces a theme", () => {
    expect(seasonFor(date, { SEASON: "off" })).toEqual([]);
    expect(seasonFor(d("2027-05-01"), { SEASON: "Oktoberfest" })).toEqual(["oktoberfest"]);
    expect(seasonFor(date, { SEASON: "nonsense" })).toEqual(["thanksgiving"]);
  });
});

describe("the drawings", () => {
  it("every theme has a scene of two to four pieces, kept within the crest it stands on", () => {
    for (const id of THEME_IDS) {
      const pieces = SCENES[id];
      expect(pieces.length).toBeGreaterThanOrEqual(2);
      expect(pieces.length).toBeLessThanOrEqual(4);
      for (const p of pieces) expect(Math.abs(p.dx)).toBeLessThanOrEqual(45);
    }
  });
});

describe("the footer's ground line", () => {
  it("passes through the points the drawn path passes through", () => {
    for (const [x, y] of [
      [0, 44],
      [200, 24],
      [380, 40],
      [600, 22],
      [800, 38],
      [1010, 26],
      [1200, 40],
    ] as const)
      expect(groundY(x)).toBeCloseTo(y, 3);
  });
  it("is near level where the scenes stand", () => {
    expect(Math.abs(groundTilt(182))).toBeLessThan(5);
    expect(Math.abs(groundTilt(958))).toBeLessThan(5);
  });
});
