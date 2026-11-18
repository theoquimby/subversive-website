"use client";

// A can you can spin. The can is ours, in pen: the lid, the tab, the shoulders, a few
// hatch lines for its roundness. The label is Max's own art, untouched, wrapped round it:
// the front slides behind the pen outline as the can turns, then the plain back of the
// wrap, then the front again. A flick spins it with momentum; it slows by friction and
// settles face-forward on a soft detent. It turns once when it first comes into view.
// A beer with no label yet wears the house can: its name over a band of its own colour.
// One loop per can (src/lib/motion/loop.ts): asleep off screen and at rest, none with
// reduced motion (the can then simply faces front; a drag still turns it by hand).
// Decorative: hidden from assistive tech. Styles: fx-can.css.
import type { Label } from "@content/labels";
import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";
import { createLoop, type Loop } from "@/lib/motion/loop";
import { KERNELS } from "../graphics/BarleyMark";

/** the wrap is this many times the can's visible width: a turn shows all of it */
const WRAP = 3.1;
const FRICTION = 1.6; // per second
const DETENT = 26; // spring to face front, per second squared
const REST = 0.004;

interface Props {
  /** Max's label, or none for the house can */
  label?: Label;
  name: string;
  /** the beer's colour: the house can's band */
  color?: string;
  /** turn once on first sight */
  greet?: boolean;
  /** let the label's own parts move, where it has a live file (the beer sheet's can) */
  alive?: boolean;
  className?: string;
}

export function Can({ label, name, color, greet = true, alive = false, className }: Props) {
  const root = useRef<HTMLSpanElement>(null);
  const strip = useRef<HTMLSpanElement>(null);
  const state = useRef({ t: 0, v: 0, held: false, x: 0, at: 0, loop: null as Loop | null });

  useEffect(() => {
    const el = root.current;
    const band = strip.current;
    if (!el || !band) return;
    const s = state.current;
    const draw = () => {
      const turn = s.t - Math.floor(s.t);
      band.style.transform = `translate3d(${-turn * 50}%,0,0)`;
    };
    const loop = createLoop(el, (dt) => {
      if (s.held) return false;
      // friction, and a detent that pulls the face forward once the spin is slow
      const near = Math.round(s.t);
      const slow = Math.abs(s.v) < 0.9;
      const pull = slow ? (near - s.t) * DETENT : 0;
      s.v += (pull - s.v * (slow ? 7 : FRICTION)) * dt;
      s.t += s.v * dt;
      if (slow && Math.abs(s.v) < REST && Math.abs(near - s.t) < REST) {
        s.t = 0;
        s.v = 0;
        draw();
        return false;
      }
      draw();
      return true;
    });
    s.loop = loop;
    draw();
    let greeted = !greet;
    const seen = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting || greeted) return;
      greeted = true;
      s.v = 1.9; // about one turn
      loop.wake();
    });
    seen.observe(el);
    return () => {
      seen.disconnect();
      loop.stop();
      s.loop = null;
    };
  }, [greet]);

  // the moving label loads only where motion is welcome: not with reduced motion, not
  // while Pause motion is on (the file's own loops cannot be paused from the page)
  const [moving, setMoving] = useState(false);
  const live = alive ? label?.live : undefined;
  useEffect(() => {
    if (!live) return;
    const calm =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "paused";
    setMoving(!calm);
  }, [live]);
  const art = moving && live ? live : label?.src;

  const down = (e: PointerEvent<HTMLSpanElement>) => {
    const s = state.current;
    s.held = true;
    s.x = e.clientX;
    s.at = performance.now();
    s.v = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLSpanElement>) => {
    const s = state.current;
    if (!s.held) return;
    const now = performance.now();
    // a drag across the can's face is that much of the wrap
    const width = root.current?.getBoundingClientRect().width || 1;
    const by = -(e.clientX - s.x) / (width * WRAP);
    const secs = Math.max(0.008, (now - s.at) / 1000);
    s.v = s.v * 0.6 + (by / secs) * 0.4;
    s.t += by;
    s.x = e.clientX;
    s.at = now;
    const turn = s.t - Math.floor(s.t);
    if (strip.current) strip.current.style.transform = `translate3d(${-turn * 50}%,0,0)`;
  };
  const up = () => {
    const s = state.current;
    if (!s.held) return;
    s.held = false;
    if (performance.now() - s.at > 120) s.v = 0; // held still, then let go: no fling
    s.v = Math.max(-6, Math.min(6, s.v));
    s.loop?.wake();
  };

  // the front's width as a share of the whole wrap (the body is 9.4 wide and 15 tall)
  const front = label ? Math.min(0.62, (label.ratio * (15 / 9.4)) / WRAP) : 0.46;
  const look = {
    "--can-bg": label?.bg ?? "var(--card)",
    "--can-ink": label?.on === "light" ? "var(--bone)" : "var(--ink)",
    "--can-front": front,
    "--can-beer": color ?? "var(--pils)",
  } as CSSProperties;

  const face = (key: string) => (
    <span key={key} className="can__turn">
      {label ? (
        // biome-ignore lint/performance/noImgElement: an SVG file, drawn as it is
        <img className="can__label" src={art} alt="" loading="lazy" decoding="async" draggable={false} />
      ) : (
        <span className="can__house">
          <span className="can__house-name">{name}</span>
        </span>
      )}
      <span className="can__back">
        <svg viewBox="0 0 60 170" className="can__barley" focusable="false">
          {KERNELS.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </span>
    </span>
  );

  return (
    <span
      ref={root}
      className={["can", label ? "" : "can--house", className ?? ""].filter(Boolean).join(" ")}
      style={look}
      aria-hidden="true"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <span className="can__wrap">
        {/* the wrap, twice over, so it never runs out as it slides */}
        <span ref={strip} className="can__strip">
          {face("a")}
          {face("b")}
        </span>
        <span className="can__round" />
      </span>
      <svg viewBox="0 0 100 190" className="can__pen" focusable="false">
        {/* shoulders, from the lid down to the body */}
        <path
          d="M14 13C13 19 7 22 3 27.5H97C93 22 87 19 86 13C86 17.5 70 20.5 50 20.5S14 17.5 14 13Z"
          className="can__metal"
        />
        {/* lid and tab */}
        <path
          d="M14 13C14 8.5 30 5.5 50 5.5S86 8.5 86 13S70 20.5 50 20.5S14 17.5 14 13Z"
          className="can__metal"
        />
        <path d="M41 12.6C41 10.6 45 9.4 50 9.4S59 10.6 59 12.6S55 15.8 50 15.8S41 14.6 41 12.6ZM47 12.4h6" />
        {/* the body's two sides and its foot */}
        <path d="M3 27.5C2.2 70 2.4 130 3 177.5M97 27.5C97.8 70 97.6 130 97 177.5" />
        <path
          d="M3 177.5C5 182 9 185 14 186.2C36 188.6 64 188.6 86 186.2C91 185 95 182 97 177.5Z"
          className="can__metal"
        />
        {/* roundness, in hatch: short strokes down the far side, one long light on the near */}
        <path d="M90.5 40V160M86 52V150M93.8 60V120" className="can__hatch" />
        <path d="M10.5 38C10 80 10 130 10.6 166" className="can__shine" />
      </svg>
    </span>
  );
}
