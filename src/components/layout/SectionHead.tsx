// A section's heading on the ink line (redesign 2026-11-14): the title in the display
// serif, then the line running on to the right edge, with an optional small note at its
// end. Used on Home, Visit and Events. The Menu keeps the printed menu's black pills.
import type { ReactNode } from "react";

export function SectionHead({
  id,
  children,
  note,
  as: Tag = "h2",
}: {
  id?: string;
  children: ReactNode;
  /** a short label at the line's far end, e.g. "9 oz / 16 oz" */
  note?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className="sec-head">
      <Tag id={id} className="sec-head__title">
        {children}
      </Tag>
      <span className="sec-head__rule" aria-hidden="true" />
      {note ? <span className="sec-head__note">{note}</span> : null}
    </div>
  );
}
