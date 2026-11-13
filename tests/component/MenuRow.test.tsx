// @vitest-environment happy-dom
import raw from "@content/menu.json";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MenuRow } from "@/components/menu/MenuRow";
import { parseMenu } from "@/lib/menu/schema";
import { buildMenuView, findItem } from "@/lib/menu/view";

afterEach(cleanup);
const view = buildMenuView(parseMenu(raw));
const row = (id: string) => {
  const r = findItem(view, id);
  if (!r) throw new Error(id);
  return r;
};
const mount = (id: string) =>
  render(
    <ul>
      <MenuRow row={row(id)} index={0} />
    </ul>,
  ).container;

describe("MenuRow (spec §4.4)", () => {
  it("a long row is a closed disclosure with name and price in the summary", () => {
    const c = mount("chinga-la-migra");
    const details = c.querySelector("details");
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    const summary = c.querySelector("summary");
    expect(summary?.textContent).toContain("¡Chinga La Migra!");
    expect(summary?.querySelector(".mrow__price")?.textContent).toBe("5 / 8");
  });

  it("opens on click and on Enter", () => {
    const c = mount("chinga-la-migra");
    const details = c.querySelector("details") as HTMLDetailsElement;
    const summary = c.querySelector("summary") as HTMLElement;
    fireEvent.click(summary);
    expect(details.open).toBe(true);
    fireEvent.click(summary);
    expect(details.open).toBe(false);
    // a summary is a native button: Enter activates it as a click
    summary.focus();
    fireEvent.keyDown(summary, { key: "Enter" });
    fireEvent.click(summary);
    expect(details.open).toBe(true);
  });

  it("the long description is clamped by CSS only while closed (no truncation in the DOM)", () => {
    const c = mount("chinga-la-migra");
    expect(c.querySelector(".mrow__desc")?.textContent).toContain("go directly to CCSM");
  });

  it("modifiers sit outside the summary, revealed on open", () => {
    const c = mount("house-salad");
    expect(c.querySelector("summary .mrow__more")).toBeNull();
    expect(c.querySelector("details > .mrow__more")?.textContent).toContain("grilled chicken +6");
  });

  it("a short row is not a disclosure", () => {
    const c = mount("puff-puff-pils");
    expect(c.querySelector("details")).toBeNull();
    expect(c.querySelector("#puff-puff-pils")).not.toBeNull();
  });

  it("one badge at most; beers get the glass, food does not", () => {
    expect(mount("new-york-nectar").querySelectorAll(".badge")).toHaveLength(1);
    cleanup();
    expect(mount("new-york-nectar").querySelector("svg.glass")).not.toBeNull();
    cleanup();
    expect(mount("classic").querySelector("svg.glass")).toBeNull();
  });

  it("Mushroom & Swiss shows 20", () => {
    expect(mount("mushroom-and-swiss").querySelector(".mrow__price")?.textContent).toBe("20");
  });
});
