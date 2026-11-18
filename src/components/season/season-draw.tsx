// The holiday drawings (second design, Theo 2026-11-16: the first logo touch "looks like a
// mistake", the scattered icons were "poorly placed"; "we need this to be very esthetic").
//   SlashArt   the wordmark's slash becomes the holiday's object, the same size and lean
//              (a candy cane, a candle, an ear of corn, a broom, a rocket...).
//   SceneArt   one small composed scene standing on the footer's ground line.
// Same hand as the pen drawings: one ink weight, colour fills from the tokens, at most a
// few colours per drawing. Styles: fx-season.css (.season-ink, .season-bare, .season-flame).
import type { ReactNode } from "react";
import type { ThemeId } from "@/lib/season/holidays";

type Fill = "ember" | "ember-deep" | "pils" | "gold" | "go" | "sky" | "sky-deep" | "card" | "fg" | "bg";
const fillOf = (f?: Fill) => (f ? { fill: `var(--${f})` } : { fill: "none" });

/** An inked shape: the pen outline, and a fill from the tokens. A shape with no fill is a
 *  pen line; `bare` takes the outline off a filled shape (a flame's core, a stripe). */
function P({ d, f, bare, className }: { d: string; f?: Fill; bare?: boolean; className?: string }) {
  return (
    <path
      d={d}
      style={fillOf(f)}
      className={[bare && f ? "season-bare" : "season-ink", className ?? ""].filter(Boolean).join(" ")}
    />
  );
}

/** an ellipse as a path */
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;

/* ======================= the slash ======================================================
   Drawn upright in a frame of its own: the foot at (0, 0), the top at (0, -114), about 18
   across. SlashArt lays that frame along the wordmark's slash (61° from horizontal, foot
   at the slash's bottom centre), in the slash's own viewBox (0 0 76.43 100). */

const SLASH_ART: Record<ThemeId, ReactNode> = {
  // a candy cane, the crook over the "e"
  christmas: (
    <>
      <path d="M0 -1V-90A13 13 0 0 1 26 -90V-80" className="season-cane season-cane--edge" />
      <path d="M0 -1V-90A13 13 0 0 1 26 -90V-80" className="season-cane season-cane--white" />
      <path d="M0 -1V-90A13 13 0 0 1 26 -90V-80" className="season-cane season-cane--stripe" />
    </>
  ),
  // a candle, lit
  hanukkah: (
    <>
      <P d="M-8 0V-86C-8 -88 -6 -89 -4 -88.5C-1 -87.5 2 -89 4 -88.5C6 -88 8 -88 8 -86V0Z" f="sky" />
      <P d="M-8 -78C-6 -78 -6 -70 -4.5 -70C-3 -70 -3 -78 0 -79" bare />
      <P d="M0 -88.5V-93" />
      <g className="season-flame">
        <P d="M0 -91C-6 -95 -7 -103 0 -116C7 -103 6 -95 0 -91Z" f="pils" />
        <P d="M0 -93.5C-2.6 -96 -2.8 -100 0 -105C2.8 -100 2.6 -96 0 -93.5Z" f="ember" bare />
      </g>
    </>
  ),
  // an ear of corn in its husk
  thanksgiving: (
    <>
      <P d="M-8 -22C-10 -50 -8 -92 0 -114C8 -92 10 -50 8 -22Z" f="pils" />
      <P
        d="M-7 -36H7M-8 -50H8M-8 -64H8M-6.5 -78H6.5M-4.5 -92H4.5M-2 -104H2M-3 -26V-104M3 -26V-104"
        bare
        className="season-kernels"
      />
      <P d="M-1 2C-14 -10 -17 -38 -10 -70C-8 -46 -4 -26 3 -10Z" f="go" />
      <P d="M1 2C14 -10 17 -36 11 -64C8 -42 4 -24 -3 -10Z" f="go" />
    </>
  ),
  // a witch's broom
  halloween: (
    <>
      <P d="M-4 -44V-116H4V-44Z" f="gold" />
      <P d="M-6 -46C-12 -32 -17 -14 -18 0H18C17 -14 12 -32 6 -46Z" f="pils" />
      <P d="M-9 -2L-4 -40M0 -2V-42M9 -2L4 -40" bare />
      <P d="M-7 -40H7V-50H-7Z" f="ember" />
    </>
  ),
  // the Bavarian blue and white, in the slash's own shape
  oktoberfest: null,
  // a rocket on its way up, sparks behind it
  newyear: (
    <>
      <P d="M-2 6L-6 16M2 8V18M5 4L9 13" bare className="season-sparks" />
      <P d="M-7 -6L-15 4L-7 0ZM7 -6L15 4L7 0Z" f="sky" />
      <P d="M-7 2V-86H7V2Z" f="ember" />
      <P d="M-7 -86C-7 -100 -3 -110 0 -116C3 -110 7 -100 7 -86Z" f="card" />
      <P d="M-7 -40H7M-7 -48H7" bare />
    </>
  ),
  // the slash in green, a shamrock at its top
  stpatricks: null,
  // stars and stripes, along the slash
  july4: null,
};

