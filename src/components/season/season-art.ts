// The drawings for the holiday touches, in the same hand as the pen drawings (Doodle.tsx,
// home/Ways.tsx): loose single strokes, a little wobbly, one weight of ink. Colour is a
// fill from the tokens and used sparingly: at most two per drawing. Styles: fx-season.css.
import type { ThemeId } from "@/lib/season/holidays";

/** A fill from the tokens; a drawing part without one is filled with the page colour. */
export type Fill = "none" | "bg" | "card" | "fg" | "ember" | "pils" | "go" | "sky" | "sky-deep";
/** A stepped loop (fx-season.css); every item has at most one. */
export type Loop = "fall" | "swing" | "turn" | "twinkle" | "flutter" | "bob";

export interface Part {
  d: string;
  fill?: Fill;
  /** a stroke in ember instead of ink (the stripes on a flag) */
  ember?: boolean;
}

/* ---------- The logo touch ----------
   Drawn in a frame of its own: the base sits on y = 0, centred on x = 0, and up is −y.
   SeasonMark puts that frame on the barley mark's top kernel (mark units, viewBox 0 0 60
   170): `at` is where the base lands, `turn` how far it leans (29.6° lies along the
   kernel's slanted top edge, so a hat sits on it). Strokes are a true 1.6 px. */
export interface Touch {
  parts: Part[];
  at: [number, number];
  turn: number;
  scale: number;
}

const ON_TOP: Pick<Touch, "at" | "turn"> = { at: [19, 8.5], turn: 29.6 };

