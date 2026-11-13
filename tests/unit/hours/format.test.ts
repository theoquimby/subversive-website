import { describe, expect, it } from "vitest";
import {
  formatClock,
  formatDateShort,
  formatRange,
  formatStatus,
  formatTime,
  weekdayLabel,
} from "@/lib/hours/format";
import type { HHmm, IsoDate } from "@/lib/time/ny";

const t = (s: string) => s as HHmm;

describe("formatTime (hours of operation)", () => {
  it.each([
    ["16:30", "4:30"],
    ["20:00", "8"],
    ["12:00", "12"],
    ["11:00", "11 AM"],
    ["09:30", "9:30 AM"],
  ])("%s → %s", (a, b) => expect(formatTime(t(a))).toBe(b));
  it("minutes past midnight roll over", () => {
    expect(formatTime(1470)).toBe("12:30 AM");
    expect(formatTime(1440)).toBe("12 AM");
  });
});

describe("formatClock (event starts)", () => {
  it("keeps the minutes", () => {
    expect(formatClock(t("19:00"))).toBe("7:00");
    expect(formatClock(t("18:30"))).toBe("6:30");
    expect(formatClock(t("11:00"))).toBe("11:00 AM");
  });
});

describe("formatRange", () => {
  it("uses an en dash", () => {
    expect(formatRange(990, 1200)).toBe("4:30–8");
    expect(formatRange(720, 1230)).toBe("12–8:30");
  });
});

describe("weekdayLabel and formatDateShort", () => {
  it("weekday forms", () => {
    expect(weekdayLabel("sat", "short")).toBe("Sat");
    expect(weekdayLabel("sat", "long")).toBe("Saturday");
    expect(weekdayLabel("tue", "plural")).toBe("Tuesdays");
  });
  it("short dates", () => {
    expect(formatDateShort("2026-11-25" as IsoDate)).toBe("Wed Nov 25");
  });
});

describe("formatStatus (spec §4.2 copy)", () => {
  it("every state", () => {
    expect(formatStatus({ kind: "open", closes: 1230, kitchenCloses: 1215 })).toEqual({
      dot: "go",
      text: "Open now · til 8:30",
      muted: "· kitchen til 8:15",
    });
    expect(formatStatus({ kind: "open", closes: 1200, kitchenCloses: null })).toEqual({
      dot: "go",
      text: "Open now · til 8",
    });
    expect(
      formatStatus({
        kind: "open-late",
        closes: 1290,
        kitchenCloses: 1215,
        label: "Knicks",
        starts: t("19:00"),
      }),
    ).toEqual({ dot: "go", text: "Open late tonight · Knicks at 7:00" });
    expect(formatStatus({ kind: "kitchen-closed", closes: 1230 })).toEqual({
      dot: "amber",
      text: "Bar open til 8:30 · kitchen closed",
    });
    expect(formatStatus({ kind: "opens-later", opens: 990 })).toEqual({
      dot: "hollow",
      text: "Opens today at 4:30",
    });
    expect(
      formatStatus({
        kind: "closed-for-day",
        next: { date: "2026-11-14" as IsoDate, weekday: "sat", open: 720 },
      }),
    ).toEqual({ dot: "hollow", text: "Closed now · opens Sat at 12" });
    expect(
      formatStatus({
        kind: "closed-weekday",
        weekday: "tue",
        next: { date: "2026-11-18" as IsoDate, weekday: "wed", open: 990 },
      }),
    ).toEqual({ dot: "hollow", text: "Closed Tuesdays · back Wed at 4:30" });
    expect(formatStatus({ kind: "closed-special", title: "Thanksgiving", next: null })).toEqual({
      dot: "hollow",
      text: "Closed today · Thanksgiving",
    });
  });
  it("stops before the · when nothing opens within 14 days", () => {
    expect(formatStatus({ kind: "closed-for-day", next: null }).text).toBe("Closed now");
    expect(formatStatus({ kind: "closed-weekday", weekday: "tue", next: null }).text).toBe("Closed Tuesdays");
  });
});
