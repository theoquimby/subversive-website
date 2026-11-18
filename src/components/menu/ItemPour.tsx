"use client";

// The pour in the item view (Theo, 2026-11-18: "the tap doesn't really make sense... should
// feel like a real invisible hand is lifting and pouring and popping the can open").
// The glass is Home's simulated glass with no tap; the can is the beer's own (Max's label,
// or the house can). For each beer, as a hand would do it:
//   pop    a thumb presses, the tab cracks and the can jumps a little; a hiss
//   lift   up and across in an arc, starting to lean as it goes
//   pour   the mouth at the glass; the lean deepens as the can empties; if the head comes
//          up to the rim the can eases back, waits, tops it up
//   after  held still a moment as the last runs out, then one unbroken move upright,
//          clear of the glass and down, landing with a small bounce
// Smoothness (Theo: "lots of jitter and stutters"): every move starts from where the can
// really is, so none jumps; while it is carried the can is one composited layer, and its
// label is a picture drawn once (Can.tsx); and there is no wobble or shake added for effect.
// The glass's model says where the pour is (onPhase); the can follows it. The pour runs at
// a can's pace, slower than the bar tap. Stepping to another beer does it all again.
// With reduced motion nothing moves: the glass is simply full and the can stands beside it.
// Safety: if the glass has not started a second after it was asked, it is asked again, and
// the can never stays in the air for more than a quarter of a minute.
import { labels } from "@content/labels";
import { useCallback, useEffect, useRef, useState } from "react";
import { Can } from "../beer/Can";
import { LabelGlass } from "../home/LabelGlass";

