// `pnpm gen`: every build-time generator, run in order (plan §4). CI runs `pnpm gen` and then
// `git diff --exit-code`, so generated files can never drift from their sources.
// M0 has none yet. M1 adds the icon sprite and grain tile, M6 the NY map, M7 the gate bootstrap.
const generators: { name: string; run: () => Promise<void> }[] = [];

for (const g of generators) {
  console.log(`gen: ${g.name}`);
  await g.run();
}
console.log(`gen: ${generators.length} generator(s) run`);
