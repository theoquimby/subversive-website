// Page transition (spec §5.5, revised 11/13 after Theo: "looks like the whole page is
// bugging out"). React captures each page's content as its own layer and leaves the shell
// out, so a clip that only cut the content let the old page's words show over the new
// page's. Now the content sits in an opaque frame, and the change is two calm moves: the
// old page lifts and fades quickly (160 ms), then the new one settles in from 14 px below
// (320 ms). Leaving fast and arriving gently is what reads as expensive. The slash lives
// on in the mobile menu's sheet, which a link tap still cuts away (globals.css).
import { type ReactNode, ViewTransition } from "react";

export function PageWipe({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div className="page-frame">{children}</div>
    </ViewTransition>
  );
}
