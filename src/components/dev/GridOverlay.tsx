"use client";

import { useEffect, useState } from "react";
import "./grid-overlay.css";

// ?grid construction overlay (spec §3A review loop, item 3): the 4/8/12 columns inside the
// page gutter and content width, the 4 px baseline, and the three alignment edges
// (content left, the split line at column 7 of 12 / 3 of 4, content right).
// Rendered only when NEXT_PUBLIC_DEV_KIT=1, so production builds without it ship none of this.
export function GridOverlay() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const read = () => setOn(new URLSearchParams(window.location.search).has("grid"));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  if (!on) return null;
  return (
    <div className="grid-overlay" aria-hidden="true" data-grid-overlay="">
      <div className="grid-overlay__baseline" />
      <div className="grid-overlay__frame">
        {Array.from({ length: 12 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed, static column list
          <span key={i} className="grid-overlay__col" />
        ))}
        <span className="grid-overlay__edge grid-overlay__edge--left" />
        <span className="grid-overlay__edge grid-overlay__edge--split" />
        <span className="grid-overlay__edge grid-overlay__edge--right" />
      </div>
    </div>
  );
}