export const TOUCHES: Record<ThemeId, Touch> = {
  // a Santa hat, the tip flopped over with its bobble
  christmas: {
    ...ON_TOP,
    scale: 1.3,
    parts: [
      {
        d: "M-15 -6C-14 -22 -6 -38 8 -42C16 -44 22 -38 24 -30C18 -34 13 -33 12 -26C12 -18 13 -12 15 -6Z",
        fill: "ember",
      },
      {
        d: "M-19 -7C-7 -10 7 -10 19 -7C20 -4 20 -1 19 1C7 -2 -7 -2 -19 1C-20 -2 -20 -4 -19 -7Z",
        fill: "card",
      },
      { d: "M20 -29a5 5 0 1 0 10 0a5 5 0 1 0 -10 0", fill: "card" },
    ],
  },
  // a pilgrim's hat: tall crown, wide brim, a gold buckle
  thanksgiving: {
    ...ON_TOP,
    scale: 1.25,
    parts: [
      { d: "M-12 -5C-11 -18 -10 -30 -9 -38C-3 -39.5 3 -39.5 9 -38C10 -30 11 -18 12 -5Z", fill: "fg" },
      { d: "M-22 -3C-10 -7.5 10 -7.5 22 -3C12 1.5 -12 1.5 -22 -3Z", fill: "fg" },
      { d: "M-5.5 -17C-2 -17.4 2 -17.4 5.5 -17V-8C2 -7.6 -2 -7.6 -5.5 -8Z", fill: "pils" },
    ],
  },
  // a Bavarian hat: pinched crown, an upturned brim, a green band and a feather
  oktoberfest: {
    ...ON_TOP,
    scale: 1.25,
    parts: [
      { d: "M-11 -11C-18 -22 -20 -34 -15 -44C-11 -34 -9 -22 -11 -11Z" },
      { d: "M-13 -6C-14 -16 -10 -28 -2 -30C2 -31 6 -26 7 -22C9 -27 13 -26 13 -20C14 -14 13 -10 13 -6Z" },
      { d: "M-13.4 -11C-4 -13 5 -13 13.4 -11L13.2 -6.5C5 -8.5 -4 -8.5 -13.2 -6.5Z", fill: "go" },
      { d: "M-22 -9C-18 -3 -8 -2 0 -3C8 -2 18 -3 22 -9C20 -1 10 2 0 2C-10 2 -20 -1 -22 -9Z" },
    ],
  },
  // a pumpkin balanced on the top kernel, with its stem and a curl of vine
  halloween: {
    ...ON_TOP,
    scale: 1.2,
    parts: [
      {
        d: "M-16 -11C-17 -21 -9 -27 0 -25C9 -27 17 -21 16 -11C15 -3 8 0 0 -1C-8 0 -15 -3 -16 -11Z",
        fill: "ember",
      },
      { d: "M0 -25C-5 -19 -5 -7 0 -1" },
      { d: "M0 -25C0 -29 1 -32 4 -33M2 -30C6 -31 8 -28 6 -26" },
    ],
  },
  // a dreidel spinning on its point on the top corner, tipped a little
  hanukkah: {
    at: [13, 5],
    turn: 12,
    scale: 1.15,
    parts: [
      { d: "M0 -28V-38" },
      {
        d: "M-10 -28C-3 -29 3 -29 10 -28C10.5 -22 10.5 -17 10 -12L0 -1L-10 -12C-10.5 -17 -10.5 -22 -10 -28Z",
        fill: "sky-deep",
      },
    ],
  },
  // a party hat with a few sparks off its tip
  newyear: {
    at: [18, 8],
    turn: 18,
    scale: 1.25,
    parts: [
      { d: "M-12 0C-8 -12 -3 -26 1 -38C5 -26 9 -12 12 0C4 2 -4 2 -12 0Z", fill: "pils" },
      { d: "M-6.5 -17C-2 -15 3 -15 6.5 -17.5M-9.5 -8C-3 -6 4 -6 9.5 -8.5" },
      { d: "M1 -43V-49M-3.5 -42L-7.5 -46M5.5 -42L9.5 -46" },
    ],
  },
  // a sprig of shamrock tucked in at the top
  stpatricks: {
    at: [21, 9.5],
    turn: 8,
    scale: 1.2,
    parts: [
      { d: "M0 0C0 -8 -1 -14 -1 -20" },
      {
        d: "M-1 -20C-5 -24 -7 -30 -4 -32C-2 -33 -1 -31 -1 -30C-1 -31 0 -33 2 -32C5 -30 3 -24 -1 -20ZM-1 -20C-7 -18 -13 -18 -14 -22C-14 -24 -12 -25 -11 -25C-12 -26 -13 -28 -11 -29C-8 -31 -3 -26 -1 -20ZM-1 -20C5 -18 11 -18 12 -22C12 -24 10 -25 9 -25C10 -26 11 -28 9 -29C6 -31 1 -26 -1 -20Z",
        fill: "go",
      },
    ],
  },
  // a little flag on a stick, planted in the top kernel
  july4: {
    at: [19, 9],
    turn: -4,
    scale: 1.2,
    parts: [
      { d: "M0 2V-42" },
      { d: "M0 -42C6 -45 12 -38 20 -41L20 -26C12 -23 6 -30 0 -27Z", fill: "card" },
      { d: "M9 -36.6C13 -35.4 16 -35.6 20 -36.6M9 -31.2C13 -30 16 -30.4 20 -31.4", ember: true },
      { d: "M0 -42C3 -43.5 6 -42.6 9 -41.2V-32.8C6 -34 3 -34.6 0 -33.6Z", fill: "sky-deep" },
    ],
  },
};

/* ---------- The scattered items ----------
   Small drawings on a 48 × 48 sheet, drawn and inked in like the other pen drawings. */
export interface Item {
  parts: Part[];
  loop?: Loop;
}

