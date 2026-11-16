"use client";

// How their beer is made, as one living pen drawing (2026-11-16): the grain, hops, water
// and yeast; the mill; the mash tun and its paddle; the run-off; the kettle on its burner;
// the conical fermenter; and the filler, where a keg and three cans ride a belt. Drawn
// flat in the Home glass's hand; the motion is a small physics model (brew-model.ts).
//
// It brews one batch on its own the first time it scrolls into view (about half a
// minute), then rests on the filled keg and cans. A tap on a station brews again from
// there; a tap on the paddle stirs; the phone's lean sloshes every vessel; "Brew another"
// starts a new batch. The model writes straight to the SVG, one loop, which sleeps off
// screen and at rest.
//
// Two drawings are sent: tall for phones, wide from 64rem; CSS shows one and the model
// runs on that one. Without JavaScript, or with reduced motion, both are the still
// picture: every vessel full and the keg and cans done.
import { brewLabels } from "@content/microcopy";
import { type CSSProperties, type SVGProps, useEffect, useId, useRef } from "react";
import { createLoop } from "../../lib/motion/loop";
import { onTilt } from "../../lib/motion/tilt";
import {
  BALE,
  CONE,
  FERM,
  JAR,
  JUG,
  KETTLE,
  type Layout,
  MASH,
  MILL,
  OUT,
  PHONE,
  type Pt,
  SACK,
  type Stage,
  WIDE,
} from "./brew-layout";
import {
  createBrew,
  lean,
  moving,
  POOLS,
  paint,
  relayout,
  setStage,
  step,
  stillBrew,
  stir,
} from "./brew-model";

type Attrs = Record<string, Record<string, string>>;

function collect(L: Layout): Attrs {
  const out: Attrs = {};
  paint(stillBrew(), L, (k, a, v) => {
    const m = out[k] ?? {};
    m[a] = v;
    out[k] = m;
  });
  return out;
}
// the still picture, worked out once: the server's drawing and the first client render agree
const STILL: Record<Layout["id"], Attrs> = { phone: collect(PHONE), wide: collect(WIDE) };

type El = SVGProps<SVGPathElement> & SVGProps<SVGCircleElement> & SVGProps<SVGGElement>;
/** an element's painted attributes as React props, under its key */
function at(P: Attrs, key: string): El & { "data-k": string } {
  const m = P[key] ?? {};
  const r: Record<string, unknown> = { "data-k": key };
  const style: CSSProperties = {};
  for (const [a, v] of Object.entries(m)) {
    if (a === "display") {
      if (v) style.display = v;
    } else if (a === "fill") style.fill = v;
    else if (a === "dash") r.strokeDasharray = v;
    else if (a === "doff") r.strokeDashoffset = v;
    else r[a] = v;
  }
  if (Object.keys(style).length > 0) r.style = style;
  return r as unknown as El & { "data-k": string };
}

const keys = (pre: string, n: number) => Array.from({ length: n }, (_, i) => `${pre}${i}`);
const tr = (p: Pt) => `translate(${p[0]} ${p[1]})`;
const LIQUID_LINKS = [
  { i: 2, tone: "water" },
  { i: 3, tone: "wort" },
  { i: 4, tone: "wort" },
  { i: 5, tone: "beer" },
] as const;

function Cone() {
  return (
    <>
      <path d={CONE.body} className="brew__hop" />
      <path d={CONE.scales} />
      <path d={CONE.stem} />
    </>
  );
}

