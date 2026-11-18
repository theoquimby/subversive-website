"use client";

// A can you can spin. The can is ours, in pen: the lid, the tab, the shoulders, a few
// hatch lines for its roundness. The label is Max's own art, untouched, wrapped round it:
// the front slides behind the pen outline as the can turns, then the plain back of the
// wrap, then the front again. It turns only when it is dragged (Theo, 2026-11-18): a drag
// or a flick spins it with momentum, slowing by friction to a soft detent face-forward.
// A beer with no label yet wears the house can: its name over a band of its own colour.
// Cheap to move (Theo: "janky... bad frame rate"): a label is hundreds of vector shapes,
// so it is drawn once, to a small canvas at the screen's own resolution, when the can
// first comes into view; turning the can then only slides a picture. Nothing listens to
// the phone's lean (that slid, and so redrew, every can on the page all the time).
// Three labels have parts that move (Max: "fun to have like beer labels animated"; the
// pickle rocks, the monarchs flutter, the stars twinkle). Motion inside the label's own
// file redrew all of it on every step, so the label comes cut in layers instead
// (scripts/label_motion.py): each part is drawn once, to a small canvas of its own over
// the label, and after that CSS only moves or fades those pictures (fx-can.css). Only a
// can told it may (`alive`: the beer view's) loads the layers; every other can is still,
// and that one shows the plain label too whenever its parts are not playing.
// One loop per can (src/lib/motion/loop.ts): asleep off screen and at rest, none with
// reduced motion (the can then simply faces front; a drag still turns it by hand).
// Decorative: hidden from assistive tech. Styles: fx-can.css.
import type { Label, LabelPart } from "@content/labels";
import { type CSSProperties, type PointerEvent, useEffect, useRef } from "react";
import { createLoop, type Loop } from "@/lib/motion/loop";
import { KERNELS } from "../graphics/BarleyMark";

/** the wrap is this many times the can's visible width: a turn shows all of it */
const WRAP = 3.1;
const FRICTION = 1.6; // per second
const DETENT = 26; // spring to face front, per second squared
const REST = 0.004;

/** a part's own place in the beat, and its own beat, where the label gives one */
const beat = (p: LabelPart): CSSProperties => ({
  animationDelay: p.delay ? `${p.delay}s` : undefined,
  animationDuration: p.time ? `${p.time}s` : undefined,
});

interface Props {
  /** Max's label, or none for the house can */
  label?: Label;
  name: string;
  /** the beer's colour: the house can's band */
  color?: string;
  /** the tab is lifted and the mouth open (the beer sheet's pour) */
  open?: boolean;
  /** the label's parts move while this is true and hold still while it is false (the can
   *  is being carried). Left out, the can is a still one and never loads the layers. */
  alive?: boolean;
  className?: string;
}

