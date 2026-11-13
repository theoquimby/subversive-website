// Section pill (spec §3.4): the only header style for sections, exactly as on the menu —
// a fat ink pill with paper Caprasimo, left on the grid. Inverts on Overtime through the
// skin tokens. Stamps in once when it enters the viewport (StampIn sets data-stamp).
import type { ReactNode } from "react";

type Level = "h1" | "h2" | "h3";

export function Pill({
  as: Tag = "h2",
  id,
  children,
  stamp = true,
}: {
  as?: Level;
  id?: string;
  children: ReactNode;
  stamp?: boolean;
}) {
  return (
    <Tag id={id} className="pill" data-stamp={stamp ? "" : undefined}>
      <span className="pill__text">{children}</span>
    </Tag>
  );
}
