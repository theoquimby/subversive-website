// v1 source (spec §8.4): content/menu.json, read at build. Invalid data throws, which
// fails the build rather than shipping a broken menu.
import raw from "@content/menu.json";
import { type Menu, parseMenu } from "./schema";
import type { MenuSource } from "./source";

let cached: Menu | null = null;

export const fileMenuSource: MenuSource = {
  async getMenu() {
    cached ??= parseMenu(raw);
    return cached;
  },
};
