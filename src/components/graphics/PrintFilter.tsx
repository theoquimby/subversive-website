// The one shared print filter (spec §3.5): a little turbulence displaces sticker edges so
// they read as die-cut, not computed. Rendered once per document; referenced by id.
export const PRINT_FILTER_ID = "sv-print";

export function PrintFilter() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <filter id={PRINT_FILTER_ID} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="grain" />
        <feDisplacementMap in="SourceGraphic" in2="grain" scale="1.2" />
      </filter>
    </svg>
  );
}