const ITEMS = {
  mapleLeaf: {
    loop: "fall",
    parts: [
      {
        d: "M24 31C18 33 12 31 10 27C14 26 15 24 13 21C17 22 19 20 18 16C21 18 23 16 24 11C25 16 27 18 30 16C29 20 31 22 35 21C33 24 34 26 38 27C36 31 30 33 24 31Z",
        fill: "ember",
      },
      { d: "M24 41V19" },
    ],
  },
  oakLeaf: {
    loop: "fall",
    parts: [
      {
        d: "M24 34C19 34 15 31 16 27C12 27 11 23 14 21C10 19 11 15 15 15C13 11 16 8 20 10C20 6 28 6 28 10C32 8 35 11 33 15C37 15 38 19 34 21C37 23 36 27 32 27C33 31 29 34 24 34Z",
        fill: "pils",
      },
      { d: "M24 42V12" },
    ],
  },
  acorn: {
    parts: [
      { d: "M16 23C16 32 20 38 24 39.5C28 38 32 32 32 23" },
      { d: "M14 22.5C13 14 35 14 34 22.5C28 24.5 20 24.5 14 22.5Z" },
      { d: "M24 15.6C24 12 25.6 10 28 9" },
    ],
  },
  snowflake: {
    loop: "turn",
    parts: [
      { d: "M24 7V41M9.3 15.5L38.7 32.5M9.3 32.5L38.7 15.5" },
      {
        d: "M20 10L24 14L28 10M20 38L24 34L28 38M10 21L15.2 19.4L14 14M38 27L32.8 28.6L34 34M10 27L15.2 28.6L14 34M38 21L32.8 19.4L34 14",
      },
    ],
  },
  tree: {
    parts: [
      {
        d: "M24 8C21 12 17 17 14 21H19.5C17 25 14 29 11 33C17 33.4 31 33.4 37 33C34 29 31 25 28.5 21H34C31 17 27 12 24 8Z",
      },
      { d: "M21.5 33.4V41H26.5V33.4" },
      {
        d: "M24 1.5L25.5 4.6L28.8 5L26.4 7.2L27 10.4L24 8.8L21 10.4L21.6 7.2L19.2 5L22.5 4.6Z",
        fill: "pils",
      },
    ],
  },
  bauble: {
    loop: "swing",
    parts: [
      { d: "M24 4C24 7 26 8 26 10" },
      { d: "M21 10.5C23 10.2 25 10.2 27 10.5V14H21Z" },
      {
        d: "M24 14C17 14 13 19.5 13 25C13 31 18 36 24 36C30 36 35 31 35 25C35 19.5 31 14 24 14Z",
        fill: "ember",
      },
    ],
  },
  candle: {
    parts: [
      { d: "M20 41C19.6 33 20.4 25 20 18C22.6 17.4 25.4 17.4 28 18C27.6 25 28.4 33 28 41" },
      { d: "M24 17.6V14.6" },
      { d: "M24 13.5C21 11 21.6 7 24 3C26.4 7 27 11 24 13.5Z", fill: "pils" },
    ],
  },
  gelt: {
    parts: [
      { d: "M12 24C12 17 17 12 24 12C31 12 36 17 36 24C36 31 31 36 24 36C17 36 12 31 12 24Z", fill: "pils" },
      {
        d: "M17.5 24C17.5 20 20.5 17.5 24 17.5C27.5 17.5 30.5 20 30.5 24C30.5 28 27.5 30.5 24 30.5C20.5 30.5 17.5 28 17.5 24Z",
      },
    ],
  },
  dreidel: {
    loop: "swing",
    parts: [
      { d: "M24 14V5" },
      { d: "M14 14C20 13 28 13 34 14C35 20 35 26 34 30L24 41L14 30C13 26 13 20 14 14Z", fill: "sky-deep" },
    ],
  },
  burst: {
    loop: "twinkle",
    parts: [
      {
        d: "M24 6V14M24 34V42M6 24H14M34 24H42M11.5 11.5L17 17M31 31L36.5 36.5M11.5 36.5L17 31M31 17L36.5 11.5",
      },
    ],
  },
  star: {
    parts: [
      {
        d: "M24 8C25.5 12 26.6 15.5 28 19C32 19 36 18.8 40 19C37 21.6 33.6 23.6 30.4 26C31.6 30 32.8 34 34 38C30.6 35.6 27.4 33.4 24 31C20.6 33.4 17.4 35.6 14 38C15.2 34 16.4 30 17.6 26C14.4 23.6 11 21.6 8 19C12 18.8 16 19 20 19C21.4 15.5 22.5 12 24 8Z",
        fill: "pils",
      },
    ],
  },
  confetti: {
    loop: "bob",
    parts: [
      {
        d: "M8 12C10 10 12 14 14 12C16 10 18 14 20 12M30 7L34 11M18 30C20 28 22 32 24 30M33 25L37 29L33 33M11 38L16 35.6M38 40L40 36",
      },
    ],
  },
  shamrock: {
    loop: "swing",
    parts: [
      { d: "M24 25C24 32 22 38 17 42" },
      {
        d: "M24 24C20 20 18 14 21 12C23 11 24 13 24 14C24 13 25 11 27 12C30 14 28 20 24 24ZM24 24C18 26 12 26 11 22C11 20 13 19 14 19C13 18 12 16 14 15C17 13 22 18 24 24ZM24 24C30 26 36 26 37 22C37 20 35 19 34 19C35 18 36 16 34 15C31 13 26 18 24 24Z",
        fill: "go",
      },
    ],
  },
  rainbow: {
    parts: [{ d: "M7 38C7 21 41 21 41 38M13 38C13 27.6 35 27.6 35 38M19 38C19 33.4 29 33.4 29 38" }],
  },
  flag: {
    loop: "flutter",
    parts: [
      { d: "M12 43V7" },
      { d: "M12 8C18 5 24 11 34 8V22C24 25 18 19 12 22Z", fill: "card" },
      { d: "M21 13.4C25 14.4 29 14.2 34 12.6M21 18C25 19 29 18.8 34 17.2", ember: true },
      { d: "M12 8C15 7 18 7.6 21 9V15.8C18 14.6 15 14.2 12 15Z", fill: "sky-deep" },
    ],
  },
  pumpkin: {
    parts: [
      { d: "M24 15C14 13 7 19 8 28C9 37 16 41 24 40C32 41 39 37 40 28C41 19 34 13 24 15Z", fill: "ember" },
      { d: "M24 15C19 21 19 34 24 40M24 15C29 21 29 34 24 40" },
      { d: "M24 15C24 11 25 8 28 7" },
    ],
  },
  bat: {
    loop: "bob",
    parts: [
      {
        d: "M24 22C22 18 18 17 16 19C14 16 9 16 6 19C9 20 10 24 9 27C12 25 16 26 18 28C19 25 21 24 24 26C27 24 29 25 30 28C32 26 36 25 39 27C38 24 39 20 42 19C39 16 34 16 32 19C30 17 26 18 24 22Z",
      },
    ],
  },
  moon: {
    parts: [
      { d: "M30 8C20 8 13 16 13 24C13 33 20 40 30 40C24 36 21 30 21 24C21 18 24 12 30 8Z", fill: "pils" },
    ],
  },
  pretzel: {
    parts: [
      { d: "M17 39C10 32 6 22 11 15C16 9 23 12 24 19C25 12 32 9 37 15C42 22 38 32 31 39" },
      { d: "M14 25C19 31 29 31 34 25" },
    ],
  },
  stein: {
    parts: [
      { d: "M34 19C42 19 42 33 34 33" },
      { d: "M12 14C11 24 12 34 13 40C19 41 27 41 33 40C34 34 35 24 34 14Z", fill: "pils" },
      { d: "M10 14C10 9 14 7 18 9C20 6 26 6 28 9C32 7 37 9 36 14C28 15.4 18 15.4 10 14Z", fill: "card" },
    ],
  },
  bunting: {
    loop: "swing",
    parts: [
      { d: "M4 10C16 16 32 16 44 10" },
      { d: "M10 12.6L13 21L16.4 14.4ZM21 15.2L24 23.6L27 15.2ZM31.6 14.4L35 21L38 12.6Z", fill: "sky" },
    ],
  },
} satisfies Record<string, Item>;

