"use client";

// Fetch (2026-11-15): the long dog from the Visit page's Dogs stop (graphics/Doodle.tsx,
// same shapes, same pen), a ground line and a ball. Flick the ball (drag and let go) or
// tap the strip to toss it; the ball is a real one (gravity, bounces, rolling friction,
// soft ends) and the dog watches, runs it down, trots it home, drops it, sits and wags.
//
// Nothing here renders through React after the first paint: one loop (lib/motion/loop)
// advances a small model and writes transforms straight onto the groups. The loop sleeps
// when the ball is still and the dog is home; the occasional idle wag is CSS
// (fx-fetch.css, [data-rest]). With reduced motion or no JavaScript nothing is wired up:
// the dog stands with the ball beside it.
//
// The dog is drawn facing left in its own 120-unit box, as in Doodle; it is mirrored here
// to face right and moved about its middle (x = 56).
import { visitLabels } from "@content/microcopy";
import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { createLoop } from "@/lib/motion/loop";

// the strip, in viewBox units
const W = 360;
const H = 90;
const R = 5; // ball radius
const FLOOR = 77 - R; // the ball's middle when it sits where the dog's feet stand
const WALL_L = 11;
const WALL_R = W - 11;

// the dog
const MID = 56; // the middle of the dog's own box
const HOME = 62; // where its middle stands
const X_MIN = 56;
const X_MAX = W - 56;
const MOUTH: [number, number] = [7, 60.5]; // where a carried ball sits, in the dog's box
const REACH = MID - MOUTH[0]; // mouth, ahead of the middle
const BALL_HOME = HOME + REACH + 15;
const NECK: [number, number] = [31, 59];
const TOES: [number, number] = [41, 77]; // the dog sits back about its front feet
const HIPS = { f1: 37, f2: 45, b1: 81, b2: 89 } as const;
const LEG = 11;
const RUN = 190; // units a second, flat out
const TROT = 115;
const ACCEL = 520;
const BRAKE = 520;
const SIT_DEG = 10;

// the ball
const G = 900;
const BOUNCE = 0.55;
const SOFT = 0.4; // off the ends
const ROLL = 110; // rolling friction, units a second squared
const MAX_VX = 600;
const MAX_UP = 380; // keeps the highest throw about level with the top of the strip

const rad = Math.PI / 180;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (u: number) => u * u * (3 - 2 * u);
const n = (v: number) => v.toFixed(2);

type State = "rest" | "watch" | "chase" | "grab" | "carry" | "turn" | "drop";
type BallMode = "free" | "held" | "taking" | "mouth";

const drawn = (i: number) => ({ "--i": i }) as CSSProperties;

