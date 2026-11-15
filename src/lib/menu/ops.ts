// The menu from Ops (MENU_SOURCE=ops): the same shape as content/menu.json, checked with
// the same schema. Falls back to the file when the feed fails, is invalid, or has no food
// yet (until Max turns items on in Ops, the feed carries only what is on tap).
import { unstable_cache } from "next/cache";
import { fetchOps } from "../ops/fetch";
import { fileMenuSource } from "./file";
import { type Menu, parseMenu } from "./schema";
import type { MenuSource } from "./source";

const read = unstable_cache(
  async (): Promise<Menu> => parseMenu(await fetchOps("/api/public/menu")),
  ["ops-menu"],
  {
    revalidate: 300,
    tags: ["menu"],
  },
);

export const opsMenuSource: MenuSource = {
  async getMenu() {
    try {
      const menu = await read();
      if (menu.food.length > 0) return menu;
    } catch (e) {
      console.warn(`menu: Ops feed not used (${e instanceof Error ? e.message : "error"}); using menu.json`);
    }
    return fileMenuSource.getMenu();
  },
};
