// Prices print as the printed menu prints them (spec §2.3): no dollar sign, whole numbers
// bare, cents only when there are cents, and a pair as "5 / 8" with thin spaces.
export function formatPrice(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function formatPair(half: number, full: number): string {
  return `${formatPrice(half)} / ${formatPrice(full)}`;
}