/** A cell of the slash itself: rows up its height, columns across its thickness, so a
 *  pattern follows the slash's own lean (the slash: 21 across, 100 tall, 61°). */
function cell(row0: number, row1: number, col0: number, col1: number): string {
  const off = (y: number) => (100 - y) / Math.tan((61 * Math.PI) / 180);
  const c = (x: number, y: number) => `${(off(y) + x).toFixed(2)} ${y.toFixed(2)}`;
  return `M${c(col0, row0)}L${c(col1, row0)}L${c(col1, row1)}L${c(col0, row1)}Z`;
}

/** slashes that are the slash itself, re-coloured */
function SlashPainted({ theme, outline }: { theme: ThemeId; outline: string }) {
  if (theme === "oktoberfest") {
    // the Bavarian blue and white, as a checker in two columns up the slash
    let blue = "";
    for (let r = 0; r < 8; r++)
      for (let k = 0; k < 2; k++)
        if ((r + k) % 2 === 0) blue += cell(100 - 12.5 * r, 100 - 12.5 * (r + 1), 10.5 * k, 10.5 * (k + 1));
    return (
      <>
        <polygon points={outline} style={{ fill: "var(--card)" }} />
        <path d={blue} style={{ fill: "var(--sky)" }} className="season-bare" />
        <polygon points={outline} className="season-ink" style={{ fill: "none" }} />
      </>
    );
  }
  if (theme === "stpatricks") {
    const leaf = "M0 0C-2 -3 -7 -3.5 -7 -8C-7 -11 -3 -12 0 -9C3 -12 7 -11 7 -8C7 -3.5 2 -3 0 0Z";
    return (
      <>
        <polygon points={outline} style={{ fill: "var(--go)" }} />
        <g transform="translate(62 13) rotate(29)">
          {[0, 120, 240].map((a) => (
            <path
              key={a}
              d={leaf}
              transform={`rotate(${a})`}
              className="season-ink"
              style={{ fill: "var(--card)" }}
            />
          ))}
        </g>
      </>
    );
  }
  // july4: red, white, red up the slash; the blue field with its stars at the top
  const star = (x: number, y: number) => {
    const o = (100 - y) / Math.tan((61 * Math.PI) / 180) + x;
    return ell(o, y, 2.4, 2.4);
  };
  return (
    <>
      <polygon points={outline} style={{ fill: "var(--card)" }} />
      <path
        d={`${cell(100, 36, 0, 7)}${cell(100, 36, 14, 21)}`}
        style={{ fill: "var(--ember)" }}
        className="season-bare"
      />
      <path d={cell(36, 0, 0, 21)} style={{ fill: "var(--sky-deep)" }} className="season-bare" />
      <path
        d={`${star(6, 28)}${star(14, 18)}${star(7, 8)}`}
        style={{ fill: "var(--card)" }}
        className="season-bare"
      />
      <polygon points={outline} className="season-ink" style={{ fill: "none" }} />
    </>
  );
}

/** The holiday's slash, in the wordmark slash's viewBox; `outline` is the slash polygon. */
export function SlashArt({ theme, outline }: { theme: ThemeId; outline: string }) {
  const art = SLASH_ART[theme];
  if (art === null) return <SlashPainted theme={theme} outline={outline} />;
  return <g transform="translate(10.5 100) rotate(29)">{art}</g>;
}

/* ======================= the scene ======================================================
   Pieces standing on the ground: each is drawn with its foot at (0, 0) and up as -y; the
   scene places it at an x offset and the ground line's height there. */

export interface Piece {
  dx: number;
  art: ReactNode;
  /** an extra lean, degrees */
  turn?: number;
  /** things in the air: placed this far above the ground instead of on it */
  lift?: number;
}

