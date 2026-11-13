// Checker rail (spec §3.2): the top and bottom edge of the printed menu. Pure CSS; the
// roll on scroll lives in graphics.css. Decorative, so hidden from assistive tech.
export function Checker({ className }: { className?: string }) {
  return (
    <div className={className ? `checker ${className}` : "checker"} aria-hidden="true" data-checker="" />
  );
}
