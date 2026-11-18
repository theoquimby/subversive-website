"use client";

import { labels as canLabels } from "@content/labels";
// How their beer is made, as one living pen drawing, in two acts (reworked 2026-11-18).
// Malting: the grain through the steep, the germination floor and the kiln, moved by the
// shovel, ending as malt in its bin. Brewing, for whichever beer is chosen: the mill, the
// mash tun and its paddle, the run-off, the kettle on its burner, the conical fermenter,
// and the filler, where a keg and three cans ride a belt. A beer's own extra inputs and
// its cold rest come only from its menu style and description (brew-recipe.ts), and the
// liquid's colour follows what is in the vessel. It all stands in a quiet pen drawing of
// the brewhouse; the motion is a small physics model (brew-model.ts).
//
// The view is a camera: it shows the station at work, large, and glides on with the
// process (the model writes the drawing's viewBox each frame). Under it, a rail of the
// steps in their two acts marks the current one; a tap on a step, or on a station, plays
// from there. Both acts play once when the drawing first scrolls into view; after that,
// choosing a beer ("Now brewing ... Change", which opens the site's sheet) or "Brew
// another" runs the brewing only, from the malt. A tap on the paddle stirs; the phone's
// lean sloshes the vessels. One loop writes straight to the SVG; it sleeps off screen and
// at rest. Two drawings are sent, floors stacked for phones and one room from 64rem; CSS
// shows one. Without JavaScript, or with reduced motion, there is no camera: both are the
// still picture of the whole process, and choosing a beer still changes its colours and
// extra inputs.
import { brewLabels, menuLabels } from "@content/microcopy";
import { Dialog } from "radix-ui";
import { type CSSProperties, memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { createLoop } from "../../lib/motion/loop";
import { onTilt } from "../../lib/motion/tilt";
import { Sheet } from "../ui/Sheet";
import { type Layout, PHONE, type Stage, WIDE } from "./brew-layout";
import { createBrew, lean, moving, paint, relayout, setStage, step, stillBrew, stir } from "./brew-model";
import { type BrewBeer, defaultBeer, type Recipe, recipeOf } from "./brew-recipe";
import { type Prim, scene } from "./brew-scene";

type Attrs = Record<string, Record<string, string>>;
function collect(L: Layout): Attrs {
  const out: Attrs = {};
  paint(stillBrew(L), L, (k, a, v) => {
    const m = out[k] ?? {};
    m[a] = v;
    out[k] = m;
  });
  return out;
}
// the still picture, worked out once: the server's drawing and the first client render agree
const STILL: Record<Layout["id"], Attrs> = { phone: collect(PHONE), wide: collect(WIDE) };

const CAMEL: Record<string, string> = {
  "clip-path": "clipPath",
  "text-anchor": "textAnchor",
  dash: "strokeDasharray",
  doff: "strokeDashoffset",
};
/** a scene element's attributes, with what the still picture paints on it, as React props */
function props(p: Prim, P: Attrs): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  const style: CSSProperties = {};
  const all = { ...(p.a ?? {}), ...(p.k ? (P[p.k] ?? {}) : {}) };
  for (const [a, v] of Object.entries(all)) {
    if (a === "display") {
      if (v) style.display = String(v);
    } else if (a === "fill") style.fill = String(v);
    else if (a === "style") {
      const m = /^fill:(.*)$/.exec(String(v));
      if (m?.[1]) style.fill = m[1];
    } else r[CAMEL[a] ?? a] = v;
  }
  if (p.c) r.className = p.c;
  if (p.k) r["data-k"] = p.k;
  if (Object.keys(style).length > 0) r.style = style;
  return r;
}
function draw(p: Prim, P: Attrs, key: number): React.ReactNode {
  const kids = p.kids?.map((c, i) => draw(c, P, i));
  const r = props(p, P);
  switch (p.el) {
    case "g":
      return (
        <g key={key} {...r}>
          {kids}
        </g>
      );
    case "clipPath":
      return (
        <clipPath key={key} {...r}>
          {kids}
        </clipPath>
      );
    case "circle":
      return <circle key={key} {...r} />;
    case "image":
      return <image key={key} {...r} />;
    case "text":
      return (
        <text key={key} {...r}>
          {p.text}
        </text>
      );
    default:
      return <path key={key} {...r} />;
  }
}

const Scene = memo(function Scene({
  L,
  uid,
  recipe,
  canArt,
}: {
  L: Layout;
  uid: string;
  recipe: Recipe;
  canArt?: string;
}) {
  const P = STILL[L.id];
  const prims = scene(L, recipe, uid, brewLabels, canArt);
  return (
    <svg
      viewBox={`0 0 ${L.box[0]} ${L.box[1]}`}
      className={`brew__svg brew__svg--${L.id}`}
      data-layout={L.id}
      aria-hidden="true"
      focusable="false"
    >
      {prims.map((p, i) => draw(p, P, i))}
    </svg>
  );
});

