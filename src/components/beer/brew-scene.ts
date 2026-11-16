// The brewing drawing's elements, as plain data (2026-11-16): BrewProcess.tsx turns this into
// SVG, so the server, the client and any check all draw the same thing. An element with a
// key (`k`) is one the model paints; its moving attributes come from `paint`, never from here.
import {
  BALE,
  CONE,
  EXTRA,
  ell,
  FERM,
  GERM,
  GRAIN_LINKS,
  JAR,
  KETTLE,
  KILN,
  type LabelKey,
  type Layout,
  LIQUID_LINKS,
  MASH,
  MILL,
  OUT,
  type Pt,
  SACK,
  STEEP,
  TANK,
} from "./brew-layout";
import { FILLS, POOLS } from "./brew-model";
import type { Recipe } from "./brew-recipe";

export interface Prim {
  el: "g" | "path" | "circle" | "text" | "clipPath";
  c?: string;
  k?: string;
  a?: Record<string, string | number>;
  kids?: Prim[];
  text?: string;
}

const path = (d: string, c?: string, a?: Record<string, string | number>): Prim => ({
  el: "path",
  ...(c ? { c } : {}),
  a: { d, ...a },
});
const live = (el: Prim["el"], k: string, c?: string, a?: Record<string, string | number>): Prim => ({
  el,
  k,
  ...(c ? { c } : {}),
  ...(a ? { a } : {}),
});
const g = (kids: Prim[], a?: Record<string, string | number>, c?: string, k?: string): Prim => ({
  el: "g",
  kids,
  ...(a ? { a } : {}),
  ...(c ? { c } : {}),
  ...(k ? { k } : {}),
});
const at = (p: Pt) => ({ transform: `translate(${p[0]} ${p[1]})` });
const keys = (pre: string, n: number) => Array.from({ length: n }, (_, i) => `${pre}${i}`);

function cone(): Prim[] {
  return [path(CONE.body, "brew__hop"), path(CONE.scales, "brew__thin"), path(CONE.stem)];
}

