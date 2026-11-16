// A featured event's photograph is shown only when it is served from the Ops origin
// (NEXT_PUBLIC_OPS_ORIGIN), the one outside image host next.config.ts allows for it.
export function opsImage(src: string | null | undefined, opsOrigin: string): string | null {
  if (!src || !opsOrigin) return null;
  try {
    return new URL(src).origin === new URL(opsOrigin).origin ? src : null;
  } catch {
    return null;
  }
}
