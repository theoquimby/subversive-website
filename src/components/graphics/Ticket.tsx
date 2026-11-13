// Ticket stub (spec §3.6): events are tickets. 16 px radius, the one 2 px stroke, a date
// stub on the left behind a dashed perforation with a half-circle notch top and bottom.
// The stub's colour says the kind (spec §6.3). Hover or press: the stub starts to tear
// (1.5° around the perforation, 3 px). `torn`: it has torn off, once, and stays torn.
import type { ReactNode } from "react";
import { zigzagEdge } from "./ticket-geometry";

export type TicketKind = "music" | "trivia" | "festival" | "game" | "other";

const TORN_EDGE = zigzagEdge({ teeth: 9, depth: 6 });

export function Ticket({
  kind = "other",
  stub,
  children,
  href,
  torn = false,
  className,
}: {
  kind?: TicketKind;
  stub: ReactNode;
  children: ReactNode;
  href?: string;
  torn?: boolean;
  className?: string;
}) {
  const Tag = href ? "a" : "div";
  return (
    <Tag
      href={href}
      className={["ticket", className ?? ""].filter(Boolean).join(" ")}
      data-kind={kind}
      data-torn={torn ? "" : undefined}
      style={torn ? ({ "--torn-edge": TORN_EDGE } as React.CSSProperties) : undefined}
    >
      <span className="ticket__stub">{stub}</span>
      <span className="ticket__body">{children}</span>
    </Tag>
  );
}
