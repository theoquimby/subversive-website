"use client";

import { usePathname } from "next/navigation";
import { Dialog, VisuallyHidden } from "radix-ui";
import { useEffect, useState } from "react";
import { BarleyMark } from "../graphics/BarleyMark";
import { slashBand, toPoints } from "../graphics/slash";
import { Wordmark } from "../graphics/Wordmark";
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

// The close mark: a slash and a backslash cut as bands at the wordmark's 61°, so it is drawn
// from the same geometry as the slash, not a typed ×.
const BAND = slashBand({ height: 20, thickness: 3.4 });
const BAND_W = 3.4 + (BAND[3]?.[0] ?? 0);
function CutCross() {
  const x = (24 - BAND_W) / 2;
  return (
    <svg viewBox="0 0 24 24" className="cut-cross" aria-hidden="true" focusable="false">
      <g transform={`translate(${x.toFixed(2)} 2)`}>
        <polygon points={toPoints(BAND)} />
        <polygon points={toPoints(BAND)} transform={`translate(${BAND_W.toFixed(2)} 0) scale(-1 1)`} />
      </g>
    </svg>
  );
}

export function MobileMenu({ nav, address, mapHref, phone, instagram, facebook }: Props) {
  // The sheet is open for the page it was opened on. Following a link closes it in the
  // same commit that brings the new page, with no exit animation of its own: the page
  // wipe takes the sheet away with the old page (one motion, not two). The close mark
  // and Escape still wipe it out on its own.
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const leaving = openOn !== null && !open;
  useEffect(() => {
    if (leaving) setOpenOn(null);
  }, [leaving]);
  return (
    <Dialog.Root open={open} onOpenChange={(o) => setOpenOn(o ? pathname : null)}>
      <Dialog.Trigger className="menu-button" aria-label="Menu">
        <Glyph open={false} />
      </Dialog.Trigger>
      <Dialog.Portal>
        {/* Radix locks body scroll from the Overlay; without it the page scrolled behind the sheet */}
        <Dialog.Overlay className="menu-overlay" />
        <Dialog.Content
          className="menu-sheet"
          data-skin="paper"
          data-leaving={leaving || undefined}
          aria-describedby={undefined}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>Menu</Dialog.Title>
          </VisuallyHidden.Root>
          {/* the header row, kept: brand at left, the close mark where the menu button was */}
          <div className="menu-sheet__top">
            <span className="brand" aria-hidden="true">
              <BarleyMark className="brand__mark" />
              <Wordmark className="brand__word" />
            </span>
            <Dialog.Close className="menu-button" aria-label="Close menu">
              <CutCross />
            </Dialog.Close>
          </div>
          <nav aria-label="Main" className="menu-sheet__nav">
            <ol>
              {nav.map((it, i) => (
                <li key={it.href} style={{ "--i": i } as React.CSSProperties}>
                  <Link
                    href={it.href}
                    className="menu-sheet__link"
                    aria-current={it.href === pathname ? "page" : undefined}
                    onClick={() => {
                      if (it.href === pathname) setOpenOn(null);
                    }}
                  >
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
