# scripts/data

`ny-state.geo.json`: New York State (FIPS 36), extracted by `scripts/extract-ny.ts` from
`us-atlas@3` `states-10m.json` on 2026-11-13. Source: US Census Bureau cartographic
boundary files, via us-atlas (ISC licence for the packaging; the data is public domain).
Committed so builds never need the network. `scripts/build-ny-map.ts` turns it into
`src/components/graphics/ny-map.generated.ts` on every `pnpm gen`.
