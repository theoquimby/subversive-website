// Game nights (spec §4.7): "Knicks at Pacers" → a slash split, NYK against a three-letter
// code. No logos or wordmarks (trademarks); the codes are plain letters.
import { nyParts } from "@/lib/time/ny";
import type { SiteEvent } from "./enrich";

export interface Matchup {
  venue: "at" | "vs";
  opponent: string;
  code: string;
  /** "Knicks at Pacers" · "Knicks vs. Blazers" */
  label: string;
}

export const TEAM_CODES: Readonly<Record<string, string>> = {
  hawks: "ATL",
  celtics: "BOS",
  nets: "BKN",
  hornets: "CHA",
  bulls: "CHI",
  cavaliers: "CLE",
  cavs: "CLE",
  mavericks: "DAL",
  mavs: "DAL",
  nuggets: "DEN",
  pistons: "DET",
  warriors: "GSW",
  rockets: "HOU",
  pacers: "IND",
  clippers: "LAC",
  lakers: "LAL",
  grizzlies: "MEM",
  heat: "MIA",
  bucks: "MIL",
  timberwolves: "MIN",
  wolves: "MIN",
  pelicans: "NOP",
  pels: "NOP",
  thunder: "OKC",
  magic: "ORL",
  "76ers": "PHI",
  sixers: "PHI",
  suns: "PHX",
  "trail blazers": "POR",
  blazers: "POR",
  kings: "SAC",
  spurs: "SAS",
  raptors: "TOR",
  jazz: "UTA",
  wizards: "WAS",
};

export function teamCode(opponent: string): string {
  const o = opponent.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  const hit = Object.keys(TEAM_CODES)
    .sort((a, b) => b.length - a.length)
    .find((k) => new RegExp(`(^|\\s)${k}(\\s|$)`).test(o));
  if (hit) return TEAM_CODES[hit] as string;
  return opponent
    .replace(/[^a-z]/gi, "")
    .slice(0, 3)
    .toUpperCase();
}

const GAME = /Knicks\s+(at|vs\.?)\s+(.+?)\s*$/i;

export function parseMatchup(title: string): Matchup | null {
  const m = GAME.exec(title);
  if (!m) return null;
  const venue = m[1]?.toLowerCase().startsWith("vs") ? "vs" : "at";
  const opponent = (m[2] ?? "").trim();
  if (!opponent) return null;
  return {
    venue,
    opponent,
    code: teamCode(opponent),
    label: `Knicks ${venue === "at" ? "at" : "vs."} ${opponent}`,
  };
}

export type GamePhase = "before" | "live" | "final";

const ms = (iso: string | null) => (iso ? new Date(iso).getTime() : null);

export function gamePhase(e: SiteEvent, at: Date): GamePhase {
  const start = ms(e.startsAt);
  if (start === null || at.getTime() < start) return "before";
  const end = ms(e.endsAt) ?? start + 3 * 3600_000;
  return at.getTime() < end ? "live" : "final";
}

export function countdownLabel(e: SiteEvent, at: Date): string {
  const phase = gamePhase(e, at);
  if (phase === "live") return "On now";
  if (phase === "final") return "Final";
  const start = ms(e.startsAt);
  if (start === null) return "";
  const mins = Math.max(0, Math.ceil((start - at.getTime()) / 60_000));
  const h = Math.floor(mins / 60);
  // more than a day out, a countdown is noise: the date is right there
  if (h >= 24) return "";
  return h > 0 ? `Tip in ${h}h ${mins % 60}m` : `Tip in ${mins}m`;
}

function spokenTime(iso: string): string {
  const { minutes } = nyParts(new Date(iso));
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h24 < 12 ? "AM" : "PM"}`;
}

/** What a screen reader hears for the split block: "Knicks at Pacers, tipoff 7 PM". */
export function matchupSpeech(e: SiteEvent): string {
  const label = e.matchup?.label ?? e.displayTitle;
  return e.startsAt ? `${label}, tipoff ${spokenTime(e.startsAt)}` : label;
}