// The step rail: the stations in order, in the two acts. Each names the stage a tap plays
// from, and the stages during which it is the current one.
type RailKey = "steep" | "germinate" | "kiln" | "mill" | "mash" | "runoff" | "boil" | "ferment" | "out";
interface RailStep {
  key: RailKey;
  from: Stage;
  during: readonly Stage[];
}
const RAIL: readonly { act: "malting" | "brewing"; steps: readonly RailStep[] }[] = [
  {
    act: "malting",
    steps: [
      { key: "steep", from: "grain", during: ["fresh", "grain", "steep"] },
      { key: "germinate", from: "germ", during: ["germ"] },
      { key: "kiln", from: "kiln", during: ["kiln", "malt"] },
    ],
  },
  {
    act: "brewing",
    steps: [
      { key: "mill", from: "mill", during: ["mill"] },
      { key: "mash", from: "mash", during: ["mash"] },
      { key: "runoff", from: "runoff", during: ["runoff", "spent"] },
      { key: "boil", from: "boil", during: ["boil"] },
      { key: "ferment", from: "ferment", during: ["transfer", "ferment"] },
      { key: "out", from: "out", during: ["out", "done"] },
    ],
  },
];
const MALTING: readonly Stage[] = ["fresh", "grain", "steep", "germ", "kiln", "malt"];

interface Model {
  brew: (st: Stage) => void;
  recipe: (r: Recipe) => void;
}

