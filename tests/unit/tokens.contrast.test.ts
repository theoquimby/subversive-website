// Spec §2.1: every foreground/background pair the semantic layer allows, measured as
// rendered (opacity composited over its real background). WCAG ≥ 4.5 for text, ≥ 3 for
// display and UI boundaries; APCA Lc 75 body, 60 larger content and labels, 45 display.
// The pair list is explicit on purpose: a pair not listed here is not allowed in the UI.
import { describe, expect, it } from "vitest";
import { apcaLc, composite, wcagRatio } from "@/lib/color/contrast";
import { type RawToken, raw, type SemanticToken, type Skin, semantic } from "@/styles/tokens";

type Role = "body" | "label" | "display" | "boundary";
const FLOOR: Record<Role, { wcag: number; apca: number }> = {
  body: { wcag: 4.5, apca: 75 },
  label: { wcag: 4.5, apca: 60 },
  display: { wcag: 3, apca: 45 },
  boundary: { wcag: 3, apca: 0 },
};

type Ref = { semantic: SemanticToken } | { raw: RawToken };

function paint(skin: Skin, ref: Ref, under: string): string {
  if ("raw" in ref) return raw[ref.raw];
  const v = semantic[skin][ref.semantic];
  const base = raw[v.ref];
  return v.alpha === undefined ? base : composite(base, v.alpha, under);
}

interface Pair {
  name: string;
  skin: Skin;
  fg: Ref;
  bg: Ref;
  role: Role;
}

const s = (t: SemanticToken): Ref => ({ semantic: t });
const r = (t: RawToken): Ref => ({ raw: t });

const pairs: Pair[] = [];
const textBgs: Record<Skin, Ref[]> = {
  paper: [s("bg"), s("surface"), r("paperDeep")],
  overtime: [s("bg"), s("surface")],
};

for (const skin of ["paper", "overtime"] as const) {
  for (const bg of textBgs[skin]) {
    const label = "semantic" in bg ? bg.semantic : bg.raw;
    pairs.push(
      { name: `fg on ${label}`, skin, fg: s("fg"), bg, role: "body" },
      { name: `fg-muted on ${label}`, skin, fg: s("fgMuted"), bg, role: "body" },
      { name: `accent-text on ${label}`, skin, fg: s("accentText"), bg, role: "label" },
      { name: `rule-strong on ${label}`, skin, fg: s("ruleStrong"), bg, role: "boundary" },
      { name: `focus ring on ${label}`, skin, fg: s("focus"), bg, role: "boundary" },
    );
  }
  for (const bg of [s("bg"), s("surface")]) {
    const label = "semantic" in bg ? bg.semantic : "";
    pairs.push({ name: `accent (display) on ${label}`, skin, fg: s("accent"), bg, role: "display" });
  }
  pairs.push(
    { name: "CTA text on CTA fill", skin, fg: s("ctaFg"), bg: s("ctaBg"), role: "label" },
    // A CTA's edge against the page: on Paper it is the 2 px ink outline (pils on paper
    // is only 1.27:1, so pressable pils always carries the outline); on Overtime the fill.
    skin === "paper"
      ? { name: "CTA outline against page", skin, fg: s("ruleStrong"), bg: s("bg"), role: "boundary" }
      : { name: "CTA fill against page", skin, fg: s("ctaBg"), bg: s("bg"), role: "boundary" },
    { name: "pill text (inverted) on pill", skin, fg: s("bg"), bg: s("fg"), role: "display" },
    { name: "highlight label: ink on pils", skin, fg: r("ink"), bg: r("pils"), role: "label" },
  );
}

// Stickers (Caprasimo ≥ 24 px: display) and date blocks (numerals: display, labels: label).
pairs.push(
  { name: "sticker: ink on pils", skin: "paper", fg: r("ink"), bg: r("pils"), role: "label" },
  { name: "sticker: ink on sky", skin: "paper", fg: r("ink"), bg: r("sky"), role: "display" },
  { name: "sticker: card on ember", skin: "paper", fg: r("card"), bg: r("ember"), role: "display" },
  { name: "sticker: paper on currant", skin: "paper", fg: r("paper"), bg: r("currant"), role: "label" },
  { name: "sticker: paper on spruce", skin: "paper", fg: r("paper"), bg: r("spruce"), role: "label" },
  { name: "ledger: paper on spruce", skin: "paper", fg: r("paper"), bg: r("spruce"), role: "body" },
  // menu (M3): the under-21 tag, the micro-chips, the muted text in a pressed row
  { name: "under-21 tag: card on sky-deep", skin: "paper", fg: r("card"), bg: r("skyDeep"), role: "label" },
  { name: "menu tag: ink on paper-deep", skin: "paper", fg: r("ink"), bg: r("paperDeep"), role: "label" },
  { name: "date block Music: ink on pils", skin: "overtime", fg: r("ink"), bg: r("pils"), role: "label" },
  {
    name: "date block Trivia: ink on sky (numerals)",
    skin: "overtime",
    fg: r("ink"),
    bg: r("sky"),
    role: "display",
  },
  {
    name: "date block Festival: bone on currant",
    skin: "overtime",
    fg: r("bone"),
    bg: r("currant"),
    role: "label",
  },
  { name: "date block Game: bone on court", skin: "overtime", fg: r("bone"), bg: r("court"), role: "label" },
  {
    name: "date block Ember: card on ember (numerals)",
    skin: "overtime",
    fg: r("card"),
    bg: r("ember"),
    role: "display",
  },
  {
    name: "Overtime glow on night (display)",
    skin: "overtime",
    fg: r("emberGlow"),
    bg: r("night"),
    role: "display",
  },
);

describe("token contrast, measured as rendered", () => {
  it.each(pairs)("$skin · $name ($role)", ({ skin, fg, bg, role }) => {
    const bgHex = paint(skin, bg, raw.paper);
    const fgHex = paint(skin, fg, bgHex);
    const floor = FLOOR[role];
    const ratio = wcagRatio(fgHex, bgHex);
    const lc = Math.abs(apcaLc(fgHex, bgHex));
    expect(ratio, `WCAG ${ratio.toFixed(2)} for ${fgHex} on ${bgHex}`).toBeGreaterThanOrEqual(floor.wcag);
    expect(lc, `APCA Lc ${lc.toFixed(1)} for ${fgHex} on ${bgHex}`).toBeGreaterThanOrEqual(floor.apca);
  });

  it("covers both skins and every role", () => {
    expect(new Set(pairs.map((p) => p.skin)).size).toBe(2);
    expect(new Set(pairs.map((p) => p.role)).size).toBe(4);
  });
});

// Named exclusions (plan Q5, Q6). Each is a deliberate state, never body text.
// - go dot: always paired with "Open now" text; not a boundary on its own.
// - pils box: carries a 2 px ink outline; the pils band is decoration inside it.
// - rule (14%): hairline dividers between rows; meaning never depends on them.
// - filtered-out menu rows at 30%: a "not matching" state announced through aria-live.

describe("ticket stub label tab", () => {
  it("paper on ink passes the label floor", () => {
    expect(wcagRatio(raw.paper, raw.ink)).toBeGreaterThanOrEqual(4.5);
    expect(Math.abs(apcaLc(raw.paper, raw.ink))).toBeGreaterThanOrEqual(60);
  });
});
