// JS budget for /menu (spec §9.1 as amended by plan Q3): the framework baseline plus at
// most 30 KB gzip of our own JavaScript. Measured against a running production build:
// every <script src> on /menu that the /about stub (the same shell, no page code) does not
// load is the menu's own cost. Prints both totals; exits 1 over budget.
//   node scripts/check-js-budget.ts [baseUrl]
import { gzipSync } from "node:zlib";

const BASE = process.argv[2] ?? "http://localhost:3100";
const BUDGET_KB = 30;

async function scripts(path: string): Promise<Set<string>> {
  const html = await (await fetch(new URL(path, BASE))).text();
  return new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1] as string));
}

async function gz(src: string): Promise<number> {
  const buf = Buffer.from(await (await fetch(new URL(src, BASE))).arrayBuffer());
  return gzipSync(buf, { level: 9 }).length;
}

const [menu, stub] = await Promise.all([scripts("/menu"), scripts("/about")]);
const own = [...menu].filter((s) => !stub.has(s));
const total = (await Promise.all([...menu].map(gz))).reduce((a, b) => a + b, 0);
const ownSizes = await Promise.all(own.map(async (s) => [s, await gz(s)] as const));
const ownTotal = ownSizes.reduce((a, [, n]) => a + n, 0);

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
console.log(`/menu first-load JS: ${kb(total)} gzip in ${menu.size} files`);
for (const [s, n] of ownSizes) console.log(`  menu only  ${kb(n).padStart(8)}  ${s}`);
console.log(`/menu's own JS: ${kb(ownTotal)} gzip (budget ${BUDGET_KB} KB)`);
if (ownTotal > BUDGET_KB * 1024) {
  console.error("Over budget");
  process.exit(1);
}