const pumpkin = (f: Fill, face?: boolean) => (
  <>
    <P d={ell(-9, -13, 12, 13)} f={f} />
    <P d={ell(9, -13, 12, 13)} f={f} />
    <P d={ell(0, -13.5, 8.5, 13.5)} f={f} />
    <P d="M-2 -26L-2.5 -32C-2.5 -35 0 -37.5 3.5 -37.5L4 -35C2 -35 1.5 -34 1.5 -32L2 -26.5Z" f="fg" />
    <P d="M2 -31C7 -36 11 -31 7 -29" bare />
    {face ? (
      <>
        <P d="M-11 -18L-7 -24L-3 -18ZM3 -18L7 -24L11 -18Z" f="fg" />
        <P d="M-12 -10C-6 -6 6 -6 12 -10L9 -7L6 -9.5L3 -6L0 -8.5L-3 -6L-6 -9.5L-9 -7Z" f="fg" />
      </>
    ) : null}
  </>
);

const leaf = (f: Fill) => (
  <>
    <P d="M0 0C3 -6 11 -8 17 -4C12 1 5 2 0 0Z" f={f} />
    <P d="M0 0C5 -2 10 -3 15 -4" bare />
  </>
);

const tree = (
  <>
    <P d="M-3 0V-9H3V0Z" f="fg" />
    <P d="M0 -66L-11 -48H-5L-17 -30H-9L-22 -9H22L9 -30H17L5 -48H11Z" f="go" />
    <P d="M0 -74L2 -69.5L7 -69L3.2 -66L4.4 -61L0 -63.6L-4.4 -61L-3.2 -66L-7 -69L-2 -69.5Z" f="pils" />
    <P
      d={`${ell(-6, -40, 2.3, 2.3)}${ell(8, -24, 2.3, 2.3)}${ell(-11, -16, 2.3, 2.3)}${ell(3, -52, 2, 2)}`}
      f="ember"
    />
    <P d={`${ell(5, -36, 2, 2)}${ell(-4, -23, 2, 2)}`} f="sky" />
  </>
);

const gift = (box: Fill, ribbon: Fill, w = 22, h = 16) => (
  <>
    <P d={`M${-w / 2} 0V${-h}H${w / 2}V0Z`} f={box} />
    <P d={`M${-w / 2 - 1.5} ${-h}V${-h - 4}H${w / 2 + 1.5}V${-h}Z`} f={box} />
    <P d={`M-2 0V${-h - 4}H2V0Z`} f={ribbon} />
    <P
      d={`M0 ${-h - 4}C-6 ${-h - 11} -11 ${-h - 6} -5 ${-h - 4}ZM0 ${-h - 4}C6 ${-h - 11} 11 ${-h - 6} 5 ${-h - 4}Z`}
      f={ribbon}
    />
  </>
);

const menorah = (() => {
  const xs = [1, 2, 3, 4].map((i) => 6.5 * i);
  const arms = xs.map((r, i) => `M${-r} -40A${r} ${4 + 3 * (i + 1)} 0 0 0 ${r} -40`).join("");
  const cups = [...xs.map((x) => -x), ...xs].map((x) => `M${x - 2.4} -40H${x + 2.4}`).join("");
  const candles = [...xs.map((x) => -x), ...xs];
  return (
    <>
      <P
        d={`M-12 0H12M-11 0C-7 -2 -3 -4 -1.5 -8M11 0C7 -2 3 -4 1.5 -8M0 -8V-48${arms}${cups}M-2.4 -48H2.4`}
        bare
      />
      {candles.map((x) => (
        <g key={x}>
          <P d={`M${x - 1.6} -40V-49H${x + 1.6}V-40Z`} f="sky" />
          <P
            d={`M${x} -50C${x - 2} -52 ${x - 2} -55 ${x} -58C${x + 2} -55 ${x + 2} -52 ${x} -50Z`}
            f="pils"
            className="season-flame"
          />
        </g>
      ))}
      <P d="M-1.6 -48V-58H1.6V-48Z" f="sky" />
      <P d="M0 -59C-2 -61 -2 -64 0 -67C2 -64 2 -61 0 -59Z" f="pils" className="season-flame" />
    </>
  );
})();

const dreidel = (
  <>
    <P d="M-1.4 -20V-27H1.4V-20Z" f="fg" />
    <P d="M-7 -20H7V-9L0 0L-7 -9Z" f="sky-deep" />
    <P d="M-7 -9H7" bare />
  </>
);

const gelt = (
  <>
    <P d={ell(0, -2, 5, 2.2)} f="pils" />
    <P d={ell(7, -2.2, 4.5, 2)} f="gold" />
  </>
);

