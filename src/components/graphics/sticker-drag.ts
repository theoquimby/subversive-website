// Pure rules behind sticker dragging (spec §3.5), shared by DraggableSticker and its tests.

/** A press that moved less than this is a tap; more is a drag. */
export const TAP_THRESHOLD = 6;
/** Release spin is proportional to horizontal velocity, clamped. */
export const MAX_RELEASE_DEG = 25;
const DEG_PER_PX_PER_S = 0.02;

export interface Offset {
  x: number;
  y: number;
}

export function isTap(start: Offset, end: Offset): boolean {
  return Math.hypot(end.x - start.x, end.y - start.y) < TAP_THRESHOLD;
}

export function releaseRotation(velocityX: number): number {
  const deg = velocityX * DEG_PER_PX_PER_S;
  return Math.max(-MAX_RELEASE_DEG, Math.min(MAX_RELEASE_DEG, deg));
}

const KEY = (id: string) => `sv.sticker.${id}`;

export interface StoredPlacement extends Offset {
  rotate: number;
}

/** Positions persist for the session only (sessionStorage). Storage may be unavailable. */
export function loadPlacement(id: string): StoredPlacement | null {
  try {
    const raw = window.sessionStorage.getItem(KEY(id));
    if (!raw) return null;
    const v: unknown = JSON.parse(raw);
    if (
      v &&
      typeof v === "object" &&
      "x" in v &&
      "y" in v &&
      "rotate" in v &&
      typeof v.x === "number" &&
      typeof v.y === "number" &&
      typeof v.rotate === "number"
    ) {
      return { x: v.x, y: v.y, rotate: v.rotate };
    }
    return null;
  } catch {
    return null;
  }
}

export function savePlacement(id: string, p: StoredPlacement): void {
  try {
    window.sessionStorage.setItem(KEY(id), JSON.stringify(p));
  } catch {
    // private mode or storage blocked: the sticker simply forgets
  }
}
