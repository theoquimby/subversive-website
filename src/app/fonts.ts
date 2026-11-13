// Three families, six files, self-hosted at build (spec §2.3, §9.1; plan Q8: latin only,
// which already covers "Märzen" and "¡"). Only the above-the-fold faces preload.
import { Barlow, Barlow_Condensed, Caprasimo } from "next/font/google";

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

export const fontVariables = `${display.variable} ${utility.variable} ${text.variable}`;
