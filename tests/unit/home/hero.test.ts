import { describe, expect, it } from "vitest";
import { weekdayTag } from "@/components/home/HeroStickers";

describe("hero fact tag by weekday (spec §6.1.2)", () => {
  it("Wing Wednesday, Rodeo Thursdays, otherwise the dogs", () => {
    expect(weekdayTag("wed")).toBe("Wing Wednesday");
    expect(weekdayTag("thu")).toBe("Rodeo Thursdays");
    expect(weekdayTag("fri")).toBe("Dogs welcome in the tent");
  });
});
