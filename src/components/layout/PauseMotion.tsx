"use client";

import { useEffect, useState } from "react";

// Global "Pause motion" (spec §9.2): stops the looping motion (seal, ticker) everywhere and
// remembers the choice. Sets data-motion="paused" on <html>; CSS does the rest.
const KEY = "sv.motion";

export function PauseMotion() {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(KEY);
    } catch {
      // storage blocked: default to playing
    }
    if (stored === "paused") setPaused(true);
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-motion", paused);
    if (paused) document.documentElement.setAttribute("data-motion", "paused");
  }, [paused]);

  return (
    <button
      type="button"
      className="pause-motion"
      aria-pressed={paused}
      onClick={() => {
        const next = !paused;
        setPaused(next);
        try {
          window.localStorage.setItem(KEY, next ? "paused" : "playing");
        } catch {
          // nothing to persist to
        }
      }}
    >
      {paused ? "Play motion" : "Pause motion"}
    </button>
  );
}
