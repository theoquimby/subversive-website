// A string of lights across the top of the night pages (2026-11-15): the wire swags
// between hooks, a bulb hangs at each low point and each rise, and the bulbs glow in the
// menu's yellow, a few of them slowly breathing. It is the tent's string of lights from the
// Visit drawing, hung where "the lights dim". One short unit repeated; no images.
// Decorative, hidden from assistive tech; still with reduced motion.

const UNITS = Array.from({ length: 14 }, (_, i) => `u${i}`);

export function Lights({ className }: { className?: string }) {
  return (
    <div className={className ? `lights ${className}` : "lights"} aria-hidden="true">
      {UNITS.map((k) => (
        <svg key={k} viewBox="0 0 132 46" className="lights__unit" focusable="false">
          {/* the wire: hook to hook, sagging a little differently on each side of the middle */}
          <path className="lights__wire" d="M0 7C22 29 44 30 66 8C88 30 112 28 132 7" />
          {/* three bulbs: a short stem and a drop of glass */}
          <g className="lights__bulb">
            <path className="lights__stem" d="M22 23.5V27" />
            <path d="M22 27C19.2 28.8 18.6 33.4 22 36.2C25.4 33.4 24.8 28.8 22 27Z" />
          </g>
          <g className="lights__bulb">
            <path className="lights__stem" d="M66 8.5V12" />
            <path d="M66 12C63.2 13.8 62.6 18.4 66 21.2C69.4 18.4 68.8 13.8 66 12Z" />
          </g>
          <g className="lights__bulb">
            <path className="lights__stem" d="M108 24V27.5" />
            <path d="M108 27.5C105.2 29.3 104.6 33.9 108 36.7C111.4 33.9 110.8 29.3 108 27.5Z" />
          </g>
        </svg>
      ))}
    </div>
  );
}
