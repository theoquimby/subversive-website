// Type guards with no runtime dependencies, so client components can use them without
// pulling the Zod schema into the browser (plan Q3 budget: Zod alone is ~35 KB gzip).
import type { BeerItem, Item } from "./schema";

export function isBeer(i: Item): i is BeerItem {
  return "abv" in i && "prices" in i;
}
