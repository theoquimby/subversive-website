import raw from "@content/menu.json";
import { describe, expect, it } from "vitest";
import { todaysFeatures, weeklyFeatures } from "@/lib/menu/features";
import { parseMenu } from "@/lib/menu/schema";
import { buildMenuView } from "@/lib/menu/view";

const view = buildMenuView(parseMenu(raw));

describe("features (plan §5.5, Q16)", () => {
  it("groups by title", () => {
    expect(weeklyFeatures(view).map((g) => [g.title, g.label, g.days])).toEqual([
      ["Wing Wednesday", "Wednesdays only", ["wed"]],
      ["Rodeo Thursdays", "Rodeo Thursdays", ["thu"]],
    ]);
  });

  it("Wednesday → one group with the wings", () => {
    const wed = todaysFeatures(view, "wed");
    expect(wed).toHaveLength(1);
    expect(wed[0]?.items.map((i) => i.item.name)).toEqual(["Wing Wednesday Special"]);
  });

  it("Thursday → three Rodeo items", () => {
    const thu = todaysFeatures(view, "thu");
    expect(thu).toHaveLength(1);
    expect(thu[0]?.items).toHaveLength(3);
  });

  it("Friday → none", () => {
    expect(todaysFeatures(view, "fri")).toEqual([]);
  });
});
