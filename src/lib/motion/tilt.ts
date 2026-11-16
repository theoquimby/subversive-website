// The phone's lean, shared by every drawing that answers it (2026-11-15).
//
// One listener for the whole page, however many drawings subscribe. The value handed out is
// the roll in radians, positive when the right edge of the screen is lower, clamped to
// about 26 degrees, and only when it has changed by more than about a degree and a half
// (a hand is never still; without the deadband every sensor reading would wake every
// drawing, sixty times a second).
//
// iOS gives a page the tilt only after a tap and its own permission prompt: it is asked for
// on the first tap anywhere on the page, once, and only if something is subscribed.
// Elsewhere the tilt is simply there. With reduced motion nothing is ever handed out.
// Browser only: call from an effect.

type Listener = (radians: number) => void;

const MAX = 0.45;
const DEADBAND = 0.026;
const listeners = new Set<Listener>();
let listening = false;
let asked = false;
let last = 0;

function onOrientation(e: DeviceOrientationEvent) {
  if (e.gamma === null || e.beta === null) return;
  const turn = window.screen.orientation?.angle ?? 0;
  const deg = turn === 90 ? e.beta : turn === 270 ? -e.beta : e.gamma;
  const rad = Math.max(-MAX, Math.min(MAX, (deg * Math.PI) / 180));
  if (Math.abs(rad - last) < DEADBAND) return;
  last = rad;
  for (const l of listeners) l(rad);
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener("deviceorientation", onOrientation);
}

function ask() {
  const D = window.DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
    | undefined;
  D?.requestPermission?.()
    .then((answer) => {
      if (answer === "granted") listen();
    })
    .catch(() => {
      // refused or unavailable: everything simply stays level
    });
}

/** The current lean in radians (0 until the device reports one). */
export function tiltNow(): number {
  return last;
}

/** Subscribe to the phone's lean. Returns the unsubscribe. */
export function onTilt(listener: Listener): () => void {
  if (typeof window === "undefined") return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const D = window.DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> })
    | undefined;
  if (!D) return () => {};
  listeners.add(listener);
  if (typeof D.requestPermission === "function") {
    if (!asked) {
      asked = true;
      document.addEventListener("click", ask, { once: true });
    }
  } else listen();
  return () => {
    listeners.delete(listener);
  };
}