function Scene({ L, uid }: { L: Layout; uid: string }) {
  const P = STILL[L.id];
  const a = (k: string) => at(P, k);
  const clip = (name: string) => `${uid}-${L.id}-${name}`;
  const url = (name: string) => `url(#${clip(name)})`;
  const { at: A } = L;
  return (
    <svg
      viewBox={`0 0 ${L.box[0]} ${L.box[1]}`}
      className={`brew__svg brew__svg--${L.id}`}
      data-layout={L.id}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clip("jug")}>
          <path d={JUG.inside} />
        </clipPath>
        <clipPath id={clip("jar")}>
          <path d={JAR.inside} />
        </clipPath>
        <clipPath id={clip("mash")}>
          <path d={MASH.inside} />
        </clipPath>
        <clipPath id={clip("ket")}>
          <path d={KETTLE.inside} />
        </clipPath>
        <clipPath id={clip("fer")}>
          <path d={FERM.inside} />
        </clipPath>
      </defs>

      {/* pipes, under everything: an ink pipe with a hollow, and what runs in it */}
      <g className="brew__pipes">
        {LIQUID_LINKS.map(({ i, tone }) => {
          const g = L.links[i];
          if (!g) return null;
          return (
            <g key={i}>
              <path d={g.d} className="brew__pipe-o" />
              <path d={g.d} className="brew__pipe-i" />
              <path d={g.d} pathLength={1} className={`brew__pipe-l brew--${tone}`} {...a(`l${i}.liq`)} />
              <path d={g.d} pathLength={1} className="brew__fleck" {...a(`l${i}.fl`)} />
            </g>
          );
        })}
        <path d={L.trough} className="brew__trough" />
      </g>
      {LIQUID_LINKS.map(({ i, tone }) => (
        <path key={i} className={`brew__stream brew--${tone}`} {...a(`l${i}.st`)} />
      ))}

      {/* the inputs */}
      <g transform={tr(A.sack)} className="brew__ink">
        <path d={SACK.back} className="brew__sack" />
        <path d={SACK.front} className="brew__sack" />
        <path d={SACK.tie} />
        <path d={SACK.spill} className="brew__grainfill" />
        <path d={SACK.ear} className="brew__thin" />
        {SACK.kernels.map((d) => (
          <path key={d} d={d} className="brew__inkfill" />
        ))}
      </g>
      <g transform={tr(A.hops)} className="brew__ink">
        <path d={BALE.body} className="brew__bale" />
        <path d={BALE.straps} />
        {BALE.cones.map(([x, y, r]) => (
          <g key={x} transform={`translate(${x} ${y}) rotate(${r})`}>
            <Cone />
          </g>
        ))}
      </g>
      <g transform={tr(A.jug)} className="brew__ink">
        <g clipPath={url("jug")}>
          <path className="brew__liq brew--water" {...a("jug.w")} />
        </g>
        <path d={JUG.body} />
        <path d={JUG.neck} />
        <path d={JUG.tap} />
      </g>
      <g transform={tr(A.jar)} className="brew__ink">
        <g clipPath={url("jar")}>
          <path className="brew__liq brew--yeast" {...a("jar.f")} />
        </g>
        <path d={JAR.body} />
        <path d={JAR.lid} className="brew__paper2" />
      </g>

      {/* the mill */}
      <g transform={tr(A.mill)} className="brew__ink">
        <path className="brew__liq brew--grain" {...a("heap")} />
        <path d={MILL.hopper} />
        {MILL.rollers.map(([x, y], i) => (
          <g key={x} {...a(i === 0 ? "rA" : "rB")}>
            <circle cx={x} cy={y} r={9} className="brew__paper2" />
            <path d={`M${x} ${y - 8}V${y + 8}M${x - 8} ${y}H${x + 8}`} className="brew__thin" />
          </g>
        ))}
        <path d={MILL.housing} />
        <path d={MILL.post} />
        <g {...a("crank")}>
          <path d={`M${MILL.crank[0]} ${MILL.crank[1]}V${MILL.crank[1] - 10}`} />
          <circle cx={MILL.crank[0]} cy={MILL.crank[1] - 11} r={2.4} className="brew__inkfill" />
        </g>
        <circle cx={MILL.crank[0]} cy={MILL.crank[1]} r={2.6} className="brew__paper" />
      </g>

      {/* the mash tun */}
      <g transform={tr(A.mash)} className="brew__ink">
        <g clipPath={url("mash")}>
          <path className="brew__liq" {...a("mash.b")} />
          <path className="brew__liq brew--bed" {...a("mash.bed")} />
        </g>
        <path d={MASH.falseBottom} className="brew__dash" />
        <g {...a("paddle")}>
          <path d={MASH.paddle.blade} className="brew__paper2" />
          <path d={MASH.paddle.holes} className="brew__thin" />
          <path d={MASH.paddle.handle} />
        </g>
        <path d={MASH.walls} />
        <path d={MASH.valve} className="brew__paper" />
        <path d={MASH.handle} {...a("v3")} />
        <path className="brew__steam" {...a("mash.s0")} />
        <path className="brew__steam" {...a("mash.s1")} />
      </g>

      {/* the kettle on its burner */}
      <g transform={tr(A.kettle)} className="brew__ink">
        <g {...a("ket.fire")}>
          {[0, 1, 2].map((i) => (
            <path key={i} className="brew__flame" {...a(`ket.f${i}`)} />
          ))}
          <path className="brew__core" {...a("ket.f3")} />
        </g>
        <path d={KETTLE.burner} />
        <g clipPath={url("ket")}>
          <path className="brew__liq brew--wort" {...a("ket.b")} />
          {keys("kb", POOLS.kb).map((k) => (
            <circle key={k} className="brew__bubble" {...a(k)} />
          ))}
        </g>
        {keys("hop", POOLS.hops).map((k) => (
          <g key={k} {...a(k)}>
            <Cone />
          </g>
        ))}
        <path d={KETTLE.walls} />
        <path d={KETTLE.valve} className="brew__paper" />
        <path d={KETTLE.handle} {...a("v4")} />
        {[0, 1, 2].map((i) => (
          <path key={i} className="brew__steam" {...a(`ket.s${i}`)} />
        ))}
      </g>

      {/* the fermenter */}
      <g transform={tr(A.ferm)} className="brew__ink">
        <g clipPath={url("fer")}>
          <path className="brew__liq" {...a("fer.b")} />
          <path className="brew__liq brew--foam" {...a("fer.foam")} />
          {keys("cb", POOLS.cb).map((k) => (
            <circle key={k} className="brew__bubble" {...a(k)} />
          ))}
          {keys("y", POOLS.yeast).map((k) => (
            <circle key={k} className="brew__liq brew--yeast" {...a(k)} />
          ))}
        </g>
        <path d={FERM.walls} />
        <path d={FERM.legs} />
        <path d={FERM.port} className="brew__paper" />
        <path d={FERM.valve} className="brew__paper" />
        <path d={FERM.handle} {...a("v5")} />
        <path d={FERM.water} className="brew__liq brew--water" />
        <circle cx={FERM.bulb[0]} cy={FERM.bulb[1]} r={7} />
        <circle cx={FERM.bulb[0]} className="brew__bubble" {...a("blip")} />
        <path d={FERM.airlock} />
      </g>

      {/* the filler, the belt, the keg and cans */}
      <g transform={tr(A.out)} className="brew__ink">
        <path d={OUT.belt} />
        <path d={OUT.beltMid} className="brew__belt" {...a("belt")} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} {...a(`c${i}`)}>
            <path className="brew__liq brew--beer" {...a(`c${i}.l`)} />
            <path className="brew__liq brew--foam" {...a(`c${i}.f`)} />
            {i === 0 ? (
              <>
                <path d={OUT.keg} />
                <path d={OUT.kegRibs} />
              </>
            ) : (
              <>
                <path d={OUT.can} />
                <g {...a(`lid${i - 1}`)}>
                  <path d={OUT.lid} className="brew__paper2" />
                </g>
              </>
            )}
          </g>
        ))}
        <path d={OUT.tip} />
        <path d={OUT.nozzle} className="brew__paper" />
        <path d={OUT.capper} className="brew__paper" />
      </g>

      {/* grain on its way */}
      {keys("gw", POOLS.whole).map((k) => (
        <circle key={k} className="brew__grain" {...a(k)} />
      ))}
      {keys("gc", POOLS.cracked).map((k) => (
        <circle key={k} className="brew__cracked" {...a(k)} />
      ))}

      {L.labels.map((l) => (
        <text key={l.key} x={l.x} y={l.y} textAnchor={l.anchor ?? "middle"} className="brew__label">
          {brewLabels[l.key]}
        </text>
      ))}
    </svg>
  );
}

