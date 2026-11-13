// @vitest-environment happy-dom
import raw from "@content/menu.json";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FilterChips } from "@/components/menu/FilterChips";
import { parseMenu } from "@/lib/menu/schema";
import { buildMenuView, draftBeers } from "@/lib/menu/view";

afterEach(cleanup);
const view = buildMenuView(parseMenu(raw));
const beers = draftBeers(view);
const dishes = view.food.flatMap((s) => s.groups.flatMap((g) => g.items));

function mount() {
  return render(
    <>
      <FilterChips show="drinks" beers={beers} dishes={dishes} />
      <div data-list="drinks">
        {beers.map((b) => (
          <div key={b.id} data-row={b.id} />
        ))}
        <div data-row="negroni" />
      </div>
    </>,
  ).container;
}

describe("FilterChips (spec §6.2)", () => {
  it("toggling dims non-matches and announces the count", () => {
    const c = mount();
    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    fireEvent.click(screen.getByRole("button", { name: "Sour" }));
    expect(screen.getByRole("button", { name: "Light" }).getAttribute("aria-pressed")).toBe("true");
    expect(c.querySelector(".filters__count")?.textContent).toBe("4 beers match");
    expect(c.querySelector('[data-row="puff-puff-pils"]')?.hasAttribute("data-dim")).toBe(false);
    expect(c.querySelector('[data-row="new-york-nectar"]')?.hasAttribute("data-dim")).toBe(true);
    // drink filters touch beer rows only
    expect(c.querySelector('[data-row="negroni"]')?.hasAttribute("data-dim")).toBe(false);
  });

  it("the count is a polite live region and empty with nothing on", () => {
    const c = mount();
    const count = c.querySelector(".filters__count");
    expect(count?.getAttribute("aria-live")).toBe("polite");
    expect(count?.textContent).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Hoppy" }));
    fireEvent.click(screen.getByRole("button", { name: "Hoppy" }));
    expect(count?.textContent).toBe("");
    expect(c.querySelectorAll("[data-dim]")).toHaveLength(0);
  });

  it("the Filter pill reports how many are on and expands the row", () => {
    mount();
    const pill = screen.getByRole("button", { name: /Filter/ });
    expect(pill.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(pill);
    expect(pill.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Under 5%" }));
    expect(pill.textContent).toContain("1");
  });
});
