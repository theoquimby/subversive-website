// /dev/kit motion sheets for the M1 set pieces: pill stamp, sticker pop-in, peel, glass
// fill, ticket tear. Values mirror graphics.css exactly; durations and curves come from
// lib/motion/curves.
import menu from "@content/menu.json";
import { GlassGlyph } from "@/components/graphics/GlassGlyph";
import { Sticker } from "@/components/graphics/Sticker";
import { Pill } from "@/components/layout/Pill";
import { CURVES, SPRINGS, springToLinear } from "@/lib/motion/curves";
import { MotionSheet, type SheetSpec } from "./MotionSheet";

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const spring = springToLinear(SPRINGS.sticker);
const pils = menu.drinks[0]?.groups[0]?.items[0] as { color?: string } | undefined;
const section = menu.food[0]?.title ?? "";

const sheets: SheetSpec[] = [
  {
    name: "Pill stamp",
    job: "A section pill lands as it scrolls in",
    durationMs: 220,
    easing: { bezier: CURVES.stamp.values, token: "--ease-stamp" },
    value: (p) => lerp(1.12, 1, p),
    unit: "×",
    draw: (p) => (
      <span
        className="motion-sheet__obj"
        style={{ scale: String(lerp(1.12, 1, p)), rotate: `${lerp(-2, 0, p)}deg`, transformOrigin: "0 100%" }}
      >
        <Pill as="h3" stamp={false}>
          {section.split(" ")[0]}
        </Pill>
      </span>
    ),
  },
  {
    name: "Sticker pop-in",
    job: "Scale 0 → 1, rotation settles from +14° to its resting −3°",
    durationMs: spring.duration,
    easing: { spring: spring.points, token: "--spring-sticker" },
    value: (p) => p,
    unit: "×",
    draw: (p) => (
      <span
        className="motion-sheet__obj"
        // the sticker rests at −3° itself; +17° here starts it at +14° overall
        style={{ scale: String(Math.max(0, p)), rotate: `${lerp(17, 0, p)}deg` }}
      >
        <Sticker shape="burst" label="Tonight" pop={false} className="motion-sheet__sticker">
          Tonight
        </Sticker>
      </span>
    ),
  },
  {
    name: "Peel",
    job: "Hover or focus: the bottom-right corner lifts",
    durationMs: 180,
    easing: { bezier: CURVES.out.values, token: "--ease-out" },
    value: (p) => lerp(0, 26, p),
    unit: "%",
    draw: (p) => (
      <span
        className="motion-sheet__peel"
        style={{
          clipPath: `polygon(0 0, 100% 0, 100% ${100 - 26 * p}%, ${100 - 26 * p}% 100%, 0 100%)`,
        }}
      />
    ),
  },
  {
    name: "Glass fill",
    job: "The pour rises from the bottom of the glass",
    durationMs: 800,
    easing: { bezier: CURVES.out.values, token: "--ease-out" },
    value: (p) => lerp(0, 100, p),
    unit: "%",
    draw: (p) => (
      <GlassGlyph color={pils?.color ?? ""} fill={Math.max(0.001, p)} className="motion-sheet__glass" />
    ),
  },
  {
    name: "Ticket tear",
    job: "On the event page the stub tears off once and stays",
    durationMs: 420,
    easing: { bezier: CURVES.stamp.values, token: "--ease-stamp" },
    value: (p) => lerp(0, -14, p),
    unit: "px",
    draw: (p) => (
      <span className="motion-sheet__tear">
        <span
          className="motion-sheet__stub"
          style={{ translate: `${lerp(0, -14, p)}px ${lerp(0, 4, p)}px`, rotate: `${lerp(0, -6, p)}deg` }}
        />
        <span className="motion-sheet__ticket" />
      </span>
    ),
  },
];

// M2: the page wipe and the mobile menu share one geometry — an edge at 61° crossing the
// viewport. Drawn at 390 × 844: the edge travels 844 / tan 61° + 390 = 858 px in all.
const RUN = 844 / Math.tan((61 * Math.PI) / 180);
const wipeX = (p: number) => lerp(-RUN, 390, p);
sheets.push(
  {
    name: "Page wipe (forward)",
    job: "The old page is cut away up and to the right; the new one is already beneath",
    durationMs: 420,
    easing: { bezier: CURVES.inOut.values, token: "--ease-in-out" },
    value: (p) => wipeX(p),
    unit: "px",
    draw: (p) => (
      <span className="motion-sheet__screen">
        <span
          className="motion-sheet__old"
          style={{
            clipPath: `polygon(${((wipeX(p) + RUN) / 390) * 100}% 0, 100% 0, 100% 100%, ${(wipeX(p) / 390) * 100}% 100%)`,
          }}
        />
      </span>
    ),
  },
  {
    name: "Mobile menu",
    job: "The sheet wipes in from the top right along the slash",
    durationMs: 420,
    easing: { bezier: CURVES.inOut.values, token: "--ease-in-out" },
    value: (p) => lerp(390, -RUN, p),
    unit: "px",
    draw: (p) => {
      const x = lerp(390, -RUN, p);
      return (
        <span className="motion-sheet__screen">
          <span
            className="motion-sheet__sheet"
            style={{
              clipPath: `polygon(${((x + RUN) / 390) * 100}% 0, 100% 0, 100% 100%, ${(x / 390) * 100}% 100%)`,
            }}
          />
        </span>
      );
    },
  },
);

export function KitMotion() {
  return (
    <div className="kit-sheets">
      {sheets.map((s) => (
        <MotionSheet key={s.name} spec={s} />
      ))}
    </div>
  );
}
