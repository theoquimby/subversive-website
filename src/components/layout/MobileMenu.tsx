"use client";

import { Dialog, VisuallyHidden } from "radix-ui";
import { useState } from "react";
import { Link } from "../ui/Link";

// Mobile menu (spec §4.1): a full-screen sheet that wipes in along the slash from the top
// right (420 ms; closes in 70% of that). Links in --t-h1 Caprasimo, numbered in Utility,
// starting below the top third so they sit in the thumb's reach. Below: address (tap for
// directions), phone, Instagram and Facebook. The hours line and tonight's sticker arrive
// with real data in M4 and M5. Radix: focus trapped, Escape closes, focus returns to the
// trigger, body scroll locked without layout shift.
interface Props {
  nav: readonly { href: string; label: string }[];
  address: string;
  mapHref: string;
  phone: { display: string; tel: string };
  instagram: string;
  facebook: string;
}

function Glyph({ open }: { open: boolean }) {
  // two lines that become a slash and a backslash
  return (
    <svg viewBox="0 0 24 24" className="menu-glyph" data-open={open || undefined} aria-hidden="true">
      <path className="menu-glyph__a" d="M4 9h16" />
      <path className="menu-glyph__b" d="M4 15h16" />
    </svg>
  );
}

export function MobileMenu({ nav, address, mapHref, phone, instagram, facebook }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="menu-button" aria-label="Menu">
        <Glyph open={false} />
      </Dialog.Trigger>
      <Dialog.Portal>
        {/* Radix locks body scroll from the Overlay; without it the page scrolled behind the sheet */}
        <Dialog.Overlay className="menu-overlay" />
        <Dialog.Content className="menu-sheet" data-skin="paper" aria-describedby={undefined}>
          <VisuallyHidden.Root>
            <Dialog.Title>Menu</Dialog.Title>
          </VisuallyHidden.Root>
          <Dialog.Close className="menu-button menu-sheet__close" aria-label="Close menu">
            <Glyph open />
          </Dialog.Close>
          <nav aria-label="Main" className="menu-sheet__nav">
            <ol>
              {nav.map((it, i) => (
                <li key={it.href} style={{ "--i": i } as React.CSSProperties}>
                  <Link href={it.href} className="menu-sheet__link" onClick={() => setOpen(false)}>
                    <span className="menu-sheet__num" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {it.label}
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <div className="menu-sheet__facts">
            <a href={mapHref} target="_blank" rel="noopener" className="menu-sheet__fact">
              {address}
            </a>
            <a href={`tel:${phone.tel}`} className="menu-sheet__fact tabular">
              {phone.display}
            </a>
            <p className="menu-sheet__social">
              <a href={instagram} target="_blank" rel="noopener">
                Instagram
              </a>
              <a href={facebook} target="_blank" rel="noopener">
                Facebook
              </a>
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
