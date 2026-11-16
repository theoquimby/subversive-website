// Photo manifest (spec §3.7, plan M1 item 12). Alt text says what is visible, plainly.
// `focal` is the [x, y] percentage each crop centres on. `menuItemId` links a photo to a
// dish so a caption prints only while that dish is on the menu (plan Q19).
// Not here: malt-raking (the malting floor, spec O10), kept in docs/source/legacy.
import type { StaticImageData } from "next/image";
// From the brewery's own uploads to its Google listing ("By owner"), 2026-11-15, with
// Theo's go-ahead. None shows the old "Malting" name.
import barStools from "../public/photos/bar-stools.webp";
import beerGardenNight from "../public/photos/beer-garden-night.webp";
import brewhouseCopper from "../public/photos/brewhouse-copper.webp";
import buildingDusk from "../public/photos/building-dusk.webp";
import burgerAndBeer from "../public/photos/burger-and-beer.webp";
import burgerAndBeerWide from "../public/photos/burger-and-beer-wide.webp";
import canInHand from "../public/photos/can-in-hand.webp";
import exteriorDusk from "../public/photos/exterior-dusk.webp";
import fireTable from "../public/photos/fire-table.webp";
import firepitBeers from "../public/photos/firepit-beers.webp";
import foundersDoorway from "../public/photos/founders-doorway.webp";
import frontDay from "../public/photos/front-day.webp";
import gardenDay from "../public/photos/garden-day.webp";
import gardenDusk from "../public/photos/garden-dusk.webp";
import giantPretzel from "../public/photos/giant-pretzel.webp";
import grainInHands from "../public/photos/grain-in-hands.webp";
import heatedTent from "../public/photos/heated-tent.webp";
import itemBuffaloChickenSalad from "../public/photos/item-buffalo-chicken-salad.webp";
import itemChickenTenders from "../public/photos/item-chicken-tenders.webp";
import itemClassic from "../public/photos/item-classic.webp";
// Dishes, from the brewery's own Square ordering page, 2026-11-15 (Theo asked). Only its
// own photographs at a usable size: the supplier's promotional images, the clip-art
// salads and the thumbnail-sized ones were left. Shown in the menu's item detail view.
import itemFrites from "../public/photos/item-frites.webp";
import itemPankoChicken from "../public/photos/item-panko-chicken.webp";
import itemPretzelSticks from "../public/photos/item-pretzel-sticks.webp";
import itemWings from "../public/photos/item-wings.webp";
import kettleDark from "../public/photos/kettle-dark.webp";
import lobsterRoll from "../public/photos/lobster-roll.webp";
import patioPlate from "../public/photos/patio-plate.webp";
import tanks from "../public/photos/tanks.webp";
import taproomInside from "../public/photos/taproom-inside.webp";
import taproomTables from "../public/photos/taproom-tables.webp";
import tentInside from "../public/photos/tent-inside.webp";

export interface Photo {
  src: StaticImageData;
  alt: string;
  focal: [number, number];
  credit?: string;
  menuItemId?: string;
}

