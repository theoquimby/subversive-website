// One-off (plan §3, NY outline): pull New York State (FIPS 36) out of us-atlas's
// states-10m.json (US Census cartographic boundary, public domain) into a small GeoJSON
// committed at scripts/data/ny-state.geo.json, so builds never need the package or the
// network. TopoJSON arcs are decoded here (quantized, delta-encoded); no library.
//   node scripts/extract-ny.ts
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

type Pos = [number, number];
interface Topology {
  transform: { scale: Pos; translate: Pos };
  arcs: Pos[][];
  objects: { states: { geometries: { id: string; type: string; arcs: number[][] | number[][][] }[] } };
}

const topo = JSON.parse(
  readFileSync(join(root, "node_modules/us-atlas/states-10m.json"), "utf8"),
) as Topology;
const { scale, translate } = topo.transform;

const decoded: Pos[][] = topo.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]] as Pos;
  });
});

function ring(indexes: number[]): Pos[] {
  const out: Pos[] = [];
  for (const i of indexes) {
    const arc = i < 0 ? [...(decoded[~i] ?? [])].reverse() : (decoded[i] ?? []);
    out.push(...(out.length ? arc.slice(1) : arc));
  }
  return out;
}

const ny = topo.objects.states.geometries.find((g) => g.id === "36");
if (!ny) throw new Error("New York (36) not found");
const polygons = (ny.type === "Polygon" ? [ny.arcs as number[][]] : (ny.arcs as number[][][])).map((p) =>
  p.map(ring),
);

const round = (n: number) => Math.round(n * 1e5) / 1e5;
const geo = {
  type: "Feature",
  properties: { name: "New York", source: "us-atlas@3 states-10m.json (US Census, public domain)" },
  geometry: {
    type: "MultiPolygon",
    coordinates: polygons.map((p) => p.map((r) => r.map(([x, y]) => [round(x), round(y)]))),
  },
};
writeFileSync(join(root, "scripts/data/ny-state.geo.json"), `${JSON.stringify(geo)}\n`);
console.log(`ny-state.geo.json: ${polygons.length} polygons`);
