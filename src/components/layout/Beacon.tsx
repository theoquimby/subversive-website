"use client";

// Cookieless first-party analytics, sent to Ops (contract: subversive-ops/docs/
// website-analytics.md). A page view on each page, and a named event when someone calls,
// asks for directions, goes to order, or follows another outside link. No cookie, no
// identifier, nothing third-party: it is part of the site's own bundle and sends nothing
// until NEXT_PUBLIC_OPS_COLLECT_URL is set. Automated browsers (tests, Lighthouse) are
// left out.
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const COLLECT = process.env.NEXT_PUBLIC_OPS_COLLECT_URL;
let first = true;

export function send(n: string, p?: Record<string, string | number>) {
  if (!COLLECT || navigator.webdriver) return;
  const body = JSON.stringify({ n, u: location.href, r: first ? document.referrer : "", w: innerWidth, p });
  first = false;
  if (!navigator.sendBeacon?.(COLLECT, body)) {
    fetch(COLLECT, { method: "POST", body, keepalive: true, mode: "no-cors" }).catch(() => {});
  }
}

const DIRECTIONS = /(^|\.)maps\.apple\.com$|(^|\.)google\.[a-z.]+$|^maps\.app\.goo\.gl$|^g\.page$/;

export function Beacon({ orderHost }: { orderHost: string }) {
  const path = usePathname();
  useEffect(() => {
    send("pageview");
    if (path === "/menu") send("menu_view");
    const m = /^\/events\/([^/]+)$/.exec(path);
    if (m?.[1]) send("event_view", { slug: m[1] });
  }, [path]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const named = a.dataset.track; // e.g. data-track="ticket_click"
      if (named) return send(named, a.dataset.trackSlug ? { slug: a.dataset.trackSlug } : undefined);
      if (a.protocol === "tel:") return send("click_call");
      if (a.host === location.host) return;
      if (DIRECTIONS.test(a.hostname) && /maps|dir|place|g\.page|goo\.gl/.test(a.href)) {
        return send("click_directions");
      }
      if (a.hostname === orderHost) return send("click_order_online");
      send("outbound_click", { href: a.href.slice(0, 200) });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [orderHost]);
  return null;
}
