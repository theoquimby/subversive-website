"use client";

// The ticker (spec §4.10): one line of real links between two rules, the run duplicated
// once (aria-hidden) for the loop, at a constant 40 px/s. It pauses on hover and focus,
// offscreen, and with the global Pause motion; with reduced motion it is a static list.
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Link } from "../ui/Link";

export interface TickerItem {
  href: string;
  label: string;
}

const SPEED = 40; // px per second

function Run({ items, hidden = false }: { items: TickerItem[]; hidden?: boolean }) {
  return (
    <ul className="ticker__run" aria-hidden={hidden || undefined}>
      {items.map((it) => (
        <li key={it.href}>
          <Link href={it.href} tabIndex={hidden ? -1 : undefined}>
            {it.label}
          </Link>
          <span className="ticker__kernel" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}

export function Ticker({ items, label }: { items: TickerItem[]; label: string }) {
  const root = useRef<HTMLElement>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [offscreen, setOffscreen] = useState(false);

  useEffect(() => {
    const el = root.current;
    const run = el?.querySelector<HTMLElement>(".ticker__run");
    if (!el || !run) return;
    const measure = () => setDuration(run.offsetWidth / SPEED);
    measure();
    document.fonts?.ready.then(measure);
    const io = new IntersectionObserver(([e]) => setOffscreen(!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (items.length === 0) return null;
  return (
    <nav
      ref={root}
      className="ticker"
      aria-label={label}
      data-running={duration !== null && !offscreen ? "" : undefined}
      style={duration ? ({ "--ticker-d": `${duration.toFixed(1)}s` } as CSSProperties) : undefined}
    >
      <div className="ticker__track">
        <Run items={items} />
        <Run items={items} hidden />
      </div>
    </nav>
  );
}
