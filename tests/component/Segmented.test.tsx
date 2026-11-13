// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { Segmented } from "@/components/ui/Segmented";

afterEach(cleanup);

function Harness() {
  const [v, setV] = useState<"drinks" | "food">("drinks");
  return (
    <Segmented
      label="Drinks or food"
      value={v}
      onValueChange={setV}
      options={[
        { value: "drinks", label: "Drinks" },
        { value: "food", label: "Food" },
      ]}
    />
  );
}

describe("Segmented (spec §4.11)", () => {
  it("is a labelled radio group with aria-checked", () => {
    render(<Harness />);
    expect(screen.getByRole("radiogroup", { name: "Drinks or food" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Drinks" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "Food" }).getAttribute("aria-checked")).toBe("false");
  });

  it("roving tabindex: one tab stop, on the checked option once focus is inside", () => {
    render(<Harness />);
    const drinks = screen.getByRole("radio", { name: "Drinks" });
    fireEvent.focus(drinks);
    expect(drinks.getAttribute("tabindex")).toBe("0");
    expect(screen.getByRole("radio", { name: "Food" }).getAttribute("tabindex")).toBe("-1");
  });

  // arrow keys are covered in a real browser: tests/e2e/menu.spec.ts

  it("a click selects", () => {
    render(<Harness />);
    const food = screen.getByRole("radio", { name: "Food" });
    fireEvent.click(food);
    expect(food.getAttribute("aria-checked")).toBe("true");
  });
});
