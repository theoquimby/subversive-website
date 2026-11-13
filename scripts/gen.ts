// `pnpm gen`: every build-time generator, run in order (plan §4). CI runs `pnpm gen` and then
// `git diff --exit-code`, so generated files can never drift from their sources.
// M1: icon sprite, grain tile. M6 adds the NY map, M7 the gate bootstrap.
import { buildGrain } from "./build-grain.ts";
import { buildIcons } from "./build-icons.ts";

const generators: { name: string; run: () => Promise<void> }[] = [
  { name: "icons", run: buildIcons },
  { name: "grain", run: buildGrain },
];

for (const g of generators) {
  console.log(`gen: ${g.name}`);
  await g.run();
}
console.log(`gen: ${generators.length} generator(s) run`);
