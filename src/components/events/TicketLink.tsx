// One event as a ticket (redesign 2026-11-15): an ink outline, the date on a stub behind a
// perforation, the title and the time. A game night carries the Knicks' two colours as a
// thin band on its stub; nothing else about it is a sports page. Used on Home and on
// /events; styles in home.css (.tix).
import { microcopy, visitLabels } from "@content/microcopy";
import type { SiteEvent } from "@/lib/events/enrich";
import { formatClock, weekdayLabel } from "@/lib/hours/format";
import { weekdayOf } from "@/lib/time/ny";
import { Link } from "../ui/Link";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Two overlapping marker strokes with uneven ends: the Knicks' blue and orange. */
export function GameStrokes({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 12" fill="none" aria-hidden="true">
      <path className="game-strokes__a" d="M3 4.6C14 3.4 30 4.6 45 3.6" />
      <path className="game-strokes__b" d="M14 8.6C27 7.5 42 8.8 57 7.4" />
    </svg>
  );
}

export function TicketLink({
  event: e,
  tonight = false,
  lit = false,
}: {
  event: SiteEvent;
  tonight?: boolean;
  lit?: boolean;
}) {
  const [, m, d] = e.date.split("-");
  return (
    <Link
      href={`/events/${e.slug}`}
      className={`tix__t${tonight ? " tix__t--tonight" : ""}${lit || tonight ? " tix__t--lit" : ""}`}
      data-game={e.kind === "GAME" ? "" : undefined}
      data-ticket=""
    >
      <span className="tix__stub">
        <span className="tix__day tabular">{Number(d)}</span>
        <span className="tix__when">
          {tonight
            ? microcopy.tonight
            : `${weekdayLabel(weekdayOf(e.date), "short")} · ${MONTHS[Number(m) - 1]}`}
        </span>
        {e.kind === "GAME" ? <GameStrokes className="tix__game" /> : null}
      </span>
      <span className="tix__body">
        <span className="tix__title">{e.displayTitle}</span>
        {e.closed ? (
          <span className="tix__time">{visitLabels.closed}</span>
        ) : e.startTime ? (
          <span className="tix__time tabular">{formatClock(e.startTime)}</span>
        ) : null}
      </span>
    </Link>
  );
}
