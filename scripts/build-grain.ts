// Paper grain (spec §3.8, plan Q9): a 220 × 220 tiled noise PNG under 6 KB, written with
// Node's zlib (no image library). Seeded, so `pnpm gen` is deterministic and CI can diff it.
// Grains are 2 × 2 px and mostly blank paper: random per-pixel noise does not compress
// under ~40 KB, and at 6% opacity a 2 px grain reads as paper tooth, not pixels.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateSync } from "node:zlib";

const SIZE = 220;
const CELL = 2;

/** Mulberry32: small, seeded, good enough for texture. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

export function grainPng(seed = 2018): Buffer {
  const rand = rng(seed);
  const cells = SIZE / CELL;
  const value = new Uint8Array(cells * cells);
  for (let i = 0; i < value.length; i++) {
    const r = rand();
    // 78% untouched paper, then three densities of speck (multiply darkens; screen lightens)
    value[i] = r < 0.78 ? 255 : r < 0.9 ? 214 : r < 0.97 ? 168 : 112;
  }
  // Greyscale, 8-bit, one filter byte per row ("up" filter for repeated rows)
  const raw = Buffer.alloc(SIZE * (SIZE + 1));
  for (let y = 0; y < SIZE; y++) {
    const rowStart = y * (SIZE + 1);
    const repeat = y % CELL !== 0;
    raw[rowStart] = repeat ? 2 : 0;
    for (let x = 0; x < SIZE; x++) {
      const v = value[Math.floor(y / CELL) * cells + Math.floor(x / CELL)] ?? 255;
      raw[rowStart + 1 + x] = repeat ? 0 : v; // "up": identical to the row above
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export async function buildGrain(): Promise<void> {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const png = grainPng();
  writeFileSync(join(root, "public/brand/grain.png"), png);
  console.log(`grain: ${png.length} bytes`);
}
