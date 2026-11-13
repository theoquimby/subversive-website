// Three families, six files, self-hosted at build (spec §2.3, §9.1; plan Q8: latin only,
// which already covers "Märzen" and "¡"). Only the above-the-fold faces preload.
import { Barlow, Barlow_Condensed, Caprasimo, Josefin_Sans } from "next/font/google";

export const display = Caprasimo({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  fallback: ["Georgia", "serif"],
  variable: "--ff-display",
  preload: true,
});

export const utility = Barlow_Condensed({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  fallback: ["Arial Narrow", "sans-serif"],
  variable: "--ff-utility",
  preload: false,
});

export const text = Barlow({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  fallback: ["system-ui", "sans-serif"],
  variable: "--ff-text",
  preload: true,
});

// The label face (overhaul, 2026-11-13). Max's beer label sets names in a light geometric
// capital with pointed apexes and even, thin strokes. Josefin Sans is the closest free
// face and is a STAND-IN: TODO(Max) name the label's typeface; this one token swaps it.
// One variable file. This takes the site to seven font files against the spec's six;
// Barlow 500 is the one to retire in the rollout.
export const label = Josefin_Sans({
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  fallback: ["Century Gothic", "Futura", "sans-serif"],
  variable: "--ff-label",
  preload: true,
});

export const fontVariables = `${display.variable} ${utility.variable} ${text.variable} ${label.variable}`;
