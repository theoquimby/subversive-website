"use client";

import { type ReactNode, useId, useState } from "react";
import type { Skin } from "@/styles/tokens";

// Dev-kit skin switch. Real radio inputs (keyboard and screen-reader behaviour for free),
// visually hidden under an outlined pill with an ink thumb. M1 replaces it with Segmented.
const OPTIONS: { value: Skin; label: string }[] = [
  { value: "paper", label: "Paper" },
  { value: "overtime", label: "Overtime" },
];

export function SkinSwitch({ children }: { children: ReactNode }) {
  const [skin, setSkin] = useState<Skin>("paper");
  const name = useId();

  return (
    <div data-skin={skin} className="kit-root">
      <fieldset className="kit-switch">
        <legend className="sr-only">Skin</legend>
        {OPTIONS.map((o) => (
          <label key={o.value} className="kit-switch__option" data-checked={skin === o.value}>
            <input
              className="sr-only"
              type="radio"
              name={name}
              value={o.value}
              checked={skin === o.value}
              onChange={() => setSkin(o.value)}
            />
            {o.label}
          </label>
        ))}
        <span className="kit-switch__thumb" data-pos={skin} aria-hidden="true" />
      </fieldset>
      {children}
    </div>
  );
}
