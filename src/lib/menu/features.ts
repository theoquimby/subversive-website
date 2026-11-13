// Day-of-week features (spec §6.2, §8.4, plan Q16). Pure: the weekday is passed in, and
// the server renders the unhighlighted week so cached HTML is never wrong.
import type { Weekday } from "@/lib/time/ny";
import type { ItemView, MenuView } from "./view";

export interface FeatureGroup {
  title: string;
  label: string;
  days: Weekday[];
  items: ItemView[];
}

export function weeklyFeatures(view: MenuView): FeatureGroup[] {
  const groups = new Map<string, FeatureGroup>();
  for (const section of view.food) {
    for (const i of section.groups.flatMap((g) => g.items)) {
      const a = i.item.availability;
      if (!a) continue;
      const key = a.title ?? a.label;
      const g = groups.get(key) ?? { title: key, label: a.label, days: [...a.days], items: [] };
      g.items.push(i);
      groups.set(key, g);
    }
  }
  return [...groups.values()];
}

export function todaysFeatures(view: MenuView, weekday: Weekday): FeatureGroup[] {
  return weeklyFeatures(view).filter((g) => g.days.includes(weekday));
}
