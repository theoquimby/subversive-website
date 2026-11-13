import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cssVar, raw, type SemanticValue, semantic, semanticNames } from "@/styles/tokens";

const css = readFileSync(new URL("../../src/styles/tokens.css", import.meta.url), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

function block(selectorPattern: RegExp): string {
  const m = selectorPattern.exec(css);
  if (!m) throw new Error(`No block for ${selectorPattern}`);
  const start = css.indexOf("{", m.index) + 1;
  let depth = 1;
  let i = start;
  for (; i < css.length && depth > 0; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") depth--;
  }
  return css.slice(start, i - 1);
}

function declarations(body: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))
    out.set(
      m[1] as string,
      (m[2] as string).replace(/\s+/g, " ").replace(/\( /g, "(").replace(/ \)/g, ")").trim(),
    );
  return out;
}

function expected(v: SemanticValue): string {
  if (v.alpha === undefined) return `var(${cssVar(v.ref)})`;
  return `color-mix(in srgb, var(${cssVar(v.ref)}) ${Math.round(v.alpha * 100)}%, transparent)`;
}

const rootDecls = declarations(block(/^:root\s*\{/m));
const paperDecls = declarations(block(/:root,\s*\[data-skin="paper"\]\s*\{/));
const overtimeDecls = declarations(block(/^\[data-skin="overtime"\]\s*\{/m));

describe("tokens.css matches tokens.ts", () => {
  it("has every raw colour with the same hex", () => {
    for (const [key, hex] of Object.entries(raw)) {
      expect(rootDecls.get(cssVar(key))?.toUpperCase(), cssVar(key)).toBe(hex);
    }
  });

  it("has no raw colour that tokens.ts lacks", () => {
    const hexDecls = [...rootDecls].filter(([, v]) => /^#[0-9A-F]{6}$/i.test(v)).map(([k]) => k);
    expect(hexDecls.sort()).toEqual(Object.keys(raw).map(cssVar).sort());
  });

  it.each([
    ["paper", paperDecls],
    ["overtime", overtimeDecls],
  ] as const)("maps every semantic token in the %s skin", (skin, decls) => {
    for (const name of semanticNames) {
      expect(decls.get(cssVar(name)), `${skin} ${cssVar(name)}`).toBe(expected(semantic[skin][name]));
    }
  });
});

describe("generated motion tokens", () => {
  it("--spring-sticker is the simulated sticker spring", async () => {
    const { springToLinear, SPRINGS } = await import("@/lib/motion/curves");
    const r = springToLinear(SPRINGS.sticker);
    expect(rootDecls.get("--spring-sticker")).toBe(r.css);
    expect(rootDecls.get("--spring-sticker-d")).toBe(`${r.duration}ms`);
  });
});
