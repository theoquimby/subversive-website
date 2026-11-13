// Event ticket (spec §4.6, §3.6): the date stub coloured by category, the title, one line
// of detail, the kind (or the mini matchup for games). The whole card is one link to the
// event page. Today's tickets wear a pils "Tonight" burst. (No shared view-transition
// name: named tickets faded over the page change as separate layers.)
import { eventLabels, microcopy } from "@content/microcopy";
import type { SiteEvent } from "@/lib/events/enrich";
import { formatClock, weekdayLabel } from "@/lib/hours/format";
import { type IsoDate, weekdayOf } from "@/lib/time/ny";
import { Sticker } from "../graphics/Sticker";
import { Ticket, type TicketKind } from "../graphics/Ticket";
import { Link } from "../ui/Link";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const TICKET_KIND: Record<SiteEvent["category"], TicketKind> = {
  games: "game",
  music: "music",
  "trivia-movies": "trivia",
  festivals: "festival",
  other: "other",
  notice: "other",
};

export function dateParts(date: IsoDate) {
  const [, m, d] = date.split("-");
  const month = Number(m) - 1;
  return {
    weekday: weekdayLabel(weekdayOf(date), "short"),
    weekdayLong: weekdayLabel(weekdayOf(date), "long"),
    day: String(Number(d)),
    month: MONTHS[month] ?? "",
    monthLong: MONTHS_LONG[month] ?? "",
  };
}

/** "7:00 tip" for games; "6:30–8:30" for the rest; "" when the feed gives no time. */
export function detailLine(e: SiteEvent): string {
  if (!e.startTime) return "";
  if (e.kind === "GAME") return eventLabels.tip(formatClock(e.startTime));
  return e.endTime ? `${formatClock(e.startTime)}–${formatClock(e.endTime)}` : formatClock(e.startTime);
}

export function DateStub({ date }: { date: IsoDate }) {
  const p = dateParts(date);
  return (
    <>
      <span className="ticket-date__label" aria-hidden="true">
        {p.weekday}
      </span>
      <span className="ticket-date__day" aria-hidden="true">
        {p.day}
      </span>
      <span className="ticket-date__label" aria-hidden="true">
        {p.month}
      </span>
      <span className="sr-only">
        {p.weekdayLong}, {p.monthLong} {p.day}
      </span>
    </>
  );
}

export function EventTicket({
  event: e,
  tonight = false,
  series,
  size = "list",
}: {
  event: SiteEvent;
  tonight?: boolean;
  series?: string | null;
  size?: "list" | "pinned";
}) {
  const detail = detailLine(e);
  return (
    <div className="event-ticket" data-size={size}>
      <Link href={`/events/${e.slug}`} className="event-ticket__link">
        <Ticket kind={TICKET_KIND[e.category]} stub={<DateStub date={e.date} />}>
          <span className="event-ticket__kind">
            {e.matchup ? (
              <span className="mini-matchup">
                <span>NYK</span>
                <span className="mini-matchup__venue">{e.matchup.venue === "at" ? "at" : "vs"}</span>
                <span>{e.matchup.code}</span>
              </span>
            ) : (
              eventLabels.categories[e.category === "notice" ? "other" : e.category]
            )}
          </span>
          <span className="event-ticket__title">{e.displayTitle}</span>
          {detail ? <span className="event-ticket__detail tabular">{detail}</span> : null}
          {series ? <span className="event-ticket__series">{series}</span> : null}
        </Ticket>
      </Link>
      {tonight ? (
        <Sticker
          shape="burst"
          color="pils"
          rotate="b"
          label={microcopy.tonight}
          className="event-ticket__tonight"
        >
          {microcopy.tonight}
        </Sticker>
      ) : null}
    </div>
  );
}