const bat = (
  <P
    d="M0 0C-3 -3 -7 -3 -10 -1C-9 -4 -11 -6 -14 -6C-11 -3 -12 0 -10 2C-7 0 -3 1 0 3C3 1 7 0 10 2C12 0 11 -3 14 -6C11 -6 9 -4 10 -1C7 -3 3 -3 0 0Z"
    f="fg"
  />
);

const stein = (
  <>
    <P
      d="M8 -22H11C15 -22 16 -19 16 -15C16 -11 15 -8 11 -8H8M8 -19H10.5C12.5 -19 13 -17 13 -15C13 -13 12.5 -11 10.5 -11H8"
      bare
    />
    <P d="M-8 -26H8V-2C8 -0.6 7 0 6 0H-6C-7 0 -8 -0.6 -8 -2Z" f="pils" />
    <P d="M-4 -22V-5M0 -22V-5M4 -22V-5" bare className="season-dim" />
    <P d="M-9 -25C-10.5 -30 -6 -33 -2.5 -31C-1 -34.5 5 -34.5 6.5 -30.5C9.5 -31 10.5 -27 8.5 -25Z" f="card" />
  </>
);

const pretzel = (
  <>
    <path
      d="M-9 -3C-15 -7 -16 -17 -10 -22C-5 -26 0 -21 0 -15C0 -21 5 -26 10 -22C16 -17 15 -7 9 -3M-9 -3C-4 -7 4 -10 8 -15M9 -3C4 -7 -4 -10 -8 -15"
      className="season-dough season-dough--edge"
    />
    <path
      d="M-9 -3C-15 -7 -16 -17 -10 -22C-5 -26 0 -21 0 -15C0 -21 5 -26 10 -22C16 -17 15 -7 9 -3M-9 -3C-4 -7 4 -10 8 -15M9 -3C4 -7 -4 -10 -8 -15"
      className="season-dough"
    />
  </>
);

