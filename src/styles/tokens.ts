// Design tokens as data (spec §2.1), mirrored value for value in tokens.css.
// tests/unit/tokens.sync.test.ts keeps the two identical; tokens.contrast.test.ts
// measures every allowed pair as rendered. Hex values live only here and in tokens.css.

export const raw = {
  paper: "#F5ECDC",
  paperDeep: "#EBDFC8",
  card: "#FFFDF8",
  ink: "#151412",
  pils: "#FFCE3A",
  ember: "#E3600C",
  emberDeep: "#AE4004",
  emberGlow: "#FF996A",
  sky: "#2F9BE0",
  skyDeep: "#17639B",
  spruce: "#1E3A2F",
  currant: "#6B2D5C",
  night: "#0F0E0C",
  nightRaised: "#191712",
  bone: "#EFE7D8",
  court: "#2361D6",
  go: "#2DB55D",
} as const;

export type RawToken = keyof typeof raw;

/** A semantic token is a raw colour, optionally at an opacity (as painted over its background). */
export interface SemanticValue {
  ref: RawToken;
  alpha?: number;
}

export type Skin = "paper" | "overtime";

export const semanticNames = [
  "bg",
  "surface",
  "fg",
  "fgMuted",
  "rule",
  "ruleStrong",
  "accent",
  "accentText",
  "highlight",
  "ctaBg",
  "ctaFg",
  "focus",
] as const;
export type SemanticToken = (typeof semanticNames)[number];

export const semantic: Record<Skin, Record<SemanticToken, SemanticValue>> = {
  paper: {
    bg: { ref: "paper" },
    surface: { ref: "card" },
    fg: { ref: "ink" },
    fgMuted: { ref: "ink", alpha: 0.78 },
    rule: { ref: "ink", alpha: 0.14 },
    ruleStrong: { ref: "ink" },
    accent: { ref: "ember" },
    accentText: { ref: "emberDeep" },
    highlight: { ref: "pils" },
    ctaBg: { ref: "pils" },
    ctaFg: { ref: "ink" },
    focus: { ref: "skyDeep" },
  },
  overtime: {
    bg: { ref: "night" },
    surface: { ref: "nightRaised" },
    fg: { ref: "bone" },
    fgMuted: { ref: "bone", alpha: 0.88 },
    rule: { ref: "bone", alpha: 0.14 },
    ruleStrong: { ref: "bone" },
    accent: { ref: "emberGlow" },
    accentText: { ref: "emberGlow" },
    highlight: { ref: "pils" },
    ctaBg: { ref: "emberGlow" },
    ctaFg: { ref: "night" },
    focus: { ref: "sky" },
  },
};

/** CSS custom property name for a token key: paperDeep → --paper-deep. */
export function cssVar(name: string): string {
  return `--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}

/**
 * Every value the contrast test forced away from the spec, old → new (spec §2.1:
 * "adjusted darker, not exempted"; plan Q5). Lightness moves in OKLCH with hue and
 * chroma held, in the smallest 0.0025 step that passes. Shown in /dev/kit for review.
 */
export const adjustments: readonly { token: string; from: string; to: string; why: string }[] = [
  {
    token: "--ember",
    from: "#EE6A1F",
    to: "#E3600C",
    why: "Display accent on paper was 2.67:1; needs 3:1. OKLCH L −0.030. Text on an ember fill is now card white (3.47:1, Lc −66); ink on ember is no longer an allowed pair.",
  },
  {
    token: "--ember-deep",
    from: "#B4460F",
    to: "#AE4004",
    why: "Small accent text on paper-deep was 4.16:1 / Lc 58; needs 4.5:1 / Lc 60. OKLCH L −0.0175.",
  },
  {
    token: "--ember-glow (new)",
    from: "ember on night",
    to: "#FF996A",
    why: "On Overtime, ember was Lc −44 as text and night-on-ember CTA text Lc 46; both need Lc 60. Darkening cannot help on night, so the Overtime accent is ember lifted in OKLCH (L +0.10, chroma clipped to gamut).",
  },
  {
    token: "--court",
    from: "#2C6BE0",
    to: "#2361D6",
    why: "Bone text on a court date block was 3.99:1; needs 4.5:1. OKLCH L −0.030. Court is a fill only; never text on night (Lc −28).",
  },
  {
    token: "--fg-muted (Paper)",
    from: "ink 70%",
    to: "ink 78%",
    why: "Muted text on paper-deep panels was Lc 69; body text needs Lc 75.",
  },
  {
    token: "--fg-muted (Overtime)",
    from: "bone 65%",
    to: "bone 88%",
    why: "Muted text on night was Lc −48; body text needs Lc 75.",
  },
  {
    token: "--focus (Paper)",
    from: "sky",
    to: "sky-deep",
    why: "Sky focus ring on paper was 2.60:1; a UI boundary needs 3:1. Overtime keeps sky (6.33:1).",
  },
];
