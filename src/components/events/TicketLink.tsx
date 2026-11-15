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

export function TicketLink({ event: e, tonight = false }: { event: SiteEvent; tonight?: boolean }) {
  const [, m, d] = e.date.split("-");
  return (
    <Link
      href={`/events/${e.slug}`}
      className={tonight ? "tix__t tix__t--tonight" : "tix__t"}
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