export function scene(L: Layout, recipe: Recipe, uid: string, labels: Record<LabelKey, string>): Prim[] {
  const id = (n: string) => `${uid}-${L.id}-${n}`;
  const clipped = (n: string, kids: Prim[]) => g(kids, { "clip-path": `url(#${id(n)})` });
  const A = L.at;
  const clips: [string, string][] = [
    ["tank", TANK.inside],
    ["jar", JAR.inside],
    ["steep", STEEP.fill],
    ["mash", MASH.inside],
    ["ket", KETTLE.inside],
    ["fer", FERM.inside],
    ["keg", OUT.kegFill],
    ["can", OUT.canFill],
  ];

  const out: Prim[] = [];
  for (const [n, d] of clips) out.push({ el: "clipPath", a: { id: id(n) }, kids: [path(d)] });

  // the room, quieter than everything in it
  out.push(path(L.room, "brew__room"), path(L.hatch, "brew__hatch"), path(L.shelves, "brew__shelf"));
  out.push(path(`${ell(L.drain[0], L.drain[1], 9, 2.4)}M${L.drain[0] - 5} ${L.drain[1]}h10`, "brew__shelf"));

  // pipes and augers under the vessels
  const pipes: Prim[] = [];
  for (const i of GRAIN_LINKS) {
    const l = L.links[i];
    if (!l) continue;
    pipes.push(path(l.d, "brew__pipe-o"), path(l.d, "brew__pipe-i"), path(l.d, "brew__flight"));
  }
  for (const { i, tone } of LIQUID_LINKS) {
    const l = L.links[i];
    if (!l) continue;
    pipes.push(
      path(l.d, "brew__pipe-o"),
      path(l.d, "brew__pipe-i"),
      live("path", `l${i}.liq`, `brew__pipe-l brew--${tone}`, { d: l.d, pathLength: 1 }),
      live("path", `l${i}.fl`, "brew__fleck", { d: l.d, pathLength: 1 }),
    );
  }
  out.push(g(pipes, undefined, "brew__pipes"));
  for (const { i, tone } of LIQUID_LINKS) out.push(live("path", `l${i}.st`, `brew__stream brew--${tone}`));

  const station = (p: Pt, kids: Prim[], extra?: string) =>
    g(kids, { transform: `translate(${p[0]} ${p[1]})${extra ?? ""}` }, "brew__ink");

  // the water tank on the wall
  out.push(
    station(A.tank, [
      path(TANK.body, "brew__solid"),
      clipped("tank", [live("path", "tank.w", "brew__liq brew--water")]),
      path(TANK.body),
      path(TANK.neck),
      path(TANK.tap),
      path(TANK.bracket, "brew__thin"),
    ]),
  );
  // the grain sack
  out.push(
    g(
      [
        path(SACK.back, "brew__sack"),
        path(SACK.front, "brew__sack"),
        path(SACK.tie),
        path(SACK.spill, "brew__grainfill"),
        path(SACK.ear, "brew__thin"),
        ...SACK.kernels.map((d) => path(d, "brew__inkfill")),
      ],
      {
        transform: L.sackFlip
          ? `translate(${A.sack[0] + 76} ${A.sack[1]}) scale(-1 1)`
          : at(A.sack).transform,
      },
      "brew__ink",
    ),
  );
  // the steep
  out.push(
    station(A.steep, [
      path(STEEP.fill, "brew__solid"),
      clipped("steep", [
        live("path", "steep.b", "brew__liq brew--water"),
        live("path", "steep.bed", "brew__liq brew--wet"),
        live("path", "steep.top", "brew__liq"),
        ...keys("sb", POOLS.sb).map((k) => live("circle", k, "brew__bubble")),
      ]),
      path(STEEP.lines),
      path(STEEP.seamLine, "brew__thin"),
      path(STEEP.valve, "brew__solid"),
      live("path", "vS", undefined, { d: STEEP.handle }),
    ]),
  );
  // the germination floor
  out.push(
    station(A.germ, [
      path(GERM.fill, "brew__solid"),
      path(GERM.lines),
      live("path", "germ.bed", "brew__liq brew--wet"),
      live("path", "germ.edge", "brew__thin"),
      ...keys("sp", POOLS.sprouts).map((k, i) =>
        g(
          [{ el: "circle", c: "brew__kernel", a: { r: 1.5 } }, live("path", `spr${i}`, "brew__root")],
          undefined,
          undefined,
          k,
        ),
      ),
      g([path("M0 0L18 -24M-7 0H7M-6 0V3.5M-2 0V3.5M2 0V3.5M6 0V3.5")], undefined, undefined, "rake"),
    ]),
  );
  // the kiln
  out.push(
    station(A.kiln, [
      path(KILN.fill, "brew__solid"),
      g(
        [
          live("path", "kiln.f0", "brew__flame"),
          live("path", "kiln.f1", "brew__flame"),
          live("path", "kiln.f2", "brew__core"),
        ],
        undefined,
        undefined,
        "kiln.fire",
      ),
      path(KILN.lines),
      path(KILN.slats, "brew__thin"),
      live("path", "kiln.bed", "brew__liq"),
      live("path", "kiln.edge", "brew__thin"),
      live("path", "kiln.s0", "brew__steam"),
      live("path", "kiln.s1", "brew__steam"),
    ]),
  );
  // the mill
  out.push(
    station(A.mill, [
      live("path", "heap", "brew__liq brew--grain"),
      path(MILL.hopper),
      path(MILL.rim, "brew__thin"),
      ...MILL.rollers.map(([x, y], i) =>
        g(
          [
            { el: "circle", c: "brew__paper2", a: { cx: x, cy: y, r: 9 } },
            path(`M${x} ${y - 8}V${y + 8}M${x - 8} ${y}H${x + 8}`, "brew__thin"),
          ],
          undefined,
          undefined,
          i === 0 ? "rA" : "rB",
        ),
      ),
      path(MILL.housing),
      path(MILL.post),
      g(
        [
          path(`M${MILL.crank[0]} ${MILL.crank[1]}V${MILL.crank[1] - 10}`),
          { el: "circle", c: "brew__inkfill", a: { cx: MILL.crank[0], cy: MILL.crank[1] - 11, r: 2.4 } },
        ],
        undefined,
        undefined,
        "crank",
      ),
      { el: "circle", c: "brew__solid", a: { cx: MILL.crank[0], cy: MILL.crank[1], r: 2.6 } },
    ]),
  );
  // the mash tun
  out.push(
    station(A.mash, [
      path(MASH.inside, "brew__solid"),
      clipped("mash", [
        live("path", "mash.b", "brew__liq"),
        live("path", "mash.bed", "brew__liq brew--bed"),
        live("path", "mash.top", "brew__liq"),
      ]),
      path(MASH.falseBottom, "brew__dash"),
      g(
        [
          path(MASH.paddle.blade, "brew__paper2"),
          path(MASH.paddle.holes, "brew__thin"),
          path(MASH.paddle.handle),
        ],
        undefined,
        undefined,
        "paddle",
      ),
      path(MASH.lines),
      path(MASH.valve, "brew__solid"),
      live("path", "vM", undefined, { d: MASH.handle }),
      live("path", "mash.s0", "brew__steam"),
      live("path", "mash.s1", "brew__steam"),
    ]),
  );
  // the kettle on its burner
  out.push(
    station(A.kettle, [
      g(
        [
          live("path", "ket.f0", "brew__flame"),
          live("path", "ket.f1", "brew__flame"),
          live("path", "ket.f2", "brew__flame"),
          live("path", "ket.f3", "brew__core"),
        ],
        undefined,
        undefined,
        "ket.fire",
      ),
      path(KETTLE.burner),
      path(KETTLE.inside, "brew__solid"),
      clipped("ket", [
        live("path", "ket.b", "brew__liq brew--wort"),
        ...keys("kb", POOLS.kb).map((k) => live("circle", k, "brew__bubble")),
        live("path", "ket.top", "brew__liq brew--wort-top"),
      ]),
      path(KETTLE.lines),
      path(KETTLE.valve, "brew__solid"),
      live("path", "vK", undefined, { d: KETTLE.handle }),
      live("path", "ket.s0", "brew__steam"),
      live("path", "ket.s1", "brew__steam"),
      live("path", "ket.s2", "brew__steam"),
    ]),
  );
  // the fermenter
  out.push(
    station(A.ferm, [
      path(FERM.fill, "brew__solid"),
      clipped("fer", [
        live("path", "fer.b", "brew__liq"),
        live("path", "fer.top", "brew__liq"),
        live("path", "fer.foam", "brew__liq brew--foam"),
        ...keys("cb", POOLS.cb).map((k) => live("circle", k, "brew__bubble")),
        ...keys("y", POOLS.yeast).map((k) => live("circle", k, "brew__liq brew--yeast")),
      ]),
      path(FERM.seams, "brew__thin"),
      path(FERM.lines),
      g([path(FERM.frost, "brew__frost")], undefined, undefined, "frost"),
      path(FERM.port, "brew__solid"),
      path(FERM.valve, "brew__solid"),
      live("path", "vF", undefined, { d: FERM.handle }),
      path(FERM.water, "brew__liq brew--water"),
      { el: "circle", a: { cx: FERM.bulb[0], cy: FERM.bulb[1], r: 7 } },
      live("circle", "blip", "brew__bubble", { cx: FERM.bulb[0] }),
      path(FERM.airlock),
    ]),
  );
  // the hops, the yeast jar on its shelf
  out.push(
    station(A.hops, [
      path(BALE.body, "brew__bale"),
      path(BALE.top, "brew__bale"),
      path(BALE.straps, "brew__thin"),
      ...BALE.cones.map(([x, y, r]) => g(cone(), { transform: `translate(${x} ${y}) rotate(${r})` })),
    ]),
  );
  out.push(
    station(A.jar, [
      g(
        [
          path(JAR.body, "brew__solid"),
          clipped("jar", [live("path", "jar.f", "brew__liq brew--yeast")]),
          path(JAR.body),
          path(JAR.lid, "brew__paper2"),
        ],
        undefined,
        undefined,
        "jar",
      ),
    ]),
  );
  // the beer's own extra inputs, each where it goes in, named in the menu's words
  recipe.extras.forEach((e, i) => {
    const p = L.extras[e.into][i] ?? L.extras[e.into][0];
    const fill = FILLS[e.kind];
    const bowl = e.kind === "fruit" || e.kind === "citrus" || e.kind === "grain";
    const kids: Prim[] = bowl
      ? [
          ...EXTRA.fruit.map(([x, y]) => ({
            el: "circle" as const,
            c: "brew__fruit",
            a: { cx: x, cy: y, r: e.kind === "grain" ? 2.4 : 3.6, style: `fill:${fill}` },
          })),
          path(EXTRA.bowl, "brew__paper2"),
          path(EXTRA.bowlRim, "brew__thin"),
        ]
      : [
          path(EXTRA.jar, "brew__paper2"),
          path(EXTRA.jarInside, "brew__liq", { style: `fill:${fill}` }),
          path(EXTRA.jar),
        ];
    // its own small shelf
    kids.unshift(path("M-5 30H35M1 30l-4 6M29 30l4 6", "brew__thin"));
    kids.push({
      el: "text",
      c: "brew__label brew__label--small",
      // a second name sits above the first, so two long names never run into each other
      a: {
        x: { start: 2, middle: 15, end: 28 }[L.extraAnchor[e.into]],
        y: -6 - i * 13,
        "text-anchor": L.extraAnchor[e.into],
      },
      text: e.label,
    });
    out.push(station(p, kids));
  });
  // the filler
  out.push(
    station(A.out, [
      path(OUT.beltFill, "brew__solid"),
      path(OUT.frame),
      path(OUT.belt),
      live("path", "belt", "brew__belt", { d: OUT.beltMid }),
      ...[0, 1, 2, 3].map((i) =>
        g(
          [
            path(i === 0 ? OUT.kegFill : OUT.canFill, "brew__solid"),
            clipped(i === 0 ? "keg" : "can", [
              live("path", `c${i}.l`, "brew__liq brew--beer"),
              live("path", `c${i}.f`, "brew__liq brew--foam"),
            ]),
            ...(i === 0
              ? [path(OUT.keg), path(OUT.kegRibs, "brew__thin")]
              : [path(OUT.can), g([path(OUT.lid, "brew__paper2")], undefined, undefined, `lid${i - 1}`)]),
          ],
          undefined,
          undefined,
          `c${i}`,
        ),
      ),
      path(OUT.tip),
      path(OUT.nozzle, "brew__solid"),
      path(OUT.capper, "brew__solid"),
    ]),
  );

  // what is on the move: grain in the augers, things in the air, hop cones
  out.push(
    g(
      [
        ...keys("gw", POOLS.grains).map((k) => live("circle", k, "brew__grain")),
        ...keys("gc", POOLS.cracked).map((k) => live("circle", k, "brew__cracked")),
        ...keys("fx", POOLS.fx).map((k) => live("circle", k, "brew__toss")),
        ...keys("hop", POOLS.hops).map((k) => g(cone(), undefined, undefined, k)),
      ],
      undefined,
      "brew__ink",
    ),
  );

  for (const l of L.labels)
    out.push({
      el: "text",
      c: l.key === "malting" ? "brew__label brew__label--group" : "brew__label",
      a: { x: l.x, y: l.y, "text-anchor": l.anchor ?? "middle" },
      text: labels[l.key],
    });
  return out;
}
