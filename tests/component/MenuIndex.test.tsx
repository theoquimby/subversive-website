// @vitest-environment happy-dom
import raw from "@content/menu.json";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MenuIndex } from "@/components/menu/MenuIndex";
import { parseMenu } from "@/lib/menu/schema";
import { buildMenuView, draftBeers } from "@/lib/menu/view";

afterEach(cleanup);
const view = buildMenuView(parseMenu(raw));
const beers = draftBeers(view);
const dishes = view.food.flatMap((s) => s.groups.flatMap((g) => g.items));
const chips = (sections: typeof view.drinks) =>
  sections.map((s) => ({ id: s.id, label: s.chip, sections: [s.id] }));

function mount() {
  return render(
    <div data-menu="" data-show="drinks">
      <nav className="menu-bar">
        <MenuIndex drinks={chips(view.drinks)} food={chips(view.food)} beers={beers} dishes={dishes} />
      </nav>
      <div data-list="drinks">
        {beers.map((b) => (
          <div key={b.id} data-row={b.id} />
        ))}
        <div data-row="negroni" />
      </div>
    </div>,
  ).container;
}
const index = () => screen.getByRole("button", { name: /Menu sections/ });
const count = () => document.querySelector(".index-count");

describe("MenuIndex (spec §6.2; review pass 2026-11-15)", () => {
  it("the button opens a sheet with the list's sections, then its filters", () => {
    mount();
    expect(index().getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(index());
    const sheet = screen.getByRole("dialog");
    const first = view.drinks[0];
    expect(sheet.querySelector(`.index-list a[href="#${first?.id}"]`)?.textContent).toBe(first?.chip);
    expect(sheet.querySelectorAll(".index-list a")).toHaveLength(view.drinks.length);
    expect(screen.getByRole("button", { name: "Light" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("toggling a filter dims non-matches and announces the count", () => {
    const c = mount();
    fireEvent.click(index());
    fireEvent.click(screen.getByRole("button", { name: "Light" }));
    fireEvent.click(screen.getByRole("button", { name: "Sour" }));
    expect(screen.getByRole("button", { name: "Light" }).getAttribute("aria-pressed")).toBe("true");
    expect(count()?.textContent).toBe("4 beers match");
    expect(c.querySelector('[data-row="puff-puff-pils"]')?.hasAttribute("data-dim")).toBe(false);
    expect(c.querySelector('[data-row="new-york-nectar"]')?.hasAttribute("data-dim")).toBe(true);
    // drink filters touch beer rows only
    expect(c.querySelector('[data-row="negroni"]')?.hasAttribute("data-dim")).toBe(false);
  });

  it("the count is a polite live region, empty with nothing on; the bar says how many are on", () => {
    const c = mount();
    fireEvent.click(index());
    expect(count()?.getAttribute("aria-live")).toBe("polite");
    expect(count()?.textContent).toBe("");
    fireEvent.click(screen.getByRole("button", { name: "Hoppy" }));
    expect(c.querySelector(".mbar-index__n")?.textContent).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: "Hoppy" }));
    expect(count()?.textContent).toBe("");
    expect(c.querySelectorAll("[data-dim]")).toHaveLength(0);
    expect(c.querySelector(".mbar-index__n")).toBeNull();
  });
});
