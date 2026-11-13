// Checker rail (spec §3.2): the top and bottom edge of the printed menu. Pure CSS; the
// roll on scroll lives in graphics.css. Decorative, so hidden from assistive tech.
// rows: 2 as printed (footer); 1 at the very top of the page, where two rows above the
// header read heavy (M2 review, "refined, not diner").
export function Checker({ className, rows = 2 }: { className?: string; rows?: 1 | 2 }) {
  return (
    <div
      className={className ? `checker ${className}` : "checker"}
      data-rows={rows}
      aria-hidden="true"
      data-checker=""
    />
  );
}
