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
  /** being carried: no answer to the phone's lean, no moving label (the beer sheet's pour) */
  frozen?: boolean;
  /** let the label's own parts move, where it has a live file (the beer sheet's can) */
  alive?: boolean;
  className?: string;
}

export function Can({ label, name, color, open = false, alive = false, frozen = false, className }: Props) {
  const root = useRef<HTMLSpanElement>(null);
  const strip = useRef<HTMLSpanElement>(null);
  const held = useRef(frozen);
  held.current = frozen;
  const state = useRef({
    t: 0,
    v: 0,
    lean: 0,
    dragged: 0,
    held: false,
    x: 0,
    at: 0,
    loop: null as Loop | null,
  });

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
      if (held.current) return;
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
  const art = moving && live && !frozen ? live : label?.src;

  // Carried, the can shows a picture of its label, drawn once: a label is hundreds of
  // shapes, and as the live file it was drawn again on every frame the can moved (the
  // pour ran at 37 frames a second for it). Set down, the real label is back.
  const still = useRef<HTMLCanvasElement>(null);
  const [pictured, setPictured] = useState(false);
  useEffect(() => {
    const canvas = still.current;
    const wrap = canvas?.parentElement;
    if (!frozen || !label || !canvas || !wrap) {
      setPictured(false);
      return;
    }
    let on = true;
    const img = new Image();
    img.onload = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const k = Math.min(3, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * k);
      canvas.height = Math.round(h * k);
      const ctx = canvas.getContext("2d");
      if (!on || !ctx) return;
      ctx.scale(k, k);
      ctx.fillStyle = label.bg;
      ctx.fillRect(0, 0, w, h);
      // as it stands on the can: the front, full height, centred
      const iw = h * label.ratio;
      ctx.drawImage(img, (w - iw) / 2, 0, iw, h);
      setPictured(true);
    };
    img.src = label.src;
    return () => {
      on = false;
    };
  }, [frozen, label]);

  const down = (e: PointerEvent<HTMLSpanElement>) => {
    const s = state.current;
    s.held = true;
    s.dragged = 0;
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
    s.dragged += Math.abs(e.clientX - s.x);
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

  // the front's width as a share of the whole wrap (a tall can: the body is 9.4 wide and
  // 18.85 tall, the proportions of the 16 oz cans in Max's photos)
  const front = label ? Math.min(0.75, (label.ratio * (18.85 / 9.4)) / WRAP) : 0.46;
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
      data-pictured={pictured ? "" : undefined}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      // a can inside a link: a spin is not a tap
      onClickCapture={(e) => {
        if (state.current.dragged > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <span className="can__wrap">
        {/* the wrap, twice over, so it never runs out as it slides */}
        <span ref={strip} className="can__strip">
          {face("a")}
          {face("b")}
        </span>
        <canvas ref={still} className="can__still" />
        <span className="can__round" />
      </span>
      <svg viewBox="0 0 100 235" className="can__pen" focusable="false">
        {/* A tall can, drawn the way one is built: a narrow rolled rim, the neck swelling
            out to the body, the body, and the foot tucking back in to a base ring. */}
        {/* the neck: from under the rim out to the shoulders */}
        <path
          d="M12.5 10.5C12.5 17 4.5 20.5 3 30.5H97C95.5 20.5 87.5 17 87.5 10.5C87.5 14.5 70.5 17 50 17S12.5 14.5 12.5 10.5Z"
          className="can__metal"
        />
        <path d="M9 23.5C22 26.2 78 26.2 91 23.5" className="can__hatch" />
        {/* the rim, and the lid's panel set down inside it */}
        <path
          d="M12.5 10.5C12.5 6.8 29.3 4 50 4S87.5 6.8 87.5 10.5S70.7 17 50 17S12.5 14.2 12.5 10.5Z"
          className="can__metal"
        />
        <path
          d="M17.5 10.6C17.5 7.8 32 5.8 50 5.8S82.5 7.8 82.5 10.6S68 15.3 50 15.3S17.5 13.4 17.5 10.6Z"
          className="can__thin"
        />
        {/* the mouth, dark once the tab is lifted; the tab on its rivet */}
        <path
          d="M27 11C27 9.4 31.5 8.3 37 8.3S47 9.4 47 11S42.5 13.6 37 13.6S27 12.6 27 11Z"
          className="can__mouth"
        />
        <path
          d="M43 10.5C43 9 47.5 8 53 8S63 9 63 10.5S58.5 13 53 13S43 12 43 10.5ZM54 10.5h5.5"
          className="can__tab"
        />
        {/* the hiss as it opens: three short pen ticks */}
        <path d="M30 2L27 -4.5M37 1V-6M44 2L47 -4.5" className="can__hiss" />
        {/* the body's two sides */}
        <path d="M3 30.5C2.3 85 2.4 165 3 219M97 30.5C97.7 85 97.6 165 97 219" />
        {/* the foot: tucked in, standing on its base ring */}
        <path
          d="M3 219C3.6 224.5 8 228.8 15 230.3C37 233 63 233 85 230.3C92 228.8 96.4 224.5 97 219Z"
          className="can__metal"
        />
        <path d="M17 230.6C38 228.900 62 228.900 83 230.6" className="can__thin" />
        {/* roundness, in hatch: short strokes down the far side, one long light on the near */}
        <path d="M90.5 44V204M86.5 60V188M93.8 70V150" className="can__hatch" />
        <path d="M10.5 42C10 98 10 165 10.6 208" className="can__shine" />
      </svg>
    </span>
  );
}