export const photos = {
  "burger-and-beer": {
    src: burgerAndBeer,
    alt: "A smash burger and a glass of golden beer printed with the barley mark, on the bar",
    focal: [55, 60],
  },
  "burger-and-beer-wide": {
    src: burgerAndBeerWide,
    alt: "A smash burger and a glass of golden beer printed with the barley mark, on the bar",
    focal: [55, 60],
  },
  "firepit-beers": {
    src: firepitBeers,
    alt: "A golden beer and a dark beer in barley-mark glasses beside a fire pit",
    focal: [45, 55],
  },
  "beer-garden-night": {
    src: beerGardenNight,
    alt: "The beer garden at night under string lights, with picnic tables and a fire pit",
    focal: [45, 55],
  },
  "heated-tent": {
    src: heatedTent,
    alt: "Long picnic tables under umbrellas beside fire troughs, the barley pattern painted on the wall",
    focal: [55, 50],
  },
  "exterior-dusk": {
    src: exteriorDusk,
    alt: "The brewery at dusk, its roll-up door open and the barley mark painted on the wall",
    focal: [50, 55],
  },
  "giant-pretzel": {
    src: giantPretzel,
    alt: "A giant salted pretzel with a cup of beer cheese",
    focal: [40, 55],
    menuItemId: "giant-bavarian-pretzel",
  },
  "lobster-roll": { src: lobsterRoll, alt: "A lobster roll with fries on printed paper", focal: [50, 40] },
  "patio-plate": {
    src: patioPlate,
    alt: "A bowl of corn, sausage, clams and potatoes on a patio table",
    focal: [50, 70],
  },
  "brewhouse-copper": {
    src: brewhouseCopper,
    alt: "A copper tank in the brewhouse",
    focal: [40, 50],
  },
  "kettle-dark": { src: kettleDark, alt: "A paddle stirring grain in a dark brew kettle", focal: [70, 60] },
  "grain-in-hands": { src: grainInHands, alt: "Two hands lifting a heap of grain", focal: [55, 55] },
  "founders-doorway": {
    src: foundersDoorway,
    alt: "Two people standing in the open brewhouse doorway, one holding a beer",
    focal: [50, 55],
  },
  "can-in-hand": {
    src: canInHand,
    alt: "A hand holding a can of Hoppy Lager against a blue sky and hop vines",
    focal: [45, 40],
  },
  "taproom-inside": {
    src: taproomInside,
    alt: "Inside the taproom: tall tables and stools, hanging plants, the barley mark on the wall",
    focal: [50, 55],
  },
  "bar-stools": {
    src: barStools,
    alt: "The bar, with stools along a high table and the roll-up doors open behind",
    focal: [45, 55],
  },
  "taproom-tables": {
    src: taproomTables,
    alt: "The taproom floor: high tables, a fridge of cans, the brewing tanks at the back",
    focal: [50, 55],
  },
  tanks: {
    src: tanks,
    alt: "Steel brewing tanks and oak barrels on the brewery floor",
    focal: [55, 55],
  },
  "front-day": {
    src: frontDay,
    alt: "The front of the taproom by day, with striped umbrellas over picnic tables",
    focal: [50, 50],
  },
  "garden-day": {
    src: gardenDay,
    alt: "The beer garden on a summer day: picnic tables, red chairs and planters on gravel",
    focal: [50, 55],
  },
  "tent-inside": {
    src: tentInside,
    alt: "Inside the canvas tent: picnic tables under a string of lights",
    focal: [50, 60],
  },
  "building-dusk": {
    src: buildingDusk,
    alt: "The taproom building at dusk, strung with lights",
    focal: [50, 50],
  },
  "fire-table": {
    src: fireTable,
    alt: "A glass of beer in front of the fire table, picnic tables behind",
    focal: [50, 55],
  },
  "garden-dusk": {
    src: gardenDusk,
    alt: "The beer garden at dusk, full of people under strings of lights",
    focal: [45, 60],
  },
  "item-frites": {
    src: itemFrites,
    alt: "A paper cone of fries in a wire stand on the bar",
    focal: [50, 50],
  },
  "item-pretzel-sticks": {
    src: itemPretzelSticks,
    alt: "Four pretzel sticks on checkered paper with beer cheese and mustard",
    focal: [50, 50],
  },
  "item-classic": {
    src: itemClassic,
    alt: "A smash burger with two patties, melted American cheese, lettuce and pickles",
    focal: [50, 50],
  },
  "item-panko-chicken": {
    src: itemPankoChicken,
    alt: "A fried chicken sandwich with coleslaw and pickles on a milk bun",
    focal: [50, 50],
  },
  "item-buffalo-chicken-salad": {
    src: itemBuffaloChickenSalad,
    alt: "A bowl of salad topped with buffalo chicken and blue cheese",
    focal: [50, 50],
  },
  "item-chicken-tenders": {
    src: itemChickenTenders,
    alt: "Chicken tenders and fries on checkered paper",
    focal: [50, 50],
  },
  "item-wings": {
    src: itemWings,
    alt: "A hand lifting a buffalo wing from a paper-lined basket with carrots and celery",
    focal: [50, 50],
  },
} as const satisfies Record<string, Photo>;

export type PhotoId = keyof typeof photos;
