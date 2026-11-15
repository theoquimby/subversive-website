import type { Metadata } from "next";
import { Drawing } from "@/components/home/Ways";
import { PageWipe } from "@/components/layout/PageWipe";
import { Button } from "@/components/ui/Button";
import { TextLink } from "@/components/ui/TextLink";

// 404 (redesign 2026-11-15): the headline, one line, the ways back, and the house glass
// drawn empty in pen with one last drop, in the same hand as the rest of the site.
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
        <Drawing name="empty" className="not-found__art" />
      </div>
    </PageWipe>
  );
}