interface Pose {
  x: number;
  y: number;
  r: number;
}
const at = (p: Pose) => `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) rotate(${p.r.toFixed(1)}deg)`;
// the tokens' curves (tokens.css), as values: the Web Animations API takes no custom properties
const SOFT = "cubic-bezier(0.45, 0, 0.2, 1)";
const OUT = "cubic-bezier(0.2, 0.8, 0.2, 1)";
/** the lean when the pour begins, and when the can is nearly empty */
const LEAN = [-72, -104] as const;
const PACE = 0.3;

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
  const [aloft, setAloft] = useState(false);
  // once popped, a can stays open
  const [opened, setOpened] = useState(false);
  const first = useRef(true);
  const heard = useRef<(phase: string) => void>(() => {});

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new beer (id) is a new pour
  useEffect(() => {
    const el = box.current;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wasFirst = first.current;
    first.current = false;
    const glass = el?.querySelector<HTMLElement>(".item-glass");
    const can = el?.querySelector<HTMLElement>(".item-pour__can");
    const hand = el?.querySelector<HTMLElement>(".item-pour__hand");
    if (!el || !glass || !can || !hand || calm || typeof can.animate !== "function") {
      // the next beer is simply there (the glass recolours itself; the first is drawn full)
      if (!wasFirst) setPour((n) => n + 1);
      return;
    }

    // Where the stream begins in the glass's drawing (x 100, y -34 of "22 -92 156 414"),
    // and where the can's mouth is while it stands: the near edge of its rim, which is
    // also the point the can turns about (transform-origin, fx-can.css).
    const spout = {
      x: glass.offsetLeft + (78 / 156) * glass.offsetWidth - (can.offsetLeft + 0.13 * can.offsetWidth) + 2,
      y: glass.offsetTop + (58 / 414) * glass.offsetHeight - (can.offsetTop + 0.045 * can.offsetHeight) - 3,
    };

    let live = true;
    let now: Pose = { x: 0, y: 0, r: 0 };
    let run: Animation | undefined;
    let stage: "up" | "pouring" | "eased" | "after" = "up";
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((done) => {
        timers.push(window.setTimeout(done, ms));
      });
    /** where the can is this instant, read off the element: every move starts from there,
     *  so a move cut short by the next one never jumps */
    const settle = () => {
      const m = new DOMMatrixReadOnly(getComputedStyle(can).transform);
      now = { x: m.e, y: m.f, r: (Math.atan2(m.b, m.a) * 180) / Math.PI };
    };
    const move = (to: Pose, ms: number, easing = SOFT, via: Pose[] = []) => {
      settle();
      const frames = [now, ...via, to].map((p) => ({ transform: at(p) }));
      run?.cancel();
      run = can.animate(frames, { duration: ms, easing, fill: "forwards" });
      now = to;
      return run.finished.then(
        () => live,
        () => false,
      );
    };
    /** the long lean of the pour: one slow curve, quick at first and easing as it empties */
    const lean = (deg: number, ms: number) =>
      void move({ ...spout, r: deg }, ms, "cubic-bezier(0.25, 0.4, 0.4, 1)");

    const after = async () => {
      if (stage === "after") return;
      stage = "after";
      // The last of it runs out while the can holds still; then one unbroken move takes it
      // upright, clear of the glass and down. (It was three moves with waits between: Theo,
      // 2026-11-18, "it pauses like 3 times on the way down".)
      await wait(650);
      if (!live) return;
      const down = await move({ x: 0, y: 0, r: 0 }, 1500, SOFT, [
        { x: spout.x * 0.78, y: spout.y - 8, r: -44 },
        { x: spout.x * 0.3, y: spout.y * 0.62, r: -8 },
      ]);
      if (!down) return;
      hand.animate(
        [
          { transform: "translateY(0)" },
          { transform: "translateY(-5px)" },
          { transform: "translateY(0)" },
          { transform: "translateY(-1.5px)" },
          { transform: "translateY(0)" },
        ],
        { duration: 420, easing: OUT },
      );
      run?.cancel();
      run = undefined;
      setAloft(false);
    };

    let answered = false; // the glass has started on this pour
    heard.current = (phase) => {
      if (stage === "pouring" || stage === "eased") answered = true;
      if (!live || stage === "up" || stage === "after") return;
      if (phase === "fill" || phase === "topup") {
        // the pour: the lean deepens as the can empties
        stage = "pouring";
        lean(LEAN[1], phase === "topup" ? 2200 : 5200);
      } else if (phase === "rest") {
        // head at the rim: ease back and let it drop
        stage = "eased";
        void move({ ...spout, r: -56 }, 600);
      } else if (phase === "settle" || phase === "idle") void after();
    };

    (async () => {
      // the pop: a press, the crack, a little jump
      setAloft(true);
      timers.push(window.setTimeout(() => live && setOpened(true), 250));
      const popped = await move({ x: 0, y: 0, r: 0 }, 520, OUT, [
        { x: 0, y: 1.5, r: 0 },
        { x: 0, y: -5, r: -2 },
      ]);
      if (!popped) return;
      await wait(220);
      if (!live) return;
      // the lift: up first, then across, leaning as it nears the glass
      const there = await move({ ...spout, r: LEAN[0] }, 1200, SOFT, [
        { x: spout.x * 0.4, y: spout.y * 0.9 - 10, r: -20 },
      ]);
      if (!there) return;
      stage = "pouring";
      setPour((n) => n + 1);
      // the glass should answer at once; if it has not, ask again, and never hang in the air
      let asked = 1;
      const check = window.setInterval(() => {
        if (!live || answered) {
          window.clearInterval(check);
          return;
        }
        if (asked++ < 3) setPour((n) => n + 1);
        else void after();
      }, 1200);
      timers.push(check);
      timers.push(
        window.setTimeout(() => {
          if (live) void after();
        }, 15000),
      );
    })();

    return () => {
      live = false;
      heard.current = () => {};
      for (const t of timers) {
        window.clearTimeout(t);
        window.clearInterval(t);
      }
      run?.cancel();
    };
  }, [id]);

  const onPhase = useCallback((phase: string) => heard.current(phase), []);

  return (
    <div ref={box} className="item-pour" data-aloft={aloft ? "" : undefined}>
      <div className="item-glass" aria-hidden="true">
        <LabelGlass
          beer={{ id, color, hazy }}
          pour={pour}
          className="glass"
          bare
          tap={false}
          hold
          pace={PACE}
          onPhase={onPhase}
        />
      </div>
      <span className="item-pour__can">
        <span className="item-pour__hand">
          <Can key={id} label={labels[id]} name={name} color={color} open={opened} alive={!aloft} />
        </span>
      </span>
    </div>
  );
}