// the crest off the Festbier label: an ear of barley between two hop leaves, the leaves in
// the label's blue, the kernels cut like the barley mark's
const festSprig = (() => {
  const hopLeaf =
    "M0 0C-3 1.2 -6.5 0 -8.5 -3C-11 -2.6 -13 -5 -12 -8.5L-8 -8.6C-9 -12 -8 -15.5 -5.6 -17.6L-3 -14L0 -21L3 -14L5.6 -17.6C8 -15.5 9 -12 8 -8.6L12 -8.5C13 -5 11 -2.6 8.5 -3C6.5 0 3 1.2 0 0Z";
  const kernels = [-20, -27, -34]
    .map(
      (y) => `M0 ${y}L-5 ${y - 2.5}V${y - 8.5}L0 ${y - 6}ZM0 ${y - 3.5}L5 ${y - 6}V${y - 12}L0 ${y - 9.5}Z`,
    )
    .join("");
  return (
    <>
      <P d="M0 0C0.6 -8 -0.5 -15 0 -22" />
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${side} -13) rotate(${46 * side}) scale(0.88)`}>
          <P d={hopLeaf} f="sky" />
          <P d="M0 -2V-13M0 -7L-5 -10M0 -7L5 -10" />
        </g>
      ))}
      <P d={kernels} f="card" />
      <P d="M0 -43.5V-49" />
    </>
  );
})();

const bottle = (
  <>
    <P d="M-7 0V-24C-7 -30 -3 -32 -2.5 -38V-46H2.5V-38C3 -32 7 -30 7 -24V0Z" f="fg" />
    <P d="M-2.9 -45V-52H2.9V-45Z" f="gold" />
    <P d="M-7 -17H7V-8H-7Z" f="card" />
  </>
);

const coupe = (
  <>
    <P d="M-6 0C-3 -2 3 -2 6 0ZM0 -1.5V-19" />
    <P d="M-10 -26C-10 -18 10 -18 10 -26Z" f="pils" />
    <P d={`${ell(-2, -31, 1.1, 1.1)}${ell(2.5, -35, 1, 1)}${ell(-0.5, -39, 0.9, 0.9)}`} f="card" />
  </>
);

const confetti = (
  <>
    <P d="M-14 -2L-10 -4L-9 -1L-13 1Z" f="ember" />
    <P d="M-2 -10L2 -11L2.5 -8L-1.5 -7Z" f="sky" />
    <P d="M9 0L13 1L12 4L8 3Z" f="go" />
    <P d="M18 -12L21 -10L19 -7L16 -9Z" f="pils" />
    <P d="M-22 -14L-19 -12L-21 -9L-24 -11Z" f="pils" />
  </>
);

const pot = (
  <>
    <P
      d={`${ell(-6, -22.5, 4, 3.5)}${ell(6, -22.5, 4, 3.5)}${ell(0, -25, 4, 3.5)}${ell(-2, -28.5, 3.6, 3.2)}${ell(4, -28, 3.4, 3)}`}
      f="pils"
    />
    <P d="M-12 -18C-15 -8 -10 0 0 0C10 0 15 -8 12 -18Z" f="fg" />
    <P d="M-13.5 -21H13.5V-18H-13.5Z" f="fg" />
  </>
);

const shamrock = (h: number) => {
  const leafD =
    "M0 0C-2 -3 -6.5 -3.5 -6.5 -7.5C-6.5 -10.5 -3 -11.5 0 -8.5C3 -11.5 6.5 -10.5 6.5 -7.5C6.5 -3.5 2 -3 0 0Z";
  return (
    <>
      <P d={`M0 0C0 ${-h / 3} 1.5 ${(-2 * h) / 3} 0 ${-h}`} bare />
      <g transform={`translate(0 ${-h})`}>
        {[0, 120, 240].map((a) => (
          <path
            key={a}
            d={leafD}
            transform={`rotate(${a})`}
            className="season-ink"
            style={{ fill: "var(--go)" }}
          />
        ))}
      </g>
    </>
  );
};

const flag = (
  <>
    <P d="M0 0V-58" bare />
    <P d={ell(0, -60, 2, 2)} f="gold" />
    <P d="M0 -56C8 -59 16 -53 26 -56V-40C16 -37 8 -43 0 -40Z" f="card" />
    <P d="M0 -51C8 -54 16 -48 26 -51M0 -45.5C8 -48.5 16 -42.5 26 -45.5" bare className="season-stripes" />
    <P d="M0 -56C4 -57.5 8 -56.8 11 -55.8V-48.6C8 -49.6 4 -50.2 0 -48.6Z" f="sky-deep" />
  </>
);

const burst = (
  <g className="season-burst">
    <P
      d={Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const c = Math.cos(a);
        const s = Math.sin(a);
        return `M${(4 * c).toFixed(1)} ${(4 * s).toFixed(1)}L${(12 * c).toFixed(1)} ${(12 * s).toFixed(1)}`;
      }).join("")}
      bare
      className="season-rays"
    />
    <P d={ell(0, 0, 1.6, 1.6)} f="pils" />
  </g>
);

export const SCENES: Record<ThemeId, Piece[]> = {
  thanksgiving: [
    { dx: -36, art: leaf("ember"), turn: -4 },
    { dx: -10, art: pumpkin("ember") },
    { dx: 21, art: <g transform="scale(0.62)">{pumpkin("pils")}</g> },
    { dx: 33, art: leaf("pils"), turn: 6 },
  ],
  christmas: [
    { dx: -14, art: tree },
    { dx: 17, art: gift("ember", "pils") },
    { dx: 37, art: gift("sky", "card", 14, 11) },
  ],
  hanukkah: [
    { dx: -10, art: menorah },
    { dx: 30, art: dreidel, turn: 14 },
    { dx: 41, art: gelt },
  ],
  halloween: [
    { dx: -10, art: pumpkin("ember", true) },
    { dx: 21, art: <g transform="scale(0.6)">{pumpkin("ember-deep")}</g> },
    { dx: 8, art: bat, lift: 52 },
  ],
  oktoberfest: [
    { dx: -41, art: festSprig, turn: -3 },
    { dx: -12, art: stein, turn: 8 },
    { dx: 12, art: <g transform="scale(-1 1)">{stein}</g>, turn: -8 },
    { dx: 40, art: pretzel },
  ],
  newyear: [
    { dx: -12, art: bottle, turn: -6 },
    { dx: 16, art: coupe },
    { dx: 0, art: confetti, lift: 58 },
  ],
  stpatricks: [
    { dx: -8, art: pot },
    { dx: 18, art: shamrock(20) },
    { dx: 28, art: shamrock(13), turn: 12 },
  ],
  july4: [
    { dx: -18, art: flag },
    { dx: 22, art: burst, lift: 50 },
    { dx: 34, art: <g transform="scale(0.6)">{burst}</g>, lift: 30 },
  ],
};
