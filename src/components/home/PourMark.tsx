"use client";

// The hero pour plays once per session (spec §5.3). The pre-paint script in the hero only
// runs on a full page load; arriving at Home by an in-site link, this checks the session
// flag before paint instead. Either way, once the pour has played the session is marked.
import { useEffect, useLayoutEffect } from "react";

const KEY = "sv.poured";

export function PourMark() {
  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) document.documentElement.dataset.poured = "";
    } catch {
      // private mode: the pour may play again; harmless
    }
  }, []);
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        // private mode
      }
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
