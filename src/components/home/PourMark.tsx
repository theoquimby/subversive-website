"use client";

// Records that this session has seen the hero pour, so it plays once (spec §5.3).
import { useEffect } from "react";

export function PourMark() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem("sv.poured", "1");
      } catch {
        // private mode: the pour may play again; harmless
      }
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}
