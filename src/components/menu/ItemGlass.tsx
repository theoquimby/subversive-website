"use client";

// The glass in the item view: Home's simulated glass, without its landscape. It arrives
// empty under the tap and pours the beer whose sheet was opened; stepping to another beer
// with the arrow keys drains it and pours the next. The model is LabelGlass's own (it
// writes to the SVG itself, stops at rest and sleeps off screen; with reduced motion the
// glass is simply full). The box has a fixed size, so nothing moves when it appears.
import { useState } from "react";
import { LabelGlass } from "../home/LabelGlass";

export function ItemGlass({ id, color, hazy }: { id: string; color: string; hazy: boolean }) {
  // a new beer in the same sheet is a new pour
  const [seen, setSeen] = useState({ id, pour: 0 });
  if (seen.id !== id) setSeen({ id, pour: seen.pour + 1 });

  return (
    <div className="item-glass" aria-hidden="true">
      <LabelGlass beer={{ id, color, hazy }} pour={seen.pour} className="glass" bare />
    </div>
  );
}
