import menu from "@content/menu.json";
import { describe, expect, it } from "vitest";
import { type Layout, PHONE, WIDE } from "@/components/beer/brew-layout";
import { type Brew, createBrew, moving, paint, setStage, step } from "@/components/beer/brew-model";
import { recipeOf } from "@/components/beer/brew-recipe";

// The brewing drawing (Our beer): what each beer's recipe is read as, and the model's
// promises: grain and liquid are conserved in both acts, every run comes to rest, nothing
// it paints is not a number, and a beer is never its final colour before its cause is in.

interface MenuBeer {
  name: string;
  style: string;
  description?: string;
  hazy?: boolean;
}
const beers = (menu as { drinks: { id: string; groups: { items: MenuBeer[] }[] }[] }).drinks
  .filter((s) => s.id === "house-beer")
  .flatMap((s) => s.groups.flatMap((g) => g.items));
const recipe = (name: string) => {
  const b = beers.find((x) => x.name === name);
  if (!b) throw new Error(`no beer called ${name}`);
  return recipeOf({ style: b.style, description: b.description ?? "", hazy: b.hazy });
};

describe("a beer's recipe comes from its menu words", () => {
  it("adds only what the description names, where it goes", () => {
    expect(recipe("Forbidden Fruit").extras).toEqual([
      { label: "Black currant", kind: "fruit", into: "ferm" },
    ]);
    expect(recipe("Sudachi Saison").extras.map((e) => [e.label, e.into])).toEqual([
      ["Sudachi juice", "ferm"],
      ["Buddha’s hand", "ferm"],
    ]);
    expect(recipe("Cheap Dills").extras.map((e) => [e.label, e.kind, e.into])).toEqual([
      ["Pickle brine", "brine", "kettle"],
      ["Pickling spice", "spice", "kettle"],
    ]);
    expect(recipe("¡Chinga La Migra!").extras).toEqual([{ label: "Corn", kind: "grain", into: "mash" }]);
    expect(recipe("Subversive Saison").extras).toEqual([]);
    expect(recipe("Puff Puff Pils").extras).toEqual([]);
  });
  it("chills lagers, dry-hops hoppy styles", () => {
    expect(recipe("Puff Puff Pils")).toMatchObject({ lager: true, dryHop: false });
    expect(recipe("Hoppy American Lager")).toMatchObject({ lager: true, dryHop: true });
    expect(recipe("New York Nectar")).toMatchObject({ lager: false, dryHop: true });
    expect(recipe("Subversive Saison")).toMatchObject({ lager: false, dryHop: false });
  });
  it("names what turns the liquid into the beer's own look", () => {
    expect(recipe("Forbidden Fruit").turn).toBe("fruit");
    expect(recipe("Off Axis").turn).toBe("dryhop");
    expect(recipe("New York Nectar").turn).toBeNull();
    expect(recipe("Cheap Dills").turn).toBeNull();
  });
});

const grain = (s: Brew) =>
  s.sack +
  s.steepG +
  s.floorG +
  s.kilnG +
  s.maltG +
  s.heap +
  s.mashG +
  s.binG +
  s.sh.load +
  s.grains.filter((d) => d.on && d.link === -1).reduce((a, d) => a + d.share, 0) +
  ((s.links[6]?.cum ?? 0) - (s.links[6]?.landed ?? 0));
const liquid = (s: Brew) =>
  s.tankS +
  s.tankM +
  s.steepW +
  s.drained +
  s.mashW +
  s.kettle +
  s.evap +
  s.ferm +
  s.cont.reduce((a, c) => a + c, 0) +
  [1, 2, 7, 8, 9, 10].reduce((a, i) => a + (s.links[i]?.cum ?? 0) - (s.links[i]?.landed ?? 0), 0);

/** play from a stage until the model says it is at rest; what happened on the way */
function play(s: Brew, L: Layout, from: Parameters<typeof setStage>[1]) {
  setStage(s, from, L);
  const g0 = grain(s);
  const l0 = liquid(s);
  let t = 0;
  let drift = 0;
  let bad = 0;
  let early = 0; // the most the beer had turned before its fermentation began
  for (; t < 90; t += 1 / 60) {
    step(s, L, 1 / 60);
    drift = Math.max(drift, Math.abs(grain(s) - g0), Math.abs(liquid(s) - l0));
    if (s.stage !== "ferment" && s.stage !== "out" && s.stage !== "done") early = Math.max(early, s.tint);
    if (Math.round(t * 60) % 20 === 0)
      paint(s, L, (_k, _a, v) => {
        if (/NaN|Infinity|undefined/.test(v)) bad++;
      });
    if (s.stage === "done" && !moving(s)) break;
  }
  return { t, drift, bad, early };
}

describe("the brewing model", () => {
  for (const L of [PHONE, WIDE]) {
    it(`conserves, rests and paints numbers: both acts, then brewing only (${L.id})`, () => {
      const s = createBrew(recipe("Forbidden Fruit"));
      const both = play(s, L, "grain");
      expect(both.t).toBeLessThan(60);
      expect(both.drift).toBeLessThan(1e-6);
      expect(both.bad).toBe(0);
      expect(s.maltG).toBe(0);
      expect(s.binG).toBeCloseTo(0.5, 6);
      // choosing a beer: brewing only, from a full malt bin
      const again = play(s, L, "mill");
      expect(again.t).toBeLessThan(both.t - 8);
      expect(again.drift).toBeLessThan(1e-6);
      expect(again.bad).toBe(0);
      expect(s.cont.reduce((a, c) => a + c, 0)).toBeCloseTo(0.9, 6);
    });
    it(`settles when played from any station (${L.id})`, () => {
      const s = createBrew(recipe("Hoppy American Lager"));
      for (const from of [
        "steep",
        "germ",
        "kiln",
        "malt",
        "mash",
        "runoff",
        "spent",
        "boil",
        "ferment",
        "out",
      ] as const) {
        const r = play(s, L, from);
        expect(r.t, from).toBeLessThan(60);
        expect(r.drift, from).toBeLessThan(1e-6);
        expect(r.bad, from).toBe(0);
      }
    });
  }
  it("turns a fruit beer only once the fruit is in, and all the way by the time it is packed", () => {
    const s = createBrew(recipe("Forbidden Fruit"));
    const r = play(s, WIDE, "mill");
    expect(r.early).toBe(0);
    expect(s.tint).toBe(1);
  });
  it("pitches the yeast only after the transfer", () => {
    const s = createBrew(recipe("New York Nectar"));
    setStage(s, "boil", WIDE);
    for (let t = 0; t < 60 && s.stage !== "ferment"; t += 1 / 60) {
      step(s, WIDE, 1 / 60);
      expect(s.yeastIn).toBe(false);
    }
    expect(s.kettle).toBe(0);
  });
});
