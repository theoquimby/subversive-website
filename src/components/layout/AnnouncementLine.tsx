"use client";

// One line of the announcement band, and the only client part of it: the close button.
// The server renders every line visible, so nothing moves while the page loads; after
// hydration a line the visitor already closed is taken away. Closed ids are kept in
// localStorage (a convenience: private windows and blocked storage simply show it again).
import { announceLabels } from "@content/microcopy";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Icon } from "../graphics/Icon";

const KEY = "sv.announce.closed";
const KEEP = 20; // the newest ids only; old ones are of no use once Ops stops sending them

function readClosed(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function remember(id: string): void {
  try {
    const next = [...readClosed().filter((x) => x !== id), id].slice(-KEEP);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked: closed for this page view only
  }
}

export function AnnouncementLine({
  id,
  tone,
  children,
}: {
  id: string;
  tone: "info" | "event" | "closure";
  children: ReactNode;
}) {
  const [closed, setClosed] = useState(false);
  const textId = useId();
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (readClosed().includes(id)) setClosed(true);
  }, [id]);

  if (closed) return null;

  const close = () => {
    remember(id);
    // keep the keyboard in the band: the next (or previous) line's button, if any
    const li = ref.current;
    const next = (li?.nextElementSibling ?? li?.previousElementSibling)?.querySelector("button");
    setClosed(true);
    if (next instanceof HTMLElement) next.focus();
  };

  return (
    <li ref={ref} className="announce__line" data-tone={tone}>
      <p id={textId} className="announce__text">
        {children}
      </p>
      <button
        type="button"
        className="announce__close"
        aria-label={announceLabels.dismiss}
        aria-describedby={textId}
        onClick={close}
      >
        <Icon name="close" className="announce__icon" />
      </button>
    </li>
  );
}
