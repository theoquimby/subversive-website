// Page transition (spec §5.5, plan §3): every page's content sits in one ViewTransition.
// Forward navigations wipe the old page away up and to the right along the 61° slash;
// untyped ones (browser back/forward) wipe the mirror way. The header has its own
// view-transition-name, so it holds still. Must live in each page, not a layout.
import { type ReactNode, ViewTransition } from "react";

export function PageWipe({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "wipe", default: "wipe-back" }}
      exit={{ "nav-forward": "wipe", default: "wipe-back" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
