// Max's can labels (sent 2026-11-18), fronts only, as SVG in public/brand/labels. Built by
// scripts/extract-labels.py from his print PDFs, which stay out of the repo: their side
// panels carry the old name. Keyed by the menu item's id where the beer is on the menu.
// A label is shown only on a can (src/components/beer/Can.tsx): nine labels are nine
// styles, and the page itself stays in one hand. Left out: the Saison ("house-made malts"
// is set in its art; Max, 2026-11-18) and Heritage Grape (a raster scan).
// TODO(Max): labels for Puff Puff Pils, New York Nectar, Subversive Saison, Sudachi Saison.

import book from "../public/brand/labels/parts.json";

/** One layer of a label that is cut up so parts of it can move (scripts/label_motion.py):
 *  a part, or still art that lies over one. Lengths are in the label's own units. */
export interface LabelPart {
  /** which motion (fx-can.css), or none */
  kind: "still" | "pickle" | "shadow" | "wing" | "star" | "tail";
  /** where it sits on the label: x, y, width, height */
  box: readonly [number, number, number, number];
  /** where its picture is on the sheet */
  at: readonly [number, number];
  /** the point it turns or scales about, on the label */
  origin?: readonly [number, number];
  /** seconds: its place in the beat, and the beat, where it is out of step with the rest */
  delay?: number;
  time?: number;
}

export interface Label {
  src: string;
  /** the same front in layers, where parts of it move: the label without them, one sheet
   *  with a picture of each, and where each goes, bottom first. Only a can that may move
   *  loads these (Can.tsx); laid over one another they are the picture in `src`. */
  parts?: {
    base: string;
    sheet: string;
    /** the label's size and the sheet's, in the label's units */
    view: readonly [number, number];
    size: readonly [number, number];
    list: readonly LabelPart[];
  };
  /** the front's proportions, width / height */
  ratio: number;
  /** the label's ground colour, for the rest of the can's wrap */
  bg: string;
  /** whether pen marks on that ground are light or dark */
  on: "light" | "dark";
}

// written by scripts/extract-label.py; JSON knows no tuples or unions, so it is told here
const BOOK = book as unknown as Readonly<
  Record<string, { view: [number, number]; sheet: [number, number]; parts: LabelPart[] }>
>;
const label = (id: string, w: number, h: number, bg: string, on: Label["on"] = "dark"): Label => {
  const cut = BOOK[id];
  return {
    src: `/brand/labels/${id}.svg`,
    ...(cut
      ? {
          parts: {
            base: `/brand/labels/${id}.base.svg`,
            sheet: `/brand/labels/${id}.parts.svg`,
            view: cut.view,
            size: cut.sheet,
            list: cut.parts,
          },
        }
      : {}),
    ratio: w / h,
    bg,
    on,
  };
};

/** Beers with a label that are not on the menu: the name and the style line as printed on
 *  the label's front, nothing more (no strength: the label and Max's photo disagree). */
export const offMenu: readonly { id: string; name: string; style: string }[] = [
  { id: "camp-comet", name: "Camp Comet", style: "IPA brewed with Comet hops" },
  { id: "golden-lime", name: "Golden Lime", style: "Lager with calamansi" },
];

export const labels: Readonly<Record<string, Label>> = {
  "cheap-dills": label("cheap-dills", 276.5, 297, "#fbefd5"),
  "chinga-la-migra": label("chinga-la-migra", 236.2, 280.8, "#ffffff"),
  festbier: label("festbier", 293.8, 311.4, "#f9f8e2"),
  "forbidden-fruit": label("forbidden-fruit", 332.6, 284, "#222524", "light"),
  "hoppy-american-lager": label("hoppy-american-lager", 305.3, 334.8, "#f9f8e2"),
  "mountain-marzen": label("mountain-marzen", 316.8, 360, "#ffffff"),
  "off-axis": label("off-axis", 290.9, 313.2, "#cbe4b7"),
  // not on the menu today (Max: "labels for what's currently on draft"; TODO(Max): is the
  // menu current?)
  "camp-comet": label("camp-comet", 288, 336.6, "#0e0e1a", "light"),
  "golden-lime": label("golden-lime", 322.6, 331.2, "#fdf1d3"),
};
