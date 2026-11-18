// A can that opens its beer's view (Our beer's library). The list row beside it is the
// link to that view, with its name, for the keyboard and for assistive tech; the can is a
// second way in for a pointer or a finger only, so it is not a link itself: ItemSheet
// opens the view for a tap on anything that carries data-item.
import type { ReactNode } from "react";

export function CanLink({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span data-item={id} className="can-link" aria-hidden="true">
      {children}
    </span>
  );
}
