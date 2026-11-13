import { describe, expect, it } from "vitest";
import { weekdayTag } from "@/components/home/HeroStickers";
import { isOvertime } from "@/components/home/OvertimeSwitch";

const game = { startsAt: "2026-11-13T19:00:00-05:00", endsAt: "2026-11-13T21:30:00-05:00" };
const at = (iso: string) => Date.parse(iso);

describe("Overtime switch (spec §5.6)", () => {
  it("Paper at 3 h 01 m before tip; Overtime at 2 h 59 m, during; Paper after the end", () => {
    expect(isOvertime([game], at("2026-11-13T15:59:00-05:00"))).toBe(false);
    expect(isOvertime([game], at("2026-11-13T16:01:00-05:00"))).toBe(true);
    expect(isOvertime([game], at("2026-11-13T20:00:00-05:00"))).toBe(true);
    expect(isOvertime([game], at("2026-11-13T21:31:00-05:00"))).toBe(false);
    expect(isOvertime([], at("2026-11-13T20:00:00-05:00"))).toBe(false);
  });
});

describe("hero fact tag by weekday (spec §6.1.2)", () => {
  it("Wing Wednesday, Rodeo Thursdays, otherwise the dogs", () => {
    expect(weekdayTag("wed")).toBe("Wing Wednesday");
    expect(weekdayTag("thu")).toBe("Rodeo Thursdays");
    expect(weekdayTag("fri")).toBe("Dogs welcome in the tent");
  });
});
