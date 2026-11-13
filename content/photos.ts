// Photo manifest (spec §3.7, plan M1 item 12). Alt text says what is visible, plainly.
// `focal` is the [x, y] percentage each crop centres on. `menuItemId` links a photo to a
// dish so a caption prints only while that dish is on the menu (plan Q19).
// Not here: malt-raking (the malting floor, spec O10), kept in docs/source/legacy.
import type { StaticImageData } from "next/image";
import beerGardenNight from "../public/photos/beer-garden-night.webp";
import brewhouseCopper from "../public/photos/brewhouse-copper.webp";
import burgerAndBeer from "../public/photos/burger-and-beer.webp";
import burgerAndBeerWide from "../public/photos/burger-and-beer-wide.webp";
import canInHand from "../public/photos/can-in-hand.webp";
import exteriorDusk from "../public/photos/exterior-dusk.webp";
import firepitBeers from "../public/photos/firepit-beers.webp";
import foundersDoorway from "../public/photos/founders-doorway.webp";
import giantPretzel from "../public/photos/giant-pretzel.webp";
import grainInHands from "../public/photos/grain-in-hands.webp";
import heatedTent from "../public/photos/heated-tent.webp";
import kettleDark from "../public/photos/kettle-dark.webp";
import lobsterRoll from "../public/photos/lobster-roll.webp";
import patioPlate from "../public/photos/patio-plate.webp";

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
} as const satisfies Record<string, Photo>;

export type PhotoId = keyof typeof photos;
