// @vitest-environment happy-dom
import raw from "@content/menu.json";
import { cleanup, render } from "@testing-library/react";
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
const mount = (id: string, detail = false) =>
  render(
    <ul>
      <MenuRow row={row(id)} index={0} detail={detail} />
    </ul>,
  ).container;

describe("MenuRow (spec §4.4; review pass 2026-11-15)", () => {
  it("nothing folds: the whole description and the price are simply there", () => {
    const c = mount("chinga-la-migra");
    expect(c.querySelector("details")).toBeNull();
    expect(c.querySelector(".mrow__name")?.textContent).toBe("¡Chinga La Migra!");
    expect(c.querySelector(".mrow__desc")?.textContent).toContain("go directly to CCSM");
    // the two pours are set with thin spaces around the stroke
    expect(c.querySelector(".mrow__price")?.textContent).toMatch(/^5\s\/\s8$/);
  });

  it("modifiers follow the row", () => {
    const c = mount("house-salad");
    expect(c.querySelector(".mrow__sum .mrow__more")).toBeNull();
    expect(c.querySelector(".mrow__box > .mrow__more")?.textContent).toContain("grilled chicken +6");
  });

  it("on the menu the whole row is one link to the item's detail view, carrying the beer's colour", () => {
    const c = mount("puff-puff-pils", true);
    const a = c.querySelector("a.mrow__box");
    expect(a?.id).toBe("puff-puff-pils");
    expect(a?.getAttribute("href")).toBe("?item=puff-puff-pils");
    expect(a?.getAttribute("data-item")).toBe("puff-puff-pils");
    expect(a?.querySelector(".mrow__price")).not.toBeNull();
    expect(c.querySelector("li")?.getAttribute("data-color")).toMatch(/^#/);
    // no photo named: no photo attribute, so the detail view shows no placeholder
    expect(c.querySelector("li")?.hasAttribute("data-photo")).toBe(false);
  });

  it("elsewhere a row is plain: no link, nothing for the detail view", () => {
    const c = mount("puff-puff-pils");
    expect(c.querySelector("a")).toBeNull();
    expect(c.querySelector("div#puff-puff-pils")).not.toBeNull();
    expect(c.querySelector("li")?.hasAttribute("data-color")).toBe(false);
  });

  it("one badge at most; no glass in a row (it is in the detail view)", () => {
    const c = mount("new-york-nectar");
    expect(c.querySelectorAll(".badge")).toHaveLength(1);
    expect(c.querySelector("svg")).toBeNull();
  });

  it("Mushroom & Swiss shows 20", () => {
    expect(mount("mushroom-and-swiss").querySelector(".mrow__price")?.textContent).toBe("20");
  });
});
