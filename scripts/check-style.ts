// House rules that neither Biome nor TypeScript can express (plan §3, spec §2.5, §2.6, §8.3):
//   1. easing keywords ease / ease-in / ease-out / ease-in-out (and Motion's easeIn/easeOut/easeInOut)
//      are banned; every curve is a named cubic-bezier token. `linear` stays legal.
//   2. colour literals (#hex) live only in src/styles/tokens.{css,ts}, content/ and generated files.
//   3. `vh` units are banned; use svh / dvh / lvh.
// Run: node scripts/check-style.ts   (part of `pnpm lint`)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export interface Violation {
  file: string;
  line: number;
  rule: "easing" | "hex" | "vh";
  text: string;
}

const HEX_ALLOWED = [/^src\/styles\/tokens\.(css|ts)$/, /^content\//, /\.generated\.ts$/];

const RULES: { rule: Violation["rule"]; pattern: RegExp; skip?: (file: string) => boolean }[] = [
  // `ease:` as an object key is Motion's option name, not a curve.
  { rule: "easing", pattern: /(?<![\w-])ease(?:-in-out|-in|-out)?(?![\w-]|\s*:)/g },
  { rule: "easing", pattern: /\bease(?:In|Out|InOut)\b/g },
  {
    rule: "hex",
    pattern: /(?<![\w&]|href=["'])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g,
    skip: (file) => HEX_ALLOWED.some((re) => re.test(file)),
  },
  { rule: "vh", pattern: /(?<![\w.])\d*\.?\d+vh(?!\w)/g },
];

/** Blank out comments but keep line numbers. */
function stripComments(source: string): string {
  const blank = (m: string) => m.replace(/[^\n]/g, " ");
  return source
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:\\])\/\/[^\n]*/gm, (m, lead: string) => lead + blank(m.slice(lead.length)));
}

export function scanSource(file: string, source: string): Violation[] {
  const path = file.split(sep).join("/");
  const lines = stripComments(source).split("\n");
  const out: Violation[] = [];
  for (const { rule, pattern, skip } of RULES) {
    if (skip?.(path)) continue;
    lines.forEach((text, i) => {
      for (const m of text.matchAll(pattern)) out.push({ file: path, line: i + 1, rule, text: m[0] });
    });
  }
  return out;
}

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(css|ts|tsx)$/.test(name)) files.push(full);
  }
  return files;
}

function main(): void {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const violations = walk(join(root, "src")).flatMap((f) =>
    scanSource(relative(root, f), readFileSync(f, "utf8")),
  );
  for (const v of violations) console.error(`${v.file}:${v.line}  [${v.rule}]  ${v.text}`);
  if (violations.length > 0) {
    console.error(
      `\ncheck-style: ${violations.length} violation(s). See scripts/check-style.ts for the rules.`,
    );
    process.exit(1);
  }
  console.log("check-style: clean");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
