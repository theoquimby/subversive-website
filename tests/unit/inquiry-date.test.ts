import { describe, expect, it } from "vitest";
import { toIsoDate } from "@/components/forms/InquiryForm";

describe("the inquiry form's typed date", () => {
  it("reads MM/DD/YYYY and two-digit years", () => {
    expect(toIsoDate("12/05/2026")).toBe("2026-12-05");
    expect(toIsoDate("1/9/27")).toBe("2027-01-09");
    expect(toIsoDate(" 03-14-2027 ")).toBe("2027-03-14");
  });
  it("leaves an empty date empty (it is optional)", () => {
    expect(toIsoDate("")).toBe("");
  });
  it("refuses words and dates that do not exist", () => {
    expect(toIsoDate("next Friday")).toBeNull();
    expect(toIsoDate("02/30/2027")).toBeNull();
    expect(toIsoDate("13/01/2027")).toBeNull();
  });
});
