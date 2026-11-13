// Contrast maths for the token test (spec §2.1, plan M0 item 9). Pure, no DOM.

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function parseHex(hex: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) throw new Error(`Not a #RRGGBB colour: ${hex}`);
  const n = Number.parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function toHex({ r, g, b }: Rgb): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

/** fg at `alpha` over an opaque bg, mixed in sRGB as browsers paint it. */
export function composite(fg: string, alpha: number, bg: string): string {
  const f = parseHex(fg);
  const b = parseHex(bg);
  const mix = (x: number, y: number) => x * alpha + y * (1 - alpha);
  return toHex({ r: mix(f.r, b.r), g: mix(f.g, b.g), b: mix(f.b, b.b) });
}

function linear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function wcagRatio(fg: string, bg: string): number {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

// APCA 0.0.98G-4g (W3 / Myndex reference constants).
function apcaY(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const ch = (v: number) => (v / 255) ** 2.4;
  const y = 0.2126729 * ch(r) + 0.7151522 * ch(g) + 0.072175 * ch(b);
  // biome-ignore lint/suspicious/noApproximativeNumericConstant: 1.414 is APCA's published blkClmp exponent, not √2.
  return y < 0.022 ? y + (0.022 - y) ** 1.414 : y;
}

/** Signed Lc: positive for dark text on light, negative for light on dark. */
export function apcaLc(fg: string, bg: string): number {
  const yt = apcaY(fg);
  const yb = apcaY(bg);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  if (yb > yt) {
    const sapc = (yb ** 0.56 - yt ** 0.57) * 1.14;
    return sapc < 0.1 ? 0 : (sapc - 0.027) * 100;
  }
  const sapc = (yb ** 0.65 - yt ** 0.62) * 1.14;
  return sapc > -0.1 ? 0 : (sapc + 0.027) * 100;
}
