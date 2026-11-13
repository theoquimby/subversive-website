import { describe, expect, it } from "vitest";
import { formatPair, formatPrice } from "@/lib/menu/price";

describe("price (spec §2.3)", () => {
  it("prints as the menu prints", () => {
    expect(formatPrice(18)).toBe("18");
    expect(formatPrice(1.5)).toBe("1.50");
    expect(formatPrice(0.5)).toBe("0.50");
  });

  it("pairs carry thin spaces around the slash", () => {
    expect(formatPair(5, 8)).toBe("5 / 8");
  });
});
