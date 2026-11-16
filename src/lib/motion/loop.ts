// One animation loop per living drawing, with the manners every one of them needs
// (2026-11-15): it runs only while its element is on screen, it sleeps as soon as the
// drawing says it has come to rest, it never runs with reduced motion, and a slow frame is
// handed on as at most a thirtieth of a second so springs do not explode.
//
// `frame(dt, now)` advances the model by dt seconds and draws; it returns true while
// anything is still moving. `wake()` starts the loop again after it has gone to rest
// (a tap, a tilt, a new pour). Browser only: call from an effect, and call `stop()` on
// cleanup.

export interface Loop {
  /** start again if at rest; harmless if already running or off screen */
  wake(): void;
  /** end for good and release the observer */
  stop(): void;
  /** true while the element is on screen */
  readonly seen: boolean;
}

export function createLoop(el: Element, frame: (dt: number, now: number) => boolean): Loop {
  const still = window.matchMedia("(prefers-reduced-motion: reduce)");
  let raf = 0;
  let last = 0;
  let seen = true;
  let wanted = false; // something is moving and would run if it were on screen
  let dead = false;

  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60);
    last = now;
    wanted = frame(dt, now);
    if (wanted && seen && !dead) raf = requestAnimationFrame(tick);
  };
  const run = () => {
    if (raf || dead || !seen || still.matches) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const watcher = new IntersectionObserver(([entry]) => {
    seen = entry?.isIntersecting ?? true;
    if (seen && wanted) run();
  });
  watcher.observe(el);

  return {
    wake() {
      wanted = true;
      run();
    },
    stop() {
      dead = true;
      cancelAnimationFrame(raf);
      raf = 0;
      watcher.disconnect();
    },
    get seen() {
      return seen;
    },
  };
}
