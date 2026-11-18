import { existsSync, readFileSync } from "node:fs";
import { labels } from "@content/labels";
import { describe, expect, it } from "vitest";

// Labels cut in layers so parts of them can move (scripts/label_motion.py, Can.tsx): the
// files are there, every layer's picture is a cell of its own on the sheet, every kind of
// part has its motion in fx-can.css, and the old way (motion inside the label's file,
// which redrew all of it on every step) has not come back.

const file = (src: string) => `public${src}`;
const css = readFileSync("src/styles/fx-can.css", "utf8");
const cutUp = Object.entries(labels).filter(([, l]) => l.parts);

describe("labels in layers", () => {
  it("are the three with moving parts", () => {
    expect(cutUp.map(([id]) => id).sort()).toEqual(["camp-comet", "cheap-dills", "chinga-la-migra"]);
  });

  it.each(cutUp)("%s: its files exist and its layers fit the label and the sheet", (_, label) => {
    const cut = label.parts;
    if (!cut) throw new Error("no parts");
    expect(existsSync(file(label.src))).toBe(true);
    expect(existsSync(file(cut.base))).toBe(true);
    expect(existsSync(file(cut.sheet))).toBe(true);
    for (const p of cut.list) {
      const [x, y, w, h] = p.box;
      expect(w > 0 && h > 0).toBe(true);
      expect(x >= 0 && y >= 0 && x + w <= Math.ceil(cut.view[0]) && y + h <= Math.ceil(cut.view[1])).toBe(
        true,
      );
      expect(p.at[0] + w <= cut.size[0] && p.at[1] + h <= cut.size[1]).toBe(true);
    }
    // no cell of the sheet lies on another: a layer's picture is its own
    for (const [i, a] of cut.list.entries())
      for (const b of cut.list.slice(i + 1)) {
        const apart =
          a.at[0] + a.box[2] <= b.at[0] ||
          b.at[0] + b.box[2] <= a.at[0] ||
          a.at[1] + a.box[3] <= b.at[1] ||
          b.at[1] + b.box[3] <= a.at[1];
        expect(apart).toBe(true);
      }
  });

  it("every kind of part has its motion, and a part that turns has a point to turn about", () => {
    for (const [, label] of cutUp)
      for (const p of label.parts?.list ?? []) {
        if (p.kind === "still") continue;
        expect(css).toContain(`.can__part--${p.kind} {`);
        if (p.kind !== "star") expect(p.origin).toBeDefined();
      }
  });

  it("no label file moves by itself", () => {
    for (const [id, label] of Object.entries(labels)) {
      expect(existsSync(`public/brand/labels/${id}.live.svg`)).toBe(false);
      for (const src of [label.src, label.parts?.base, label.parts?.sheet])
        if (src) expect(readFileSync(file(src), "utf8")).not.toMatch(/<style|animation|<animate/);
    }
  });
});
