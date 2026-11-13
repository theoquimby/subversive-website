import { describe, expect, it } from "vitest";
import { formatStatus } from "@/lib/hours/format";
import type { HoursEvent } from "@/lib/hours/schedule";
import { seedHoursEvents } from "@/lib/hours/seed-events";
import { statusAt } from "@/lib/hours/status";
import { getSite } from "@/lib/site/site";
import { addDays, type HHmm, type IsoDate, nyInstant, toMinutes } from "@/lib/time/ny";

const site = getSite();
const seed = seedHoursEvents();
const at = (date: string, time: string) => nyInstant(date as IsoDate, toMinutes(time as HHmm));
const closure = (date: string, title: string): HoursEvent => ({
  id: `c-${date}`,
  date: date as IsoDate,
  title,
  displayTitle: title,
  kind: "HOLIDAY",
  closed: true,
  startTime: null,
  endTime: null,
});
const line = (instant: Date, events: readonly HoursEvent[]) => formatStatus(statusAt(instant, site, events));

const lateSat: HoursEvent = {
  id: "late-sat",
  date: "2026-11-28" as IsoDate,
  title: "Late show",
  displayTitle: "Late show",
  kind: "MUSIC",
  closed: false,
  startTime: "21:00" as HHmm,
  endTime: "00:30" as HHmm,
};

describe("statusAt (plan M4 matrix)", () => {
  it.each([
    ["2026-11-16", "17:00", [], "Open now · til 8", undefined],
    ["2026-11-20", "17:00", [], "Open now · til 8:30", "· kitchen til 8:15"],
    ["2026-11-20", "20:20", [], "Bar open til 8:30 · kitchen closed", undefined],
    ["2026-11-13", "15:00", [], "Opens today at 4:30", undefined],
    ["2026-11-13", "17:00", [], "Open late tonight · Knicks at 7:00", undefined],
    ["2026-11-13", "20:20", [], "Bar open til 9:30 · kitchen closed", undefined],
    ["2026-11-13", "21:45", [], "Closed now · opens Sat at 12", undefined],
    ["2026-11-14", "09:00", [], "Opens today at 12", undefined],
    ["2026-11-15", "13:00", [], "Open late tonight · Knicks at 6:00", undefined],
    ["2026-11-16", "21:00", [], "Closed now · opens Wed at 4:30", undefined],
    ["2026-11-17", "12:00", [], "Closed Tuesdays · back Wed at 4:30", undefined],
    [
      "2026-11-26",
      "12:00",
      [closure("2026-11-26", "Thanksgiving")],
      "Closed today · Thanksgiving",
      undefined,
    ],
    [
      "2026-11-25",
      "22:30",
      [closure("2026-11-26", "Thanksgiving")],
      "Closed now · opens Fri at 4:30",
      undefined,
    ],
    ["2026-11-29", "00:10", [lateSat], "Bar open til 12:30 AM · kitchen closed", undefined],
  ] as const)("%s %s → %s", (date, time, extra, text, muted) => {
    const s = line(at(date, time), [...seed, ...extra]);
    expect(s.text).toBe(text);
    expect(s.muted).toBe(muted);
  });

  it("across both DST changes", () => {
    for (const date of ["2026-11-01", "2027-03-14"]) {
      expect(line(at(date, "12:30"), [])).toEqual({
        dot: "go",
        text: "Open now · til 6:30",
        muted: "· kitchen til 6:15",
      });
    }
  });

  it("closures for 15 straight days: no 'opens' part", () => {
    const start = "2026-12-01" as IsoDate;
    const events = Array.from({ length: 16 }, (_, i) => closure(addDays(start, i), "Winter break"));
    expect(line(at("2026-12-01", "12:00"), events).text).toBe("Closed today · Winter break");
    const after = statusAt(at("2026-12-01", "12:00"), site, events);
    expect(after.kind === "closed-special" && after.next).toBeNull();
  });

  it("boundaries: open at open, kitchen-closed at kitchen close, closed at close", () => {
    expect(statusAt(at("2026-11-20", "16:30"), site, []).kind).toBe("open");
    expect(statusAt(at("2026-11-20", "20:15"), site, []).kind).toBe("kitchen-closed");
    expect(statusAt(at("2026-11-20", "20:30"), site, []).kind).toBe("closed-for-day");
    // Monday's kitchen and bar close together: at 20:00 it is simply closed
    expect(statusAt(at("2026-11-16", "20:00"), site, []).kind).toBe("closed-for-day");
  });
});
