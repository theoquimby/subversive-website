// Where the menu comes from (spec §8.4, plan §5.5). MENU_SOURCE=file (default) reads
// content/menu.json; "square" is the O3 stub and rejects until it is built.
import { fileMenuSource } from "./file";
import type { Menu } from "./schema";
import { squareMenuSource } from "./square";

export interface MenuSource {
  getMenu(): Promise<Menu>;
}

export function getMenu(): Promise<Menu> {
  return (process.env.MENU_SOURCE === "square" ? squareMenuSource : fileMenuSource).getMenu();
}
