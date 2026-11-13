// Matchup block (spec §4.7): a split along the slash, ember with NYK, court blue with the
// opponent's code, AT or VS in a round stamp on the seam. No logos or wordmarks. One image
// to assistive tech: "Knicks at Pacers, tipoff 7 PM".
import type { SiteEvent } from "@/lib/events/enrich";
import { matchupSpeech } from "@/lib/events/matchup";

export function Matchup({ event: e, size = "hero" }: { event: SiteEvent; size?: "hero" | "pinned" }) {
  if (!e.matchup) return null;
  return (
    <div className="matchup" data-size={size} role="img" aria-label={matchupSpeech(e)}>
      <span className="matchup__side matchup__side--home">NYK</span>
      <span className="matchup__side matchup__side--away">{e.matchup.code}</span>
      <span className="matchup__stamp">{e.matchup.venue === "at" ? "AT" : "VS"}</span>
    </div>
  );
}
