"use client";

// The large view of a photograph from a PhotoStrip (2026-11-16): the photo fitted to a
// dark screen, its description beneath, a close mark and a pen arrow either side. Swipe
// on touch, arrow keys and Escape from a keyboard. Focus, Escape and the page lock come
// from Radix Dialog; every visual is ours. The photo grows out of its thumbnail and
// shrinks back into it (a FLIP transform, 240 ms); with reduced motion it simply appears.
import { galleryLabels } from "@content/microcopy";
import Image, { type StaticImageData } from "next/image";
import { Dialog } from "radix-ui";
import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";

const MS = 240;
const SWIPE = 56; // px of sideways travel that changes the photo

export interface LightboxItem {
  id: string;
  src: StaticImageData;
  alt: string;
}

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const curve = () =>
  getComputedStyle(document.documentElement).getPropertyValue("--ease-out").trim() || "linear";

/** The transform that lays the stage's fitted photo over a thumbnail. */
function onto(stage: HTMLElement, thumb: DOMRect, item: LightboxItem): string {
  const s = stage.getBoundingClientRect();
  const ratio = item.src.width / item.src.height;
  const w = s.width / s.height > ratio ? s.height * ratio : s.width;
  const h = w / ratio;
  const scale = Math.sqrt((thumb.width * thumb.height) / (w * h));
  const dx = thumb.left + thumb.width / 2 - (s.left + s.width / 2);
  const dy = thumb.top + thumb.height / 2 - (s.top + s.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${scale})`;
}

export function Lightbox({ items, children }: { items: LightboxItem[]; children: ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const from = useRef<DOMRect | null>(null);
  const shown = useRef(0);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const thumb = (i: number) => root.current?.querySelector<HTMLElement>(`[data-photo="${i}"]`) ?? null;

  const open = (e: MouseEvent<HTMLDivElement>) => {
    const b = (e.target as Element).closest<HTMLElement>("[data-photo]");
    if (!b || !root.current?.contains(b)) return;
    const i = Number(b.dataset.photo);
    from.current = still() ? null : b.getBoundingClientRect();
    shown.current = i;
    setLeaving(false);
    setIndex(i);
  };

  // the stage mounts inside the portal a render after the dialog opens; grow from there
  const stageRef = useCallback(
    (el: HTMLDivElement | null) => {
      stage.current = el;
      const rect = from.current;
      from.current = null;
      if (!el || !rect) return;
      const item = items[shown.current];
      if (!item) return;
      el.animate([{ transform: onto(el, rect, item) }, { transform: "none" }], {
        duration: MS,
        easing: curve(),
      });
    },
    [items],
  );

  const close = () => {
    if (leaving || index === null) return;
    const el = stage.current;
    const t = thumb(index);
    const item = items[index];
    if (still() || !el || !t || !item) {
      setIndex(null);
      return;
    }
    setLeaving(true);
    // bring the thumbnail into the row's view first, so the photo lands where it is
    t.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    const anim = el.animate(
      [{ transform: "none" }, { transform: onto(el, t.getBoundingClientRect(), item) }],
      {
        duration: MS,
        easing: curve(),
        fill: "forwards",
      },
    );
    anim.finished.then(
      () => {
        setIndex(null);
        setLeaving(false);
      },
      () => {
        setIndex(null);
        setLeaving(false);
      },
    );
  };

  const go = (step: number) => {
    if (index === null || leaving) return;
    const next = (index + step + items.length) % items.length;
    shown.current = next;
    setIndex(next);
  };

  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
    else return;
    e.preventDefault();
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || !e.isPrimary) return;
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!swipe.current || !e.isPrimary) return;
    e.currentTarget.style.translate = `${e.clientX - swipe.current.x}px 0`;
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    swipe.current = null;
    e.currentTarget.style.removeProperty("translate");
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
  };

  const item = index === null ? null : items[index];

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: delegates presses from the thumbnail buttons inside
    // biome-ignore lint/a11y/useKeyWithClickEvents: the buttons inside handle the keyboard themselves
    <div ref={root} className="gallery-wrap" onClick={open}>
      {children}
      <Dialog.Root
        open={item !== null}
        onOpenChange={(o) => {
          if (!o) close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="lightbox-overlay" data-leaving={leaving ? "" : undefined} />
          <Dialog.Content
            className="lightbox"
            aria-describedby={undefined}
            data-leaving={leaving ? "" : undefined}
            onKeyDown={keys}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              thumb(shown.current)?.focus({ preventScroll: true });
            }}
          >
            <Dialog.Title className="sr-only">{galleryLabels.group}</Dialog.Title>
            <div className="lightbox__top">
              <Dialog.Close className="lightbox__btn" aria-label={galleryLabels.close}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M5.5 6.2C9.6 9.8 14 14.2 18.4 18.3M18.6 5.6C14.3 9.7 10 13.9 5.4 18.5" />
                </svg>
              </Dialog.Close>
            </div>
            <div
              ref={stageRef}
              className="lightbox__stage"
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
            >
              {item ? (
                <Image
                  key={item.id}
                  src={item.src}
                  alt=""
                  sizes="(min-width: 1500px) 1500px, 100vw"
                  fill
                  placeholder="blur"
                  style={{ objectFit: "contain" }}
                />
              ) : null}
            </div>
            <div className="lightbox__foot">
              <button
                type="button"
                className="lightbox__btn"
                aria-label={galleryLabels.previous}
                onClick={() => go(-1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M15.2 5.3C12.6 7.9 10.2 10.2 7.7 12.1C10.1 14.2 12.6 16.4 15.4 18.8" />
                </svg>
              </button>
              {/* the photo's description, read out as the photo changes */}
              <p className="lightbox__caption" aria-live="polite">
                {item?.alt}
              </p>
              <button
                type="button"
                className="lightbox__btn"
                aria-label={galleryLabels.next}
                onClick={() => go(1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M8.8 5.3C11.4 7.9 13.8 10.2 16.3 12.1C13.9 14.2 11.4 16.4 8.6 18.8" />
                </svg>
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
