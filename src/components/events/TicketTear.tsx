"use client";

// Tear-off tickets (2026-11-15). A tap on a ticket tears its date stub off along the
// perforation while the page change (Curtain) fades its sheet up: the stub peels away from
// the top of the perforation, swings on the last bit of paper at the bottom, lets go and
// falls; the body is tugged toward the tear and springs back when the paper gives.
//
// A small rigid-body model, drawn flat:
//   1. hinged, fibres holding: the stub turns about the bottom of the perforation under the
//      finger's pull and its own weight, against an angular spring (the paper);
//   2. the spring breaks past BREAK: it swings free on the hinge;
//   3. the hinge lets go past LETGO: a free body under gravity that keeps the velocity and
//      spin it had, with a little air drag, and fades as it drops.
// The body is a mass on a damped spring, pulled by the paper only while the fibres hold.
//
// This never touches the click: it does not prevent, stop or delay anything. It renders
// nothing, writes transforms and opacity straight to the two halves, and puts everything
// back if the page did not change (Back from cache, a stalled navigation, a new path that
// reuses the same elements). Styles for the torn state: src/styles/fx-ticket.css.
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { createLoop, type Loop } from "@/lib/motion/loop";

const TICKET = "a[data-ticket], a.tix__t";

const STEP = 1 / 240; // s, fixed step so the tear is the same at 60 and 120 Hz
const G = 2400; // px/s², paper-weight gravity at screen scale
const PULL = 46; // rad/s², the finger's pull while the stub is still attached
const PAPER = 640; // 1/s², stiffness of the fibres along the perforation
const HINGE_DRAG = 3; // 1/s
const BREAK = 0.1; // rad, the fibres give
const LETGO = 0.22; // rad, the last bit of paper gives
const AIR = 2.5; // 1/s, drag on the falling stub
const SPIN_DRAG = 7; // 1/s
const FADE = 0.24; // s, the fallen stub goes out
const BODY_K = 3200; // 1/s², the body's spring back to its place
const BODY_C = 30; // 1/s
const TUG = 4; // px the body is drawn toward the tear just before it gives
const GIVE_UP = 3600; // ms, after Curtain's own safety: the page did not change

interface Tear {
  a: HTMLAnchorElement;
  stub: HTMLElement;
  body: HTMLElement;
  loop: Loop;
  timer: number;
}

let live: Tear | null = null;

function mend() {
  const t = live;
  if (!t) return;
  live = null;
  t.loop.stop();
  window.clearTimeout(t.timer);
  t.a.removeAttribute("data-tearing");
  for (const p of ["--tear-bg", "background-color", "border-color", "transition-property"]) {
    t.a.style.removeProperty(p);
  }
  for (const el of [t.stub, t.body]) {
    el.style.removeProperty("transform");
    el.style.removeProperty("opacity");
  }
}

function tear(a: HTMLAnchorElement) {
  mend();
  const stub = a.querySelector<HTMLElement>(".tix__stub");
  const body = a.querySelector<HTMLElement>(".tix__body");
  if (!stub || !body) return;

  // read once, then write: each half takes the ticket's paper and outline with it
  const w = stub.offsetWidth;
  const h = stub.offsetHeight;
  const paper = getComputedStyle(a).backgroundColor;
  a.style.setProperty("--tear-bg", paper);
  a.style.transitionProperty = "translate, rotate";
  a.style.backgroundColor = "transparent";
  a.style.borderColor = "transparent";
  a.setAttribute("data-tearing", "");

  // the stub's centre of mass from the hinge (the bottom of the perforation), y down
  const c0x = -w / 2;
  const c0y = -h / 2;
  const inertia = w * w + h * h; // of a plate about its corner, over m/3

  let phase = 0; // 0 fibres holding, 1 swinging on the hinge, 2 falling
  let th = 0; // rad, clockwise positive like CSS; the stub turns the other way
  let om = 0;
  let px = 0; // the centre of mass once it is free
  let py = 0;
  let vx = 0;
  let vy = 0;
  let alpha = 1;
  let bx = 0; // the body's shift
  let bv = 0;
  let owed = 0;

  const step = (dt: number) => {
    if (phase < 2) {
      const cx = c0x * Math.cos(th) - c0y * Math.sin(th);
      let acc = -PULL + (3 * G * cx) / inertia - HINGE_DRAG * om;
      if (phase === 0) acc -= PAPER * th;
      om += acc * dt;
      th += om * dt;
      if (phase === 0 && th < -BREAK) phase = 1;
      else if (phase === 1 && th < -LETGO) {
        phase = 2;
        px = c0x * Math.cos(th) - c0y * Math.sin(th);
        py = c0x * Math.sin(th) + c0y * Math.cos(th);
        vx = -om * py;
        vy = om * px;
      }
    } else {
      vy += G * dt;
      vx -= AIR * vx * dt;
      vy -= AIR * vy * dt;
      om -= SPIN_DRAG * om * dt;
      px += vx * dt;
      py += vy * dt;
      th += om * dt;
      alpha -= dt / FADE;
    }
    const tension = phase === 0 ? BODY_K * TUG * (th / BREAK) : 0;
    bv += (tension - BODY_K * bx - BODY_C * bv) * dt;
    bx += bv * dt;
  };

  const loop = createLoop(a, (dt) => {
    owed = Math.min(owed + (dt > 0 ? dt : 1 / 60), 1 / 15);
    while (owed >= STEP) {
      step(STEP);
      owed -= STEP;
    }
    if (phase < 2) {
      stub.style.transform = `rotate(${th.toFixed(4)}rad)`;
    } else {
      // where the hinge corner has got to, given the centre of mass and the turn
      const dx = px - (c0x * Math.cos(th) - c0y * Math.sin(th));
      const dy = py - (c0x * Math.sin(th) + c0y * Math.cos(th));
      stub.style.transform = `translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,0) rotate(${th.toFixed(4)}rad)`;
      stub.style.opacity = alpha > 0 ? alpha.toFixed(3) : "0";
    }
    body.style.transform = `translate3d(${bx.toFixed(2)}px,0,0)`;
    return alpha > 0 || Math.abs(bx) > 0.05 || Math.abs(bv) > 2;
  });

  live = { a, stub, body, loop, timer: window.setTimeout(mend, GIVE_UP) };
  loop.wake();
}

export function TicketTear() {
  const path = usePathname();

  useEffect(() => {
    // the same test Curtain makes: only a plain click that will change the page tears.
    // Enter on a focused ticket arrives here as a click too.
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const a = (e.target as Element | null)?.closest?.(TICKET) as HTMLAnchorElement | null;
      if (!a?.href || a.target || a.hasAttribute("download")) return;
      const to = new URL(a.href, location.href);
      if (to.origin !== location.origin || to.pathname === location.pathname) return;
      tear(a);
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) mend();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("pageshow", onShow);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", onShow);
      mend();
    };
  }, []);

  // a new page: an event's previous/next tickets can be the same elements with new words
  // biome-ignore lint/correctness/useExhaustiveDependencies: the path is the trigger
  useEffect(() => mend, [path]);

  return null;
}
