// What the menu components render (plan §5.5): stable ids for deep links, the style
// family of each beer, the one badge, and the chip each section answers to.
import type { IsoDate } from "@/lib/time/ny";
import { isBeer } from "./kinds";
import type { Group, Item, Menu } from "./schema";

export type StyleFamily = "light" | "hoppy" | "malty" | "farmhouse" | "sour";
const FAMILIES: readonly StyleFamily[] = ["light", "hoppy", "malty", "farmhouse", "sour"];

export interface ItemView {
  id: string;
  item: Item;
  sectionId: string;
  family?: StyleFamily;
  badge?: string;
}

export interface GroupView {
  title?: string;
  note?: string;
  items: ItemView[];
}

export interface SectionView {
  id: string;
  chip: string;
  title: string;
  note?: string;
  intro?: string;
  modifiers?: string;
  groups: GroupView[];
}

export interface MenuView {
  updated: IsoDate;
  pourSizes: { half: string; full: string };
  drinks: SectionView[];
  food: SectionView[];
  notices: string[];
}

/** Chip labels by section id (plan §5.5). Labels are interface labels from the spec. */
export const CHIPS: Readonly<Record<string, string>> = {
  "house-beer": "Beer",
  "drink-specials": "Specials",
  "wine-and-cider": "Wine & cider",
  cocktails: "Cocktails",
  "no-alcohol": "No-alcohol",
  "smash-burgers": "Burgers",
  "impossible-burgers": "Burgers",
  "chicken-sandwiches": "Chicken",
  "small-bites": "Small bites",
  salads: "Salads",
  sides: "Sides & sauces",
  sauces: "Sides & sauces",
  "weekly-features": "This week",
  "seasonal-specials": "Specials",
};

// other-beverages becomes three views; each lists the data's own group titles.
const SPLIT: Readonly<Record<string, readonly { id: string; groups: readonly string[] }[]>> = {
  "other-beverages": [
    { id: "wine-and-cider", groups: ["Wine", "Hard cider"] },
    { id: "cocktails", groups: ["Cocktails"] },
    { id: "no-alcohol", groups: ["Non-alcoholic"] },
  ],
};

export function kebab(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’'‘]/g, "")
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function familyOf(title: string | undefined): StyleFamily | undefined {
  const t = title?.toLowerCase();
  return FAMILIES.find((f) => f === t);
}

function badgeOf(item: Item): string | undefined {
  return item.badge ?? (item.seasonal ? "Seasonal" : undefined);
}

export function buildMenuView(menu: Menu): MenuView {
  // first pass: which names occur more than once (anywhere on this menu)
  const counts = new Map<string, number>();
  const every = [
    ...menu.drinks.flatMap((s) => s.groups.flatMap((g) => g.items)),
    ...menu.food.flatMap((s) => s.items),
  ];
  for (const i of every) counts.set(kebab(i.name), (counts.get(kebab(i.name)) ?? 0) + 1);

  const itemView = (item: Item, sectionId: string, groupTitle?: string): ItemView => {
    const base = kebab(item.name);
    const id = (counts.get(base) ?? 0) > 1 ? `${sectionId}-${base}` : base;
    const family = isBeer(item) ? familyOf(groupTitle) : undefined;
    const badge = badgeOf(item);
    return {
      id,
      item,
      sectionId,
      ...(family ? { family } : {}),
      ...(badge ? { badge } : {}),
    };
  };

  const groupView = (g: Group, sectionId: string, showTitle = true): GroupView => ({
    ...(showTitle ? { title: g.title } : {}),
    ...(g.note ? { note: g.note } : {}),
    items: g.items.map((i) => itemView(i, sectionId, g.title)),
  });

  const drinks: SectionView[] = menu.drinks.flatMap((s) => {
    const split = SPLIT[s.id];
    if (!split) {
      return [
        {
          id: s.id,
          chip: CHIPS[s.id] ?? s.title,
          title: s.title,
          ...(s.note ? { note: s.note } : {}),
          groups: s.groups.map((g) => groupView(g, s.id)),
        },
      ];
    }
    // the split views keep the parent's id in item ids, so links survive a re-split
    return split.flatMap((part, n) => {
      const groups = s.groups.filter((g) => part.groups.includes(g.title));
      if (groups.length === 0) return [];
      const single = groups.length === 1 ? groups[0] : undefined;
      return [
        {
          id: part.id,
          chip: CHIPS[part.id] ?? part.id,
          // one group: its title heads the section and is not repeated as a group header
          title: single ? single.title : (CHIPS[part.id] ?? s.title),
          ...(n === 0 && s.note ? { note: s.note } : {}),
          groups: groups.map((g) => groupView(g, s.id, !single)),
        },
      ];
    });
  });

  const food: SectionView[] = menu.food.map((s) => ({
    id: s.id,
    chip: CHIPS[s.id] ?? s.title,
    title: s.title,
    ...(s.note ? { note: s.note } : {}),
    ...(s.intro ? { intro: s.intro } : {}),
    ...(s.modifiers ? { modifiers: s.modifiers } : {}),
    groups: [{ items: s.items.map((i) => itemView(i, s.id)) }],
  }));

  return {
    updated: menu._meta.updated,
    pourSizes: menu._meta.pourSizes,
    drinks,
    food,
    notices: menu.notices,
  };
}

const itemsOf = (sections: SectionView[]) => sections.flatMap((s) => s.groups.flatMap((g) => g.items));

export function draftBeers(view: MenuView): ItemView[] {
  return itemsOf(view.drinks).filter((i) => i.sectionId === "house-beer");
}

export function findItem(view: MenuView, id: string): ItemView | undefined {
  return itemsOf([...view.drinks, ...view.food]).find((i) => i.id === id);
}
