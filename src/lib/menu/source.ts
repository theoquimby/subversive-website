// Where the menu comes from (spec §8.4, plan §5.5). MENU_SOURCE=file (default) reads
// content/menu.json; "ops" reads the Ops feed with the file as its fallback; "square" is
// the O3 stub and rejects until it is built.
import { fileMenuSource } from "./file";
import { opsMenuSource } from "./ops";
import type { Menu } from "./schema";
import { squareMenuSource } from "./square";
import { withSquarePrices } from "./square-prices";

export interface MenuSource {
  getMenu(): Promise<Menu>;
}

export function getMenu(): Promise<Menu> {
  const which = process.env.MENU_SOURCE;
  const menu = (
    which === "ops" ? opsMenuSource : which === "square" ? squareMenuSource : fileMenuSource
  ).getMenu();
  // whichever source it is, the kitchen's prices are the ones in Square (square-prices.ts)
  return menu.then(withSquarePrices);
}
