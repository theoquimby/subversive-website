"use client";

// A can you can spin. The can is ours, in pen: the lid, the tab, the shoulders, a few
// hatch lines for its roundness. The label is Max's own art, untouched, wrapped round it:
// the front slides behind the pen outline as the can turns, then the plain back of the
// wrap, then the front again. It turns only when asked (Theo, 2026-11-18): a drag or a
// flick spins it with momentum, slowing by friction to a soft detent face-forward, and a
// phone leaned to one side turns it a little that way.
// A beer with no label yet wears the house can: its name over a band of its own colour.
// One loop per can (src/lib/motion/loop.ts): asleep off screen and at rest, none with
// reduced motion (the can then simply faces front; a drag still turns it by hand).
// Decorative: hidden from assistive tech. Styles: fx-can.css.
import type { Label } from "@content/labels";
import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";
import { createLoop, type Loop } from "@/lib/motion/loop";
import { onTilt } from "@/lib/motion/tilt";
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
  /** the tab is lifted and the mouth open (the beer sheet's pour) */
  open?: boolean;
  /** let the label's own parts move, where it has a live file (the beer sheet's can) */
  alive?: boolean;
  className?: string;
}

export function Can({ label, name, color, open = false, alive = false, className }: Props) {
  const root = useRef<HTMLSpanElement>(null);
  const strip = useRef<HTMLSpanElement>(null);
  const state = useRef({ t: 0, v: 0, lean: 0, held: false, x: 0, at: 0, loop: null as Loop | null });

  useEffect(() => {
    const el = root.current;
    const band = strip.current;
    if (!el || !band) return;
    const s = state.current;
    const draw = () => {
      const turn = s.t - Math.floor(s.t);
      band.style.transform = `translateX(${(-turn * 50).toFixed(3)}%)`;
    };
    const loop = createLoop(el, (dt) => {
      if (s.held) return false;
      // friction, and a detent that pulls the face forward once the spin is slow
      const near = Math.round(s.t - s.lean) + s.lean;
      const slow = Math.abs(s.v) < 0.9;
      const pull = slow ? (near - s.t) * DETENT : 0;
      s.v += (pull - s.v * (slow ? 7 : FRICTION)) * dt;
      s.t += s.v * dt;
      if (slow && Math.abs(s.v) < REST && Math.abs(near - s.t) < REST) {
        s.t = s.lean;
        s.v = 0;
        draw();
        return false;
      }
      draw();
      return true;
    });
    s.loop = loop;
    draw();
    // a phone leaned to one side shows a little more of that side of the label
    const offTilt = onTilt((rad) => {
      s.lean = (rad / 0.45) * 0.09;
      loop.wake();
    });
    return () => {
      offTilt();
      loop.stop();
      s.loop = null;
    };
  }, []);

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
    if (strip.current) strip.current.style.transform = `translateX(${(-turn * 50).toFixed(3)}%)`;
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
      data-open={open ? "" : undefined}
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
        {/* the mouth, dark once the tab is lifted; the tab stands up on its rivet */}
        <path
          d="M40 13.4C40 11.6 44 10.6 49 10.6S57 11.6 57 13.4S53 16.4 49 16.4S40 15.2 40 13.4Z"
          className="can__mouth"
        />
        <path
          d="M49 12.4C49 10.9 52.5 10 56.5 10S64 10.9 64 12.4S60.5 14.8 56.5 14.8S49 13.9 49 12.4ZM54 12.3h5"
          className="can__tab"
        />
        {/* the hiss as it opens: three short pen ticks */}
        <path d="M44 3.5L41.5 -3M50 2.5V-4.5M56 3.5L58.5 -3" className="can__hiss" />
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
