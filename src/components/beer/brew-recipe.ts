// What the brewing drawing does differently for each beer (2026-11-16). Read only from the
// menu's own words for that beer, its style and description: nothing is added that the
// menu does not say. An extra input is named with the description's own words.
//
//   fruit, citrus   named in the description: into the fermenter
//   brine, spice    named in the description: into the kettle
//   salt            only if the description says salt: into the kettle
//   corn, rice ...  a grain named beside the barley: into the mash
//   lager, pils     in the style or description: a cold rest, frost on the tank
//   IPA, pale ale, hoppy: a second handful of hops into the fermenter
// Hops go into the kettle for every beer.
//
// What turns the liquid into the beer's own look (2026-11-18): the drawing shows what is in
// the vessel, so a colour never arrives before its cause. A fruit beer is an ordinary
// golden wort and beer until the fruit goes in; a hazy beer clouds when its dry hops go in
// (or, with none, as it ferments); every other beer is its own colour from the mash on.

export interface BrewBeer {
  id: string;
  name: string;
  style: string;
  description: string;
  color: string;
  hazy?: boolean;
  badge?: string;
}

export type ExtraKind = "fruit" | "citrus" | "brine" | "spice" | "grain" | "salt";
export type Into = "mash" | "kettle" | "ferm";

export interface Extra {
  /** the description's own words, capitalised */
  label: string;
  kind: ExtraKind;
  into: Into;
}

export interface Recipe {
  lager: boolean;
  dryHop: boolean;
  hazy: boolean;
  /** at most two, in the order the description names them */
  extras: Extra[];
  /** what turns the plain liquid into this beer's final look; null: nothing does, it is
      its own colour throughout */
  turn: "fruit" | "dryhop" | "ferment" | null;
}

const FRUIT =
  /\b((?:black |red |sour )?(?:currant|cherr(?:y|ies)|raspberr(?:y|ies)|blackberr(?:y|ies)|blueberr(?:y|ies)|strawberr(?:y|ies)|peach(?:es)?|apricots?|plums?|mango(?:es)?|passion ?fruit|guava|pineapple|grapes?|elderberr(?:y|ies)|rhubarb))\b/gi;
const CITRUS =
  /\b(sudachi|yuzu|lemons?|limes?|oranges?|grapefruits?|tangerines?|kumquats?|buddha[’']s hand)\b/gi;
const BRINE = /\b((?:\w+ )?brine)\b/gi;
const SPICE = /\b((?:pickling |whole )?spices?|coriander|peppercorns?|ginger|cinnamon)\b/gi;
const SALT = /\b(sea salt|salt)\b/gi;
const GRAIN = /\b(corn|rice|oats|rye|wheat|spelt)\b/gi;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "sudachi juice" reads better than "sudachi" alone when the menu says juice */
const withJuice = (text: string, word: string) => {
  const at = text.toLowerCase().indexOf(word.toLowerCase());
  const after = at >= 0 ? text.slice(at + word.length, at + word.length + 6).toLowerCase() : "";
  return after.startsWith(" juice") ? `${word} juice` : word;
};

export function recipeOf(beer: Pick<BrewBeer, "style" | "description" | "hazy">): Recipe {
  const text = `${beer.description}`;
  const both = `${beer.style} ${beer.description}`;
  const found: { at: number; extra: Extra }[] = [];
  const scan = (re: RegExp, kind: ExtraKind, into: Into, src = text) => {
    for (const m of src.matchAll(re)) {
      const word = m[1] ?? m[0];
      const label = cap(kind === "fruit" || kind === "citrus" ? withJuice(src, word) : word);
      if (found.some((f) => f.extra.label.toLowerCase() === label.toLowerCase())) continue;
      found.push({ at: m.index ?? 0, extra: { label, kind, into } });
    }
  };
  scan(FRUIT, "fruit", "ferm", both);
  scan(CITRUS, "citrus", "ferm");
  scan(BRINE, "brine", "kettle");
  scan(SPICE, "spice", "kettle");
  scan(SALT, "salt", "kettle");
  scan(GRAIN, "grain", "mash");
  // a style that names the fruit and a description that names it again: keep one
  found.sort((a, b) => a.at - b.at);
  const extras = found.slice(0, 2).map((f) => f.extra);
  const dryHop = /\b(ipa|pale ale|hoppy|hopped)\b/i.test(beer.style);
  const hazy = Boolean(beer.hazy);
  return {
    lager: /\b(lager|pils(?:ner)?|europils|m[äa]rzen|oktoberfest)\b/i.test(both),
    dryHop,
    hazy,
    extras,
    turn: extras.some((e) => e.kind === "fruit") ? "fruit" : hazy ? (dryHop ? "dryhop" : "ferment") : null,
  };
}

/** the flagship if there is one, else the first */
export function defaultBeer(beers: readonly BrewBeer[]): BrewBeer | undefined {
  return beers.find((b) => b.badge === "Flagship") ?? beers[0];
}
