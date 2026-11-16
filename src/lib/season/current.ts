// The themes for this moment, chosen on the server from New York's date, so they are in
// the HTML with no flash. Pages revalidate hourly, so a theme turns on or off within an
// hour of midnight.
import { now } from "@/lib/time/now";
import { nyParts } from "@/lib/time/ny";
import { seasonFor, type ThemeId } from "./holidays";

export function currentSeason(): ThemeId[] {
  return seasonFor(nyParts(now()).date, { SEASON: process.env.SEASON, SV_E2E: process.env.SV_E2E });
}
