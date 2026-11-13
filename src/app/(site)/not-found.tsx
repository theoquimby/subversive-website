import menu from "@content/menu.json";
import type { Metadata } from "next";
import { GlassGlyph } from "@/components/graphics/GlassGlyph";
import { PageWipe } from "@/components/layout/PageWipe";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";

// 404 (spec §5.7): Paper, a mega headline, one line, three buttons, and their glass draining
// from 78% to empty on load (the fall curve: it empties under gravity). The goblin peeks in
// from the bottom right in M7.
// The house pils, from the tap list.
const PILS_COLOR = (menu.drinks[0]?.groups[0]?.items[0] as { color?: string } | undefined)?.color ?? "";

export const metadata: Metadata = {
  title: "Not found · Subversive, Catskill NY",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <PageWipe>
      <div className="page not-found">
        <div className="not-found__copy">
          <h1 className="not-found__title">This keg’s kicked.</h1>
          <p className="not-found__sub">That page is gone or never existed.</p>
          <div className="not-found__actions">
            <Button href="/menu">Menu</Button>
            <TextLink href="/events">Events</TextLink>
            <TextLink href="/">Home</TextLink>
          </div>
        </div>
        <GlassGlyph color={PILS_COLOR} fill={0.78} size="hero" mark={false} className="glass--drain" />
      </div>
    </PageWipe>
  );
}
