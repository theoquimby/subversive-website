"use client";

// A paper sheet over the page (review pass 2026-11-15): on a phone it rises from the
// bottom edge to at most 88% of the screen and can be pulled down by its top; from tablet
// width it is a 440 px panel at the right. Focus, Escape and dismissal come from Radix
// Dialog; every visual is ours. One motion in, one out. The caller supplies a
// Dialog.Title among the children.
import { Dialog } from "radix-ui";
import { type KeyboardEvent, type PointerEvent, type ReactNode, useRef } from "react";

const PULL = 80; // px of downward pull that closes the sheet

export function Sheet({
  open,
  onOpenChange,
  closeLabel,
  className,
  onKeyDown,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  closeLabel: string;
  className?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const from = useRef<number | null>(null);

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || window.innerWidth >= 768) return;
    if ((e.target as Element).closest("button, a")) return;
    from.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
    sheet.current?.setAttribute("data-dragging", "");
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (from.current === null) return;
    sheet.current?.style.setProperty("--drag", `${Math.max(0, e.clientY - from.current)}px`);
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (from.current === null) return;
    const pulled = e.clientY - from.current;
    from.current = null;
    sheet.current?.removeAttribute("data-dragging");
    if (pulled > PULL) onOpenChange(false);
    else sheet.current?.style.removeProperty("--drag");
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay" />
        <Dialog.Content
          ref={sheet}
          className={className ? `sheet ${className}` : "sheet"}
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
        >
          <div
            className="sheet__top"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          >
            <span className="sheet__grab" aria-hidden="true" />
            <Dialog.Close className="sheet__close" aria-label={closeLabel}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5.5 6.2C9.6 9.8 14 14.2 18.4 18.3M18.6 5.6C14.3 9.7 10 13.9 5.4 18.5" />
              </svg>
            </Dialog.Close>
          </div>
          <div className="sheet__body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