export function Fetch({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const q = (name: string) => svg.querySelector<SVGElement>(`[data-p="${name}"]`);
    const elDog = q("dog");
    const elPose = q("pose");
    const elRear = q("rear");
    const elTorso = q("torso");
    const elFront = q("front");
    const elHead = q("head");
    const elEar = q("ear");
    const elTail = q("tail");
    const elF1 = q("f1");
    const elF2 = q("f2");
    const elB1 = q("b1");
    const elB2 = q("b2");
    const elBall = q("ball");
    if (
      !elDog ||
      !elPose ||
      !elRear ||
      !elTorso ||
      !elFront ||
      !elHead ||
      !elEar ||
      !elTail ||
      !elF1 ||
      !elF2 ||
      !elB1 ||
      !elB2 ||
      !elBall
    )
      return;

    // ---- the model ----
    const ball = { x: BALL_HOME, y: FLOOR, vx: 0, vy: 0, turn: 0, mode: "free" as BallMode };
    let fromX = 0; // where the ball was when the dog bent to take it
    let fromY = 0;
    let loose = false; // thrown, and not yet brought back

    let state: State = "rest";
    let t = 0; // seconds in this state
    let x = HOME;
    let v = 0;
    let dir = 1; // which way it means to face: 1 right, -1 left
    let face = 1; // which way it is facing, passing through 0 as it turns
    let stride = 0; // leg phase
    let brake = 0; // 0..1, feet planted
    let head = 0; // degrees, nose up
    let sitU = 0; // 0 standing .. 1 sitting, before easing
    let fetched = false; // it has brought one back, so it waits sitting
    let wag = 0; // degrees of swing
    let wagPhase = 0;
    let wagFor = 0; // seconds of happy wagging left after a drop

    // the pose of the last drawn frame, kept so the mouth can be found without measuring
    let pShift = 0;
    let pLean = 0;
    let pBob = 0;

    /** Where a ball in the mouth sits, in strip units, for the pose as it stands. */
    const mouth = (): [number, number] => {
      // about the neck
      let px = MOUTH[0] - NECK[0];
      let py = MOUTH[1] - NECK[1];
      const ha = head * rad;
      let rx = px * Math.cos(ha) - py * Math.sin(ha);
      let ry = px * Math.sin(ha) + py * Math.cos(ha);
      // onto the body, which may have stretched, then about the front feet
      px = rx + NECK[0] + pShift - TOES[0];
      py = ry + NECK[1] - TOES[1];
      const la = pLean * rad;
      rx = px * Math.cos(la) - py * Math.sin(la);
      ry = px * Math.sin(la) + py * Math.cos(la);
      return [x - face * (rx + TOES[0] - MID), ry + TOES[1] + pBob];
    };

    /** Which way to face, and where to stand, to put the mouth on a ball at bx. */
    const aim = (bx: number): [number, number] => {
      let d = (bx - x) * dir > -10 ? dir : -dir;
      let tx = bx - d * REACH;
      if (tx < X_MIN || tx > X_MAX) {
        d = -d;
        tx = bx - d * REACH;
      }
      return [d, clamp(tx, X_MIN, X_MAX)];
    };

    const stepBall = (dt: number) => {
      const onGround = ball.y >= FLOOR && ball.vy === 0;
      if (onGround) {
        const drag = ROLL * dt;
        ball.vx = Math.abs(ball.vx) <= Math.max(drag, 4) ? 0 : ball.vx - Math.sign(ball.vx) * drag;
      } else {
        ball.vy += G * dt;
        ball.y += ball.vy * dt;
        if (ball.y >= FLOOR) {
          ball.y = FLOOR;
          if (ball.vy < 70) ball.vy = 0;
          else {
            ball.vy = -ball.vy * BOUNCE;
            ball.vx *= 0.86;
          }
        }
      }
      ball.x += ball.vx * dt;
      if (ball.x < WALL_L) {
        ball.x = WALL_L;
        ball.vx = Math.abs(ball.vx) * SOFT;
      } else if (ball.x > WALL_R) {
        ball.x = WALL_R;
        ball.vx = -Math.abs(ball.vx) * SOFT;
      }
      ball.turn += ((ball.vx * dt) / R) * (180 / Math.PI);
    };

    const ballStill = () => ball.mode === "free" && ball.vx === 0 && ball.vy === 0 && ball.y >= FLOOR;

    const frame = (dt: number): boolean => {
      if (ball.mode === "free") stepBall(dt);

      // ---- what the dog wants ----
      let tx = x;
      let top = RUN;
      let headTo = 0;
      let wagTo = 0;
      let sitTo = 0;
      const [mx, my] = mouth();
      t += dt;

      switch (state) {
        case "rest": {
          sitTo = fetched ? 1 : 0;
          wagFor -= dt;
          wagTo = wagFor > 0 ? 24 : 0;
          if (loose) {
            state = "watch";
            t = 0;
          }
          break;
        }
        case "watch": {
          // stop where it is, stand, and follow the ball with its nose
          if ((ball.x - x) * dir < -10) dir = -dir;
          const up = Math.atan2(NECK[1] - ball.y, Math.abs(ball.x - x) + 20) / rad;
          headTo = clamp(6 + up * 0.5, -6, 18);
          wagTo = 14;
          if (ball.mode === "held") t = 0;
          else if (t > 0.24 && Math.abs(v) < 8 && Math.abs(face) === 1) {
            state = loose ? "chase" : "carry";
            t = 0;
          }
          break;
        }
        case "chase": {
          [dir, tx] = aim(ball.x);
          headTo = 3;
          wagTo = 10;
          const dx = ball.x - mx;
          if (Math.abs(face) === 1 && Math.hypot(dx, ball.y - my) < 8) {
            // caught on the bounce
            ball.mode = "mouth";
            loose = false;
            state = "carry";
            t = 0;
          } else if (
            Math.abs(face) === 1 &&
            Math.abs(dx) < 7 &&
            ball.y > FLOOR - 3 &&
            Math.abs(ball.vx) < 70 &&
            Math.abs(v) < 70
          ) {
            ball.mode = "taking";
            ball.vx = 0;
            ball.vy = 0;
            fromX = ball.x;
            fromY = ball.y;
            state = "grab";
            t = 0;
          }
          break;
        }
        case "grab": {
          headTo = -20;
          wagTo = 12;
          if (t > 0.2) {
            ball.mode = "mouth";
            loose = false;
            state = "carry";
            t = 0;
          }
          break;
        }
        case "carry": {
          // home, with or without the ball
          if (Math.abs(x - HOME) > 1) dir = x > HOME ? -1 : 1;
          tx = HOME;
          top = TROT;
          headTo = 5;
          wagTo = 16;
          if (Math.abs(x - HOME) < 0.5 && Math.abs(v) < 6) {
            state = "turn";
            t = 0;
          }
          break;
        }
        case "turn": {
          dir = 1;
          headTo = 5;
          wagTo = 16;
          if (face === 1) {
            state = "drop";
            t = 0;
          }
          break;
        }
        case "drop": {
          headTo = -12;
          wagTo = 16;
          if (t > 0.14 && ball.mode === "mouth") {
            ball.mode = "free";
            ball.x = mx;
            ball.y = Math.min(my, FLOOR - 0.5);
            ball.vx = 45;
            ball.vy = 0;
          }
          if (t > 0.3) {
            fetched = true;
            wagFor = 1.8;
            state = "rest";
            t = 0;
          }
          break;
        }
      }

      // ---- the dog's body ----
      // ease out of a stand and into a stop: never faster than it could still brake from
      const gap = tx - x;
      const want = Math.sign(gap) * Math.min(top, Math.sqrt(2 * BRAKE * Math.abs(gap)));
      const slowing = Math.abs(want) < Math.abs(v) - 1;
      const step = (slowing ? BRAKE * 1.15 : ACCEL) * dt;
      v += clamp(want - v, -step, step);
      x = clamp(x + v * dt, X_MIN, X_MAX);
      if (Math.abs(tx - x) < 0.4 && Math.abs(v) < 6) {
        x = tx;
        v = 0;
      }
      const speed = Math.abs(v);
      const pace = clamp(speed / RUN, 0, 1);

      // a turn is a quick flip through edge-on
      if (face !== dir) {
        face += Math.sign(dir - face) * 11 * dt;
        if ((dir - face) * dir <= 0) face = dir;
      }

      const toward = (rate: number) => 1 - Math.exp(-dt * rate);
      brake += ((slowing && speed > 30 ? 1 : 0) - brake) * toward(14);
      head += (headTo - head) * toward(16);
      if (sitU < sitTo) sitU = Math.min(sitTo, sitU + dt / 0.4);
      else if (sitU > sitTo) sitU = Math.max(sitTo, sitU - dt / 0.16);
      wag += (wagTo + 20 * pace - wag) * toward(6);
      wagPhase += (10 + 16 * pace) * dt;
      stride += speed * dt * 0.2;

      // ---- draw ----
      const moving = clamp(speed / 20, 0, 1);
      const swing = (12 + 26 * pace) * moving * (1 - brake);
      const stretch = 1 + 0.06 * pace * Math.sin(stride + 0.6) - 0.05 * brake;
      const lean = SIT_DEG * smooth(sitU) + 3 * brake; // rump down: sitting, or skidding
      const bob = -1.2 * pace * Math.abs(Math.sin(stride));
      pShift = -(MID - NECK[0]) * (stretch - 1);
      pLean = lean;
      pBob = bob;
      const rearShift = (93 - MID) * (stretch - 1);

      elDog.setAttribute("transform", `translate(${n(x)} ${n(bob)}) scale(${n(-face || 0.01)} 1)`);
      elPose.setAttribute("transform", `translate(${-MID} 0) rotate(${n(lean)} ${TOES[0]} ${TOES[1]})`);
      elTorso.setAttribute(
        "transform",
        `translate(${MID} 0) scale(${stretch.toFixed(4)} 1) translate(${-MID} 0)`,
      );
      elFront.setAttribute("transform", `translate(${n(pShift)} 0)`);
      elRear.setAttribute("transform", `translate(${n(rearShift)} 0)`);
      elHead.setAttribute("transform", `rotate(${n(head)} ${NECK[0]} ${NECK[1]})`);
      elEar.setAttribute(
        "transform",
        `rotate(${n(-(Math.max(head, 0) * 1.2 + 30 * pace + 6 * pace * Math.sin(stride * 2)))} 23 47)`,
      );
      elTail.setAttribute("transform", `rotate(${n(8 * pace + wag * Math.sin(wagPhase))} 94 55)`);

      // front legs scissor, or brace when it skids; back legs also fold under as the rump drops
      const la = lean * rad;
      const leg = (el: SVGElement, hip: number, phase: number, braced: number, back: boolean) => {
        let a = swing * Math.sin(stride + phase) + braced * brake;
        if (back) {
          const height = LEG * Math.cos(la) - (hip - TOES[0]) * Math.sin(la);
          const fold = Math.acos(clamp(height / LEG, 0, 1)) / rad - lean;
          a = a * (1 - smooth(sitU)) + Math.max(fold, 0);
        }
        el.setAttribute("transform", `rotate(${n(a)} ${hip} 66)`);
      };
      leg(elF1, HIPS.f1, 0, 28, false);
      leg(elF2, HIPS.f2, Math.PI, 22, false);
      leg(elB1, HIPS.b1, Math.PI / 2, 0, true);
      leg(elB2, HIPS.b2, (3 * Math.PI) / 2, 0, true);

      // the ball goes where the mouth now is
      if (ball.mode === "mouth" || ball.mode === "taking") {
        const [nx, ny] = mouth();
        if (ball.mode === "mouth") {
          ball.x = nx;
          ball.y = ny;
        } else {
          const u = smooth(clamp(t / 0.2, 0, 1));
          ball.x = fromX + (nx - fromX) * u;
          ball.y = fromY + (ny - fromY) * u;
        }
      }
      elBall.setAttribute("transform", `translate(${n(ball.x)} ${n(ball.y)}) rotate(${n(ball.turn % 360)})`);

      const settled =
        state === "rest" &&
        ballStill() &&
        wagTo === 0 &&
        wag < 0.4 &&
        Math.abs(head) < 0.3 &&
        sitU === sitTo &&
        v === 0 &&
        face === dir;
      if (settled) {
        wag = 0;
        elTail.setAttribute("transform", "rotate(0 94 55)");
        svg.setAttribute("data-rest", "");
        return false;
      }
      return true;
    };

    const loop = createLoop(svg, frame);
    const wake = () => {
      svg.removeAttribute("data-rest");
      loop.wake();
    };

    /** Let the ball go with a velocity; the dog takes a moment to notice. */
    const release = (vx: number, vy: number) => {
      ball.mode = "free";
      ball.vx = clamp(vx, -MAX_VX, MAX_VX);
      ball.vy = clamp(vy, -MAX_UP, MAX_VX);
      ball.y = Math.min(ball.y, FLOOR - 0.01);
      const setDown = x === HOME && Math.abs(ball.x - BALL_HOME) < 14 && Math.hypot(vx, vy) < 60;
      loose = !setDown;
      if (state !== "chase" && loose) {
        state = "watch";
        t = 0;
      }
      wake();
    };

    // ---- the hand ----
    // A drag that starts near the ball and sets off sideways picks it up; letting go throws
    // it. A drag that sets off up or down is the page scrolling (touch-action: pan-y) and is
    // left alone. A tap anywhere on the strip is a toss.
    let pid = -1;
    let holding = false;
    let near = false;
    let downX = 0;
    let downY = 0;
    let downAt = 0;
    let box = svg.getBoundingClientRect();
    const trail: { t: number; x: number; y: number }[] = [];
    const at = (e: PointerEvent): [number, number] => [
      ((e.clientX - box.left) * W) / box.width,
      ((e.clientY - box.top) * H) / box.height,
    ];
    const hold = (e: PointerEvent) => {
      const [ux, uy] = at(e);
      ball.x = clamp(ux, WALL_L, WALL_R);
      ball.y = clamp(uy, -10, FLOOR);
      trail.push({ t: e.timeStamp, x: ball.x, y: ball.y });
      if (trail.length > 8) trail.shift();
    };

    const onDown = (e: PointerEvent) => {
      if (pid !== -1 || (e.pointerType === "mouse" && e.button !== 0)) return;
      box = svg.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const [ux, uy] = at(e);
      pid = e.pointerId;
      holding = false;
      near = Math.hypot(ux - ball.x, (uy - ball.y) * 0.6) < 30;
      downX = e.clientX;
      downY = e.clientY;
      downAt = e.timeStamp;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      if (!holding) {
        const dx = e.clientX - downX;
        const dy = e.clientY - downY;
        if (Math.hypot(dx, dy) < 6) return;
        if (!near || (e.pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx))) {
          pid = -1; // not ours: a scroll, or a drag that began away from the ball
          return;
        }
        holding = true;
        trail.length = 0;
        ball.mode = "held";
        ball.vx = 0;
        ball.vy = 0;
        loose = true;
        state = "watch";
        t = 0;
        svg.setAttribute("data-held", "");
        try {
          svg.setPointerCapture(pid);
        } catch {
          // the pointer has already gone; the release below still arrives or is cancelled
        }
        wake();
      }
      hold(e);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      pid = -1;
      if (holding) {
        holding = false;
        svg.removeAttribute("data-held");
        // the hand's speed over the last tenth of a second or so
        const last = trail[trail.length - 1];
        const first = trail.find((s) => last && last.t - s.t <= 110);
        let vx = 0;
        let vy = 0;
        if (last && first && last.t > first.t && e.timeStamp - last.t < 90) {
          vx = ((last.x - first.x) / (last.t - first.t)) * 1000;
          vy = ((last.y - first.y) / (last.t - first.t)) * 1000;
        }
        release(vx, vy);
        return;
      }
      if (e.timeStamp - downAt > 500 || Math.hypot(e.clientX - downX, e.clientY - downY) >= 6) return;
      // a tap: a modest toss, to the right unless there is no room left there
      if (ball.mode === "held") return;
      release(ball.x > W - 70 ? -170 : 170, -300);
    };
    const onCancel = (e: PointerEvent) => {
      if (e.pointerId !== pid) return;
      pid = -1;
      if (!holding) return;
      holding = false;
      svg.removeAttribute("data-held");
      release(0, 0);
    };

    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", onCancel);
    return () => {
      loop.stop();
      svg.removeEventListener("pointerdown", onDown);
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerup", onUp);
      svg.removeEventListener("pointercancel", onCancel);
    };
  }, []);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      className={className ? `pen fetch ${className}` : "pen fetch"}
      data-draw=""
      data-rest=""
      role="img"
      aria-label={visitLabels.dogs}
      focusable="false"
    >
      <rect className="fetch__field" width={W} height={H} />
      <path d="M6 80C52 78 104 81 150 79.5S250 78.5 296 80S338 80.5 354 79" pathLength={1} style={drawn(0)} />
      <g data-p="dog" transform={`translate(${HOME} 0) scale(-1 1)`}>
        <g data-p="pose" transform={`translate(${-MID} 0)`}>
          <g data-p="rear">
            <g data-p="tail">
              <g className="fetch__wag">
                <path d="M94 55C101 51 105 45 104 38" pathLength={1} style={drawn(6)} />
              </g>
            </g>
            <path data-p="b1" d="M81 66V77" pathLength={1} style={drawn(5)} />
            <path data-p="b2" d="M89 66V77" pathLength={1} style={drawn(5)} />
          </g>
          <path
            data-p="torso"
            d="M31 53C51 50 75 50 93 53C97 59 96 63 93 65C73 67 51 67 31 65"
            pathLength={1}
            style={drawn(1)}
          />
          <g data-p="front">
            <path data-p="f1" d="M37 66V77" pathLength={1} style={drawn(5)} />
            <path data-p="f2" d="M45 66V77" pathLength={1} style={drawn(5)} />
            <g data-p="head">
              <path
                d="M31 53C27 46 18 46 14 51C10 52 8 56 12 59C16 63 24 64 31 65"
                pathLength={1}
                style={drawn(2)}
              />
              <path data-p="ear" d="M23 47C20 53 21 59 25.5 59" pathLength={1} style={drawn(3)} />
              <path d="M16.4 52.4v.8M9.6 55.6v.5" pathLength={1} style={drawn(4)} />
            </g>
          </g>
        </g>
      </g>
      <g data-p="ball" className="fetch__ball" transform={`translate(${BALL_HOME} ${FLOOR})`}>
        <path
          className="fetch__ball-skin"
          d={`M${-R} 0a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0`}
          pathLength={1}
          style={drawn(7)}
        />
        <path
          className="fetch__ball-seam"
          d="M-3.3 -1.8C-1.2 .5 1.4 .7 3.5 -1.2"
          pathLength={1}
          style={drawn(8)}
        />
      </g>
    </svg>
  );
}
