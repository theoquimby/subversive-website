// The themes for this moment, chosen on the server from New York's date, so they are in
// the HTML with no flash. Pages revalidate hourly, so a theme turns on or off within an
// hour of midnight.
//
// Held back (Theo, 2026-11-16: the logo touch "looks like a mistake", the drawings are
// "poorly placed"): nothing shows by date until the redesign lands. SEASON=<theme> still
// forces one for previews.
import { now } from "@/lib/time/now";
import { nyParts } from "@/lib/time/ny";
import { seasonFor, type ThemeId } from "./holidays";

const BY_DATE = false;

export function currentSeason(): ThemeId[] {
  const SEASON = process.env.SEASON;
  if (!BY_DATE && !SEASON) return [];
  return seasonFor(nyParts(now()).date, { SEASON, SV_E2E: process.env.SV_E2E });
}