export function Can({ label, name, color, open = false, alive, className }: Props) {
  const root = useRef<HTMLSpanElement>(null);
  const strip = useRef<HTMLSpanElement>(null);
  const state = useRef({
    t: 0,
    v: 0,
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
      const near = Math.round(s.t);
      const slow = Math.abs(s.v) < 0.9;
      const pull = slow ? (near - s.t) * DETENT : 0;
      s.v += (pull - s.v * (slow ? 7 : FRICTION)) * dt;
      s.t += s.v * dt;
      if (slow && Math.abs(s.v) < REST && Math.abs(near - s.t) < REST) {
        s.t = 0;
        s.v = 0;
        draw();
        band.style.willChange = "";
        return false;
      }
      draw();
      return true;
    });
    s.loop = loop;
    draw();
    return () => {
      loop.stop();
      s.loop = null;
    };
  }, []);

  // the label, drawn once into its canvases (one for each turn of the wrap) when the can
  // first comes near the screen, and again if the can changes size.
  // A label in layers has, over that picture, the label without its parts and each layer
  // off the sheet in a canvas of its own. They are shown only while the parts play: a
  // browser rounds every box to the screen by itself, so a stack of boxes can sit a pixel
  // off the one picture; at rest the can shows the one picture, the same as any other can.
  // The stack is set on whole pixels of its own canvas to keep it as close as it can be.
  const cut = alive === undefined ? undefined : label?.parts;
  const src = label?.src;
  useEffect(() => {
    const el = root.current;
    if (!el || !src) return;
    let img: HTMLImageElement | undefined;
    let under: HTMLImageElement | undefined;
    let sheet: HTMLImageElement | undefined;
    const ready = (i?: HTMLImageElement): i is HTMLImageElement => !!i?.complete && !!i.naturalWidth;
    const paint = () => {
      const k = Math.min(3, window.devicePixelRatio || 1);
      let first: HTMLCanvasElement[] | undefined;
      for (const c of el.querySelectorAll<HTMLCanvasElement>("canvas.can__label")) {
        const w = Math.round(c.clientWidth * k);
        const h = Math.round(c.clientHeight * k);
        if (!w || !h) continue;
        if (ready(img) && !(c.width === w && c.height === h && c.dataset.done === src)) {
          c.width = w;
          c.height = h;
          c.getContext("2d")?.drawImage(img, 0, 0, w, h);
          c.dataset.done = src;
        }
        const base = cut && c.parentElement?.querySelector<HTMLCanvasElement>("canvas.can__base");
        if (!cut || !base || !ready(under) || !ready(sheet)) continue;
        if (base.width === w && base.height === h && base.dataset.done) continue;
        base.width = w;
        base.height = h;
        base.style.width = `${w / k}px`;
        base.style.height = `${h / k}px`;
        base.getContext("2d")?.drawImage(under, 0, 0, w, h);
        base.dataset.done = "1";
        const layers = [
          ...(base.parentElement?.querySelectorAll<HTMLCanvasElement>("canvas.can__part") ?? []),
        ];
        const sx = w / cut.view[0];
        const sy = h / cut.view[1];
        for (const [i, p] of cut.list.entries()) {
          const pc = layers[i];
          if (!pc) continue;
          // the layer's box, out to whole pixels of the label's canvas
          const [x, y, bw, bh] = p.box;
          const x0 = Math.floor(x * sx);
          const y0 = Math.floor(y * sy);
          pc.width = Math.ceil((x + bw) * sx) - x0;
          pc.height = Math.ceil((y + bh) * sy) - y0;
          pc.style.left = `${x0 / k}px`;
          pc.style.top = `${y0 / k}px`;
          pc.style.width = `${pc.width / k}px`;
          pc.style.height = `${pc.height / k}px`;
          if (p.origin) {
            const ox = ((p.origin[0] * sx - x0) / pc.width) * 100;
            const oy = ((p.origin[1] * sy - y0) / pc.height) * 100;
            pc.style.transformOrigin = `${ox.toFixed(2)}% ${oy.toFixed(2)}%`;
          }
          const to = pc.getContext("2d");
          // the second turn of the wrap copies the first: the sheet is drawn once a layer
          const twin = first?.[i];
          if (twin && twin.width === pc.width && twin.height === pc.height) to?.drawImage(twin, 0, 0);
          else
            to?.drawImage(
              sheet,
              (x - p.at[0]) * sx - x0,
              (y - p.at[1]) * sy - y0,
              cut.size[0] * sx,
              cut.size[1] * sy,
            );
        }
        first ??= layers;
      }
    };
    const size = new ResizeObserver(paint);
    const load = (from: string) => {
      const i = new Image();
      i.decoding = "async";
      i.onload = paint;
      i.src = from;
      return i;
    };
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting || img) return;
        img = load(src);
        if (cut) {
          under = load(cut.base);
          sheet = load(cut.sheet);
        }
        size.observe(el);
        near.disconnect();
      },
      { rootMargin: "300px" },
    );
    near.observe(el);
    return () => {
      near.disconnect();
      size.disconnect();
    };
  }, [src, cut]);

  const down = (e: PointerEvent<HTMLSpanElement>) => {
    const s = state.current;
    s.held = true;
    s.dragged = 0;
    s.x = e.clientX;
    s.at = performance.now();
    s.v = 0;
    // a layer of its own while it turns; given back at rest
    if (strip.current) strip.current.style.willChange = "transform";
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
      {label && cut ? (
        // the label and, over it, its layers: they slide with it as one
        <span className="can__art">
          <canvas className="can__label" />
          <span className="can__live">
            <canvas className="can__base" />
            {cut.list.map((p) => (
              <canvas key={p.at.join()} className={`can__part can__part--${p.kind}`} style={beat(p)} />
            ))}
          </span>
        </span>
      ) : label ? (
        <canvas className="can__label" />
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
      data-live={cut && alive ? "" : undefined}
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
