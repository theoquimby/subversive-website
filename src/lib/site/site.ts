// The one way pages read content/site.json: parsed once, and the build fails if it is invalid.
import raw from "@content/site.json";
import { parseSite, type Site } from "./schema";

let cached: Site | null = null;

export function getSite(): Site {
  cached ??= parseSite(raw);
  return cached;
}

/** Navigation, in order (spec §4.1). Labels are interface labels, not copy. */
export const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/events", label: "Events" },
  { href: "/visit", label: "Visit" },
  { href: "/beer", label: "Our beer" },
] as const;
