import { describe, expect, it } from "vitest";
import { type HoursEvent, scheduleFor, specialHours } from "@/lib/hours/schedule";
import { seedHoursEvents } from "@/lib/hours/seed-events";
import { getSite } from "@/lib/site/site";
import type { HHmm, IsoDate } from "@/lib/time/ny";

const site = getSite();
const seed = seedHoursEvents();
const d = (s: string) => s as IsoDate;
const ev = (o: Partial<HoursEvent> & { date: string }): HoursEvent => ({
  id: o.id ?? `t-${o.date}-${o.title ?? "x"}`,
  title: o.title ?? "Test",
  displayTitle: o.displayTitle ?? o.title ?? "Test",
  kind: o.kind ?? "OTHER",
  closed: o.closed ?? false,
  startTime: (o.startTime ?? null) as HHmm | null,
  endTime: (o.endTime ?? null) as HHmm | null,
  date: d(o.date),
});

describe("scheduleFor (spec §8.5, plan §5.3 rules)", () => {
  it.each([
    ["2026-11-16", "mon", 990, 1200, 1200],
    ["2026-11-18", "wed", 990, 1200, 1200],
    ["2026-11-19", "thu", 990, 1200, 1200],
    ["2026-11-20", "fri", 990, 1230, 1215],
    ["2026-11-22", "sun", 720, 1110, 1095],
  ])("%s %s from site.json", (date, weekday, open, close, kitchen) => {
    const s = scheduleFor(d(date), site, []);
    expect(s).toMatchObject({ weekday, closed: false, open, close, kitchenClose: kitchen });
    expect(s.reason).toBeUndefined();
  });

  it("Tuesday is closed, weekly", () => {
    expect(scheduleFor(d("2026-11-17"), site, seed)).toMatchObject({
      closed: true,
      open: null,
      close: null,
      kitchenClose: null,
      reason: { type: "weekly" },
    });
  });

  it("Fri 2026-11-13 with the seed: close 21:30, kitchen 20:15, late", () => {
    const s = scheduleFor(d("2026-11-13"), site, seed);
    expect(s).toMatchObject({ close: 1290, kitchenClose: 1215, open: 990 });
    expect(s.reason).toMatchObject({ type: "late", kind: "GAME", title: "Knicks at Pacers" });
  });

  it("Sun 2026-11-15: close 20:30 (normally 18:30)", () => {
    expect(scheduleFor(d("2026-11-15"), site, seed).close).toBe(1230);
  });

  it("Thu 2026-12-10 trivia: close 20:30", () => {
    expect(scheduleFor(d("2026-12-10"), site, seed).close).toBe(1230);
  });

  it("an event ending before close changes nothing", () => {
    const s = scheduleFor(d("2026-11-20"), site, [
      ev({ date: "2026-11-20", startTime: "17:00", endTime: "19:00" }),
    ]);
    expect(s.close).toBe(1230);
    expect(s.reason).toBeUndefined();
  });

  it("two events: the later end wins", () => {
    const s = scheduleFor(d("2026-11-20"), site, [
      ev({ date: "2026-11-20", title: "A", startTime: "18:00", endTime: "21:00" }),
      ev({ date: "2026-11-20", title: "B", startTime: "19:00", endTime: "22:00" }),
    ]);
    expect(s.close).toBe(1320);
    expect(s.reason).toMatchObject({ type: "late", title: "B" });
  });

  it("a closure beats a game the same day", () => {
    const s = scheduleFor(d("2026-11-13"), site, [
      ...seed,
      ev({ date: "2026-11-13", title: "Private event", closed: true, kind: "CLOSURE" }),
    ]);
    expect(s).toMatchObject({ closed: true, reason: { type: "closure", title: "Private event" } });
  });

  it("an event on a Tuesday leaves it closed", () => {
    const s = scheduleFor(d("2026-11-17"), site, [
      ev({ date: "2026-11-17", startTime: "18:00", endTime: "22:00" }),
    ]);
    expect(s.closed).toBe(true);
  });

  it("an event ending 00:30 closes at 1470", () => {
    const s = scheduleFor(d("2026-11-21"), site, [
      ev({ date: "2026-11-21", startTime: "21:00", endTime: "00:30" }),
    ]);
    expect(s.close).toBe(1470);
  });

  it("specialHours lists exactly the dated rows for 14 days from 2026-11-13", () => {
    const rows = specialHours(d("2026-11-13"), 14, site, seed);
    expect(rows.map((r) => [r.date, r.label])).toEqual([
      ["2026-11-13", "open late for Knicks"],
      ["2026-11-15", "open late for Knicks"],
      ["2026-11-21", "open late for Knicks"],
      ["2026-11-25", "open late for Knicks"],
    ]);
  });

  it("special rows name closures", () => {
    const rows = specialHours(d("2026-11-20"), 10, site, [
      ev({ date: "2026-11-26", title: "Thanksgiving", closed: true, kind: "HOLIDAY" }),
    ]);
    expect(rows.map((r) => r.label)).toEqual(["closed for Thanksgiving"]);
  });
});
