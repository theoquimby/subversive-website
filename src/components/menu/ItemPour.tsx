"use client";

// The pour in the item view (Theo, 2026-11-18: "the tap doesn't really make sense... should
// feel like a real invisible hand is lifting and pouring and popping the can open").
// The glass is Home's simulated glass with no tap; the can is the beer's own (Max's label,
// or the house can). For each beer, as a hand would do it:
//   pop    a thumb presses, the tab cracks and the can jumps a little; a hiss
//   lift   up and across in an arc, starting to lean as it goes
//   pour   the mouth at the glass; the lean deepens as the can empties, the hand not quite
//          steady; if the head comes up to the rim the can eases back, waits, tops it up
//   after  eased back with a last shake of drops, drawn clear of the glass and held
//          upright for a moment, then set down with a small bounce
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
const IN = "cubic-bezier(0.6, 0, 0.9, 0.4)";
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
    let slow: { from: Pose; to: Pose } | undefined; // the long lean of the pour, linear
    let stage: "up" | "pouring" | "eased" | "after" = "up";
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((done) => {
        timers.push(window.setTimeout(done, ms));
      });
    /** where the can is this instant, if it was on the long lean */
    const settle = () => {
      if (slow && run) {
        const p = Number(run.effect?.getComputedTiming().progress ?? 1);
        now = { x: slow.to.x, y: slow.to.y, r: slow.from.r + (slow.to.r - slow.from.r) * p };
      }
      slow = undefined;
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
    const lean = (deg: number, ms: number) => {
      settle();
      const from = now;
      const to = { ...spout, r: deg };
      run?.cancel();
      run = can.animate([{ transform: at(from) }, { transform: at(to) }], {
        duration: ms,
        easing: "linear",
        fill: "forwards",
      });
      slow = { from, to };
      now = to;
    };

    const after = async () => {
      if (stage === "after") return;
      stage = "after";
      // eased back, a last shake of drops, then upright over the glass
      if (!(await move({ ...spout, y: spout.y - 3, r: -46 }, 420))) return;
      if (!(await move({ ...spout, y: spout.y - 1, r: -58 }, 130, IN))) return;
      if (!(await move({ ...spout, y: spout.y - 4, r: -40 }, 170, OUT))) return;
      // drawn back clear of the glass, upright, and held there a moment
      if (!(await move({ x: spout.x * 0.3, y: spout.y * 0.62, r: -6 }, 640))) return;
      await wait(1000);
      if (!live) return;
      // set down
      if (!(await move({ x: 0, y: 0, r: 0 }, 760, SOFT, [{ x: spout.x * 0.08, y: spout.y * 0.3, r: 3 }])))
        return;
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
        lean(LEAN[1], phase === "topup" ? 2600 : 5200);
      } else if (phase === "rest") {
        // head at the rim: ease back and let it drop
        stage = "eased";
        void move({ ...spout, r: -52 }, 380);
      } else if (phase === "settle" || phase === "idle") void after();
    };

    (async () => {
      // the pop: a press, the crack, a little jump
      setAloft(true);
      timers.push(window.setTimeout(() => live && setOpened(true), 250));
      const popped = await move({ x: 0, y: 0, r: 0 }, 560, OUT, [
        { x: 0, y: 2.5, r: 0 },
        { x: -1, y: -8, r: -4 },
        { x: 0.5, y: 1, r: 1.5 },
      ]);
      if (!popped) return;
      await wait(220);
      if (!live) return;
      // the lift: up first, then across, leaning as it nears the glass
      const there = await move({ ...spout, r: LEAN[0] }, 1050, SOFT, [
        { x: spout.x * 0.12, y: spout.y * 0.75 - 14, r: -9 },
        { x: spout.x * 0.75, y: spout.y - 8, r: -38 },
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
          <Can key={id} label={labels[id]} name={name} color={color} open={opened} alive />
        </span>
      </span>
    </div>
  );
}