export function BrewProcess({ beers, className }: { beers: readonly BrewBeer[]; className?: string }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const [chosen, choose] = useState(() => defaultBeer(beers)?.id ?? "");
  const [picking, setPicking] = useState(false);
  const [stage, setRailStage] = useState<Stage>("fresh");
  const [live, setLive] = useState(false);
  const beer = beers.find((b) => b.id === chosen) ?? defaultBeer(beers);
  const recipe = useMemo(() => recipeOf(beer ?? { style: "", description: "" }), [beer]);
  // the cans at the end of the line wear the chosen beer's label, where Max has sent one
  const canArt = beer ? canLabels[beer.id]?.src : undefined;
  const art = useRef<HTMLDivElement>(null);
  const model = useRef<Model | null>(null);
  const first = useRef(recipe);

  // a link from the menu chooses the beer: ?brew=<beer> on arrival, and the "sv:brew" event
  // when the menu's beer view on this same page sends its visitor here
  useEffect(() => {
    const pick = (id: unknown) => {
      if (typeof id === "string" && beers.some((b) => b.id === id)) choose(id);
    };
    pick(new URLSearchParams(window.location.search).get("brew"));
    const onBrew = (e: Event) => pick((e as CustomEvent<unknown>).detail);
    window.addEventListener("sv:brew", onBrew);
    return () => window.removeEventListener("sv:brew", onBrew);
  }, [beers]);

  useEffect(() => {
    const root = art.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wideQ = window.matchMedia("(min-width: 64rem)");
    const svgs = {
      phone: root.querySelector<SVGSVGElement>('[data-layout="phone"]'),
      wide: root.querySelector<SVGSVGElement>('[data-layout="wide"]'),
    };

    let L: Layout = wideQ.matches ? WIDE : PHONE;
    const s = createBrew(first.current);
    setStage(s, "grain", L);
    s.stage = "fresh"; // waits, ready, until it is seen

    // the drawing in use, and a writer that touches the DOM only when a value changes
    let svg: SVGSVGElement | null = null;
    let els = new Map<string, SVGElement>();
    const cache = new Map<string, string>();
    const put = (k: string, attr: string, v: string) => {
      const key = `${k}|${attr}`;
      if (cache.get(key) === v) return;
      cache.set(key, v);
      if (k === "cam") {
        // the camera is the drawing's own viewBox; pen and labels are divided by its zoom
        if (attr === "z") svg?.style.setProperty("--z", v);
        else svg?.setAttribute(attr, v);
        return;
      }
      const el = els.get(k);
      if (!el) return;
      if (attr === "display") el.style.display = v;
      else if (attr === "fill") el.style.fill = v;
      else
        el.setAttribute(
          attr === "dash" ? "stroke-dasharray" : attr === "doff" ? "stroke-dashoffset" : attr,
          v,
        );
    };
    const bind = () => {
      L = wideQ.matches ? WIDE : PHONE;
      svg = svgs[L.id];
      els = new Map();
      cache.clear();
      svg?.querySelectorAll<SVGElement>("[data-k]").forEach((el) => {
        const k = el.dataset.k;
        if (k) els.set(k, el);
      });
      // the frame the camera fills
      svg?.style.setProperty("aspect-ratio", `1 / ${L.frame.aspect}`);
    };
    bind();

    let shown: Stage = s.stage;
    const frame = (dt: number) => {
      // two half steps keep the springs steady on a slow frame
      step(s, L, dt / 2);
      step(s, L, dt / 2);
      paint(s, L, put);
      if (s.stage !== shown) {
        shown = s.stage;
        setRailStage(shown);
      }
      return moving(s);
    };
    // place the camera and draw the waiting scene
    frame(0.001);
    const loop = createLoop(root, frame);
    const brew = (st: Stage) => {
      setStage(s, st, L);
      loop.wake();
    };
    model.current = {
      brew,
      recipe: (r) => {
        s.recipe = r;
        // the new beer's extra inputs are new elements: look again
        bind();
        paint(s, L, put);
        // then brew it, from the malt; the malting is not run again (if it is still
        // running for the first time, it carries on, and this beer is what gets brewed)
        if (!MALTING.includes(s.stage)) brew("mill");
        else loop.wake();
      },
    };

    // the first batch starts once the drawing is well into view
    const seen = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        seen.disconnect();
        if (s.stage === "fresh") brew("grain");
      },
      { rootMargin: "0px 0px -25% 0px" },
    );
    seen.observe(root);

    const onLayout = () => {
      bind();
      relayout(s, L);
      paint(s, L, put);
      loop.wake();
    };
    wideQ.addEventListener("change", onLayout);

    // a tap: on the paddle it stirs; on a station it plays again from there
    const onTap = (e: MouseEvent) => {
      const ctm = svg?.getScreenCTM();
      if (!ctm) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
      const hit = L.hits.find(
        ({ r }) => p.x >= r[0] && p.x <= r[0] + r[2] && p.y >= r[1] && p.y <= r[1] + r[3],
      );
      if (!hit) return;
      if (hit.to === "paddle") {
        stir(s);
        loop.wake();
      } else brew(hit.to);
    };
    root.addEventListener("click", onTap);

    const offTilt = onTilt((rad) => {
      lean(s, rad);
      loop.wake();
    });

    root.dataset.live = "";
    setLive(true);

    return () => {
      offTilt();
      seen.disconnect();
      wideQ.removeEventListener("change", onLayout);
      root.removeEventListener("click", onTap);
      loop.stop();
      model.current = null;
      for (const el of Object.values(svgs)) {
        el?.style.removeProperty("aspect-ratio");
        el?.style.removeProperty("--z");
      }
    };
  }, []);

  // a new beer: after React has drawn its extra inputs, brew it
  useEffect(() => {
    model.current?.recipe(recipe);
  }, [recipe]);

  const color = beer?.color;
  // the beer's colour, its final look (cloudier if hazy), and what it is before anything
  // turns it: a fruit beer is plain gold until its fruit goes in
  const look: CSSProperties = color
    ? ({
        "--brew-beer": color,
        "--brew-beer-look": recipe.hazy ? `color-mix(in srgb, ${color} 78%, var(--bone))` : color,
        "--brew-base": recipe.turn === "fruit" ? "var(--brew-plain)" : color,
      } as CSSProperties)
    : {};

  return (
    <div className={className ? `brew ${className}` : "brew"} style={look}>
      {beer ? (
        <p className="brew__now">
          <span className="brew__now-label">{brewLabels.nowBrewing}</span>
          <span className="brew__now-beer">
            <span className="brew__swatch" style={{ background: beer.color }} aria-hidden="true" />
            {beer.name}
          </span>
          {beers.length > 1 ? (
            <button type="button" className="text-link brew__change" onClick={() => setPicking(true)}>
              {brewLabels.change}
            </button>
          ) : null}
        </p>
      ) : null}
      <Sheet open={picking} onOpenChange={setPicking} closeLabel={menuLabels.close} className="brew-sheet">
        <Dialog.Title className="brew-sheet__title">{brewLabels.choose}</Dialog.Title>
        <ul className="brew-sheet__list">
          {beers.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className="brew-sheet__beer"
                aria-current={b.id === beer?.id ? "true" : undefined}
                onClick={() => {
                  choose(b.id);
                  setPicking(false);
                }}
              >
                <span className="brew__swatch" style={{ background: b.color }} aria-hidden="true" />
                <span className="brew-sheet__name">{b.name}</span>
                <span className="brew-sheet__style">{b.style}</span>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
      <div ref={art} className="brew__art" role="img" aria-label={brewLabels.aria(beer?.name ?? "our beer")}>
        <Scene L={PHONE} uid={uid} recipe={recipe} canArt={canArt} />
        <Scene L={WIDE} uid={uid} recipe={recipe} canArt={canArt} />
      </div>
      {/* the steps, in the two acts; a tap plays from there. Only when the drawing is running. */}
      <nav className="brew__rail" aria-label={brewLabels.steps} hidden={!live}>
        {RAIL.map(({ act, steps }) => (
          <div key={act} className="brew__act">
            <span className="brew__act-name">{brewLabels[act]}</span>
            <ol className="brew__steps">
              {steps.map((st) => {
                const on = st.during.includes(stage);
                return (
                  <li key={st.key}>
                    <button
                      type="button"
                      className="brew__step"
                      aria-current={on ? "step" : undefined}
                      onClick={() => model.current?.brew(st.from)}
                    >
                      {brewLabels[st.key]}
                      {/* the mark under the current step: one pen stroke */}
                      <svg viewBox="0 0 40 6" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                        <path d="M1.5 3.6C9 1.6 15 4.6 21 3C27 1.5 33 4.2 38.5 2.6" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
        <button type="button" className="text-link brew__again" onClick={() => model.current?.brew("mill")}>
          {brewLabels.again}
        </button>
      </nav>
    </div>
  );
}