export type ItemName = keyof typeof ITEMS;
export const ITEM_ART: Record<ItemName, Item> = ITEMS;

/** Five per theme, in slot order: two on the ground line, the third on wider screens,
 * then the left and the right margin on wide screens. */
export const SCATTER: Record<ThemeId, readonly [ItemName, ItemName, ItemName, ItemName, ItemName]> = {
  thanksgiving: ["mapleLeaf", "acorn", "oakLeaf", "oakLeaf", "mapleLeaf"],
  christmas: ["snowflake", "tree", "bauble", "snowflake", "snowflake"],
  hanukkah: ["candle", "gelt", "dreidel", "candle", "gelt"],
  newyear: ["burst", "confetti", "star", "burst", "confetti"],
  stpatricks: ["shamrock", "rainbow", "shamrock", "shamrock", "shamrock"],
  july4: ["flag", "burst", "star", "burst", "star"],
  halloween: ["pumpkin", "bat", "moon", "bat", "bat"],
  oktoberfest: ["pretzel", "stein", "bunting", "pretzel", "stein"],
};

/** The five slots for one or two themes: two themes take turns, the nearer one first. */
export function scatterFor(themes: readonly ThemeId[]): ItemName[] {
  const [a, b] = themes;
  if (!a) return [];
  const first = SCATTER[a];
  if (!b) return [...first];
  const second = SCATTER[b];
  return first.map((name, i) => (i % 2 === 0 ? name : (second[i - 1] ?? name)));
}
