// Text links (spec §4.3): a 2 px accent underline 4 px below; on hover the underline grows
// up behind the words (a background-size transition) while the text stays ink.
// ExternalLink: the external arrow and rel="noopener" (Square, Maps, the band form).
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../graphics/Icon";

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="text-link" href={href}>
      {children}
    </Link>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="text-link text-link--external" href={href} target="_blank" rel="noopener">
      {children}
      <Icon name="external" className="text-link__icon" />
    </a>
  );
}
