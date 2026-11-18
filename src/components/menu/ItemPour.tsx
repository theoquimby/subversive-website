"use client";

// The pour in the item view (Theo, 2026-11-18: "the tap doesn't really make sense": the
// can pops open, lifts and pours into the glass). The glass is Home's simulated glass with
// no tap; the can is the beer's own (Max's label, or the house can). For each beer: the
// tab lifts with a hiss, the can rises and tips until its mouth is where the stream
// begins, the glass's model pours (and tells us when it is done), and the can sets itself
// back down. Stepping to another beer drains the glass and does it again.
// With reduced motion nothing moves: the glass is simply full and the can stands beside it.
// The can can be spun whenever it is standing.
import { labels } from "@content/labels";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { Can } from "../beer/Can";
import { LabelGlass } from "../home/LabelGlass";

/** how far the can tips: a little past level, so the mouth is its lowest point */
const TIP = -98;
const POP_MS = 380;
const LIFT_MS = 640;

export function ItemPour({
  id,
  name,
  color,
  hazy,
}: {
  id: string;
  name: string;
  color: string;
  hazy: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pour, setPour] = useState(0);
  const [pose, setPose] = useState<"stand" | "open" | "tip">("stand");
  const [to, setTo] = useState({ x: 0, y: 0 });
  const first = useRef(true);
  // once popped, a can stays open
  const [opened, setOpened] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new beer (id) is a new pour
  useEffect(() => {
    const el = box.current;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wasFirst = first.current;
    first.current = false;
    if (!el || calm) {
      // the next beer is simply there (the glass recolours itself; the first is drawn full)
      if (!wasFirst) setPour((n) => n + 1);
      return;
    }
    // where the stream begins in the glass's drawing (x 100, y -34 of "22 -92 156 414"),
    // and where the can's mouth is while it stands: the lid's near edge
    const glass = el.querySelector<HTMLElement>(".item-glass");
    const can = el.querySelector<HTMLElement>(".item-pour__can");
    if (glass && can) {
      const sx = glass.offsetLeft + (78 / 156) * glass.offsetWidth;
      const sy = glass.offsetTop + (58 / 414) * glass.offsetHeight;
      const mx = can.offsetLeft + 0.17 * can.offsetWidth;
      const my = can.offsetTop + 0.07 * can.offsetHeight;
      setTo({ x: sx - mx + 3, y: sy - my - 3 });
    }
    setOpened(true);
    setPose("open");
    const lift = window.setTimeout(() => setPose("tip"), POP_MS);
    const go = window.setTimeout(() => setPour((n) => n + 1), POP_MS + LIFT_MS);
    return () => {
      window.clearTimeout(lift);
      window.clearTimeout(go);
    };
  }, [id]);

  // the glass says when the beer has stopped coming: the can goes back to stand
  const onPhase = useCallback((phase: string) => {
    if (phase === "settle" || phase === "idle") setPose("stand");
  }, []);

  const move: CSSProperties =
    pose === "tip"
      ? { transform: `translate(${to.x.toFixed(1)}px,${to.y.toFixed(1)}px) rotate(${TIP}deg)` }
      : {};

  return (
    <div ref={box} className="item-pour" data-pose={pose}>
      <div className="item-glass" aria-hidden="true">
        <LabelGlass
          beer={{ id, color, hazy }}
          pour={pour}
          className="glass"
          bare
          tap={false}
          hold
          onPhase={onPhase}
        />
      </div>
      <span className="item-pour__can" style={move}>
        <Can key={id} label={labels[id]} name={name} color={color} open={opened} alive />
      </span>
    </div>
  );
}
