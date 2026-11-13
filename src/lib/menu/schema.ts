// content/menu.json (or any later source) is external data: validated at the boundary
// (plan §5.5, spec §8.4). Every object is strict, so a typo in a key fails the build.
import { z } from "zod";
import { type IsoDate, isIsoDate, WEEKDAYS, type Weekday } from "@/lib/time/ny";

const isoDate = z
  .string()
  .refine(isIsoDate, "expected a real YYYY-MM-DD date")
  .transform((s) => s as IsoDate);

const weekday = z.enum(WEEKDAYS as [Weekday, ...Weekday[]]);
const tag = z.enum(["vegetarian", "vegan", "kid-friendly", "dog-friendly"]);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "expected #RRGGBB");
const price = z.number().nonnegative();
// "" in the transcription means the printed menu has no description
const text = z
  .string()
  .transform((s) => (s ? s : undefined))
  .optional();

const windowShape = {
  seasonal: z.boolean().optional(),
  availableFrom: isoDate.optional(),
  availableUntil: isoDate.optional(),
};

const ordered = (w: { availableFrom?: IsoDate; availableUntil?: IsoDate }) =>
  !(w.availableFrom && w.availableUntil && w.availableFrom > w.availableUntil);
const orderedMessage = { message: "availableFrom is after availableUntil" };

const availability = z.strictObject({
  days: z.array(weekday).min(1),
  label: z.string().min(1),
  title: z.string().min(1).optional(),
});

const itemBase = {
  ...windowShape,
  name: z.string().min(1),
  description: text,
  modifiers: z.string().optional(),
  tags: z.array(tag).optional(),
  badge: z.string().optional(),
  availability: availability.optional(),
};

const beerItem = z
  .strictObject({
    ...itemBase,
    style: z.string().min(1),
    abv: z.number().positive().max(20),
    prices: z.strictObject({ half: price, full: price }),
    color: hex,
    hazy: z.boolean().optional(),
  })
  .refine(ordered, orderedMessage);

const plainItem = z
  .strictObject({
    ...itemBase,
    price: price.optional(),
    producer: z.string().optional(),
    origin: z.string().optional(),
    verifyPrice: z.boolean().optional(),
  })
  .refine(ordered, orderedMessage);

const group = z
  .strictObject({
    ...windowShape,
    title: z.string().min(1),
    note: z.string().optional(),
    items: z.array(z.union([beerItem, plainItem])),
  })
  .refine(ordered, orderedMessage);

const sectionId = z.string().regex(/^[a-z0-9-]+$/);

const drinkSection = z
  .strictObject({
    ...windowShape,
    id: sectionId,
    title: z.string().min(1),
    note: z.string().optional(),
    groups: z.array(group),
  })
  .refine(ordered, orderedMessage);

const foodSection = z
  .strictObject({
    ...windowShape,
    id: sectionId,
    title: z.string().min(1),
    intro: z.string().optional(),
    modifiers: z.string().optional(),
    note: z.string().optional(),
    items: z.array(plainItem),
  })
  .refine(ordered, orderedMessage);

export const menuSchema = z.strictObject({
  _meta: z.strictObject({
    source: z.string(),
    verify: z.array(z.string()),
    pourSizes: z.strictObject({ half: z.string(), full: z.string() }),
    updated: isoDate,
  }),
  drinks: z.array(drinkSection),
  food: z.array(foodSection),
  notices: z.array(z.string()),
});

export type Menu = z.infer<typeof menuSchema>;
export type Tag = z.infer<typeof tag>;
export type Availability = z.infer<typeof availability>;
export type BeerItem = z.infer<typeof beerItem>;
export type PlainItem = z.infer<typeof plainItem>;
export type Item = BeerItem | PlainItem;
export type Group = z.infer<typeof group>;
export type DrinkSection = z.infer<typeof drinkSection>;
export type FoodSection = z.infer<typeof foodSection>;
/** A seasonal window (plan §5.5 calls it Window; renamed so it never shadows the DOM's). */
export type MenuWindow = { seasonal?: boolean; availableFrom?: IsoDate; availableUntil?: IsoDate };

export function parseMenu(json: unknown): Menu {
  return menuSchema.parse(json);
}

export { isBeer } from "./kinds";
