"use client";

import { usePathname } from "next/navigation";
import { Link } from "../ui/Link";

// Desktop nav (spec §4.1): Utility 700 15 px; the active page is marked by a small solid
// barley kernel before its label, and aria-current.
export function NavLinks({ items }: { items: readonly { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <ul className="site-nav__list">
      {items.map((it) => {
        const active = path === it.href || path.startsWith(`${it.href}/`);
        return (
          <li key={it.href}>
            <Link href={it.href} className="site-nav__link" aria-current={active ? "page" : undefined}>
              <svg className="site-nav__kernel" viewBox="7 1 24 39" aria-hidden="true" focusable="false">
                <path d="M30 14.5 8 2v25.5l22 12.5z" />
              </svg>
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
