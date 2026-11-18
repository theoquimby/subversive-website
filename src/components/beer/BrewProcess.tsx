"use client";

import { labels as canLabels } from "@content/labels";
// How their beer is made, as one living pen drawing (2026-11-16), for whichever of the beers
// on tap is chosen: the grain through the steep, the germination floor and the kiln; the
// mill; the mash tun and its paddle; the run-off; the kettle on its burner, hops tossed in
// from the bale; the conical fermenter, yeast poured from its jar; and the filler, where a
// keg and three cans ride a belt. A beer's own extra inputs (fruit, citrus, brine, spice, a
// second grain) and its cold rest come only from its menu style and description
// (brew-recipe.ts). It all stands in a quiet pen drawing of the brewhouse. Drawn flat in
// the Home glass's hand; the motion is a small physics model (brew-model.ts).
//
// It brews one batch on its own the first time it scrolls into view (about half a minute),
// then rests on the filled keg and cans. Choosing a beer brews that one; a tap on a station
// brews again from there; a tap on the paddle stirs; the phone's lean sloshes the vessels;
// "Brew another" starts again. One loop writes straight to the SVG; it sleeps off screen
// and at rest. Two drawings are sent, tall for phones and wide from 64rem; CSS shows one.
// Without JavaScript, or with reduced motion, both are the still picture of the whole
// process, and choosing a beer still changes its colours and extra inputs.
import { brewLabels } from "@content/microcopy";
import { type CSSProperties, memo, useEffect, useId, useMemo, useRef, useState } from "react";
import { createLoop } from "../../lib/motion/loop";
import { onTilt } from "../../lib/motion/tilt";
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

interface Model {
  brew: (st: Stage) => void;
  recipe: (r: Recipe) => void;
}

export function BrewProcess({ beers, className }: { beers: readonly BrewBeer[]; className?: string }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const [chosen, choose] = useState(() => defaultBeer(beers)?.id ?? "");
  const beer = beers.find((b) => b.id === chosen) ?? defaultBeer(beers);
  const recipe = useMemo(() => recipeOf(beer ?? { style: "", description: "" }), [beer]);
  // the cans at the end of the line wear the chosen beer's label, where Max has sent one
  const canArt = beer ? canLabels[beer.id]?.src : undefined;
  const art = useRef<HTMLDivElement>(null);
  const again = useRef<HTMLButtonElement>(null);
  const model = useRef<Model | null>(null);
  const first = useRef(recipe);

  // a link from the menu (?brew=<beer>) chooses that beer
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("brew");
    if (id && beers.some((b) => b.id === id)) choose(id);
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
      paint(s, L, put);
    };
    bind();

    const loop = createLoop(root, (dt) => {
      // two half steps keep the springs steady on a slow frame
      step(s, L, dt / 2);
      step(s, L, dt / 2);
      paint(s, L, put);
      return moving(s);
    });
    const brew = (st: Stage) => {
      setStage(s, st, L);
      loop.wake();
    };
    model.current = {
      brew,
      recipe: (r) => {
        s.recipe = r;
        // the new beer's extra inputs are new elements: look again, then brew it
        bind();
        if (s.stage !== "fresh") brew("grain");
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
      loop.wake();
    };
    wideQ.addEventListener("change", onLayout);

    // a tap: on the paddle it stirs; on a station it brews again from there
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

    if (again.current) again.current.hidden = false;
    root.dataset.live = "";

    return () => {
      offTilt();
      seen.disconnect();
      wideQ.removeEventListener("change", onLayout);
      root.removeEventListener("click", onTap);
      loop.stop();
      model.current = null;
    };
  }, []);

  // a new beer: after React has drawn its extra inputs, brew it
  useEffect(() => {
    model.current?.recipe(recipe);
  }, [recipe]);

  // on a phone the beers are one row you swipe: keep the chosen one in sight (the row
  // scrolls, never the page)
  const row = useRef<HTMLFieldSetElement>(null);
  const pickedId = beer?.id;
  useEffect(() => {
    const el = row.current;
    const on = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !on || el.scrollWidth <= el.clientWidth || !pickedId) return;
    const pad = Number.parseFloat(getComputedStyle(el).paddingLeft) || 0;
    el.scrollTo({ left: on.offsetLeft - el.offsetLeft - pad, behavior: "instant" });
  }, [pickedId]);

  const color = beer?.color;
  const look: CSSProperties = color
    ? ({
        "--brew-beer": color,
        "--brew-beer-look": recipe.hazy ? `color-mix(in srgb, ${color} 78%, var(--bone))` : color,
      } as CSSProperties)
    : {};

  return (
    <div className={className ? `brew ${className}` : "brew"} style={look}>
      {beers.length > 1 ? (
        <fieldset ref={row} className="brew__beers">
          <legend className="sr-only">{brewLabels.choose}</legend>
          {beers.map((b) => (
            <button
              key={b.id}
              type="button"
              className="brew__beer"
              aria-pressed={b.id === beer?.id}
              onClick={() => choose(b.id)}
            >
              <span className="brew__swatch" style={{ background: b.color }} aria-hidden="true" />
              {b.name}
            </button>
          ))}
        </fieldset>
      ) : null}
      <div ref={art} className="brew__art" role="img" aria-label={brewLabels.aria(beer?.name ?? "our beer")}>
        <Scene L={PHONE} uid={uid} recipe={recipe} canArt={canArt} />
        <Scene L={WIDE} uid={uid} recipe={recipe} canArt={canArt} />
      </div>
      <p className="brew__foot">
        <button
          ref={again}
          type="button"
          className="text-link brew__again"
          hidden
          onClick={() => model.current?.brew("grain")}
        >
          {brewLabels.again}
        </button>
      </p>
    </div>
  );
}