export function BrewProcess({ className }: { className?: string }) {
  const uid = useId().replace(/[^\w-]/g, "");
  const art = useRef<HTMLDivElement>(null);
  const again = useRef<HTMLButtonElement>(null);
  const model = useRef<{ brew: (st: Stage) => void } | null>(null);

  useEffect(() => {
    const root = art.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wideQ = window.matchMedia("(min-width: 64rem)");
    const svgs = {
      phone: root.querySelector<SVGSVGElement>('[data-layout="phone"]'),
      wide: root.querySelector<SVGSVGElement>('[data-layout="wide"]'),
    };

    const s = createBrew();
    setStage(s, "grain");
    s.stage = "fresh"; // waits, empty, until it is seen

    // the drawing in use, and a writer that touches the DOM only when a value changes
    let L: Layout = PHONE;
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
      setStage(s, st);
      loop.wake();
    };
    model.current = { brew };

    // the first batch starts once the drawing is well into view
    const first = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        first.disconnect();
        if (s.stage === "fresh") brew("grain");
      },
      { rootMargin: "0px 0px -25% 0px" },
    );
    first.observe(root);

    const onLayout = () => {
      relayout(s);
      bind();
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
      first.disconnect();
      wideQ.removeEventListener("change", onLayout);
      root.removeEventListener("click", onTap);
      loop.stop();
      model.current = null;
    };
  }, []);

  return (
    <div className={className ? `brew ${className}` : "brew"}>
      <div ref={art} className="brew__art" role="img" aria-label={brewLabels.aria}>
        <Scene L={PHONE} uid={uid} />
        <Scene L={WIDE} uid={uid} />
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
