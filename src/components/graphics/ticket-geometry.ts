// The torn perforation (spec §3.6): the stub's right edge as a zigzag clip-path.

const pct = (n: number) => `${Math.round(n * 10000) / 100}%`;

export function zigzagEdge({ teeth = 9, depth = 6 }: { teeth?: number; depth?: number } = {}): string {
  const pts = ["0 0", "100% 0"];
  for (let i = 0; i < teeth; i++) {
    pts.push(`calc(100% - ${depth}px) ${pct((i + 0.5) / teeth)}`);
    pts.push(`100% ${pct((i + 1) / teeth)}`);
  }
  pts.push("0 100%");
  return `polygon(${pts.join(", ")})`;
}
