// Footer (second redesign 2026-11-16; Max: "some 2010 footer taking up a bunch of space").
// No column heads over link lists. The ground line is its top edge; then every link as one
// line of plain labels, and under it the useful facts set large in the display face (open
// now · address · phone); a colophon (the wordmark, the small print, Pause motion); the seal
// as a small stamp; the printed menu's checker closes the page. Styles: fx-footer.css.
// The goblin hatch joins in M7; the mailing list stays hidden until O6.
import { aboutLabels, inquiryLabels, microcopy } from "@content/microcopy";
import { getSite } from "@/lib/site/site";
import { Checker } from "../graphics/Checker";
import { Seal } from "../graphics/Seal";
import { Wordmark } from "../graphics/Wordmark";
import { HolidayScene } from "../season/Holiday";
import { Link } from "../ui/Link";
import { OpenNow } from "../visit/OpenNow";
import { GROUND_PATH } from "./ground";
import { PauseMotion } from "./PauseMotion";

export function Footer() {
  const site = getSite();
  const ext = { target: "_blank", rel: "noopener" } as const;
  // no skin of its own: paper on paper pages, night on the night pages
  return (
    <footer className="site-footer">
      {/* the ground line again, as on Home's first screen: the page ends where it began */}
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="xMinYMid slice"
        className="site-footer__ground"
        aria-hidden="true"
        focusable="false"
      >
        <path d={GROUND_PATH} />
        {/* a few weeks before a holiday, a small scene stands on the line */}
        <HolidayScene />
      </svg>
      <div className="site-footer__inner">
        <Link href="/" className="site-footer__word">
          <Wordmark name={site.name} />
        </Link>
        <Seal spin className="site-footer__seal" />
        {/* the three things people come to a footer for, large enough to tap without aiming */}
        <div className="site-footer__facts">
          <OpenNow className="site-footer__open" />
          <a href={site.links.map} {...ext} className="site-footer__fact">
            {/* street and town hold together; the line breaks only between them */}
            <span>{site.address.street},</span>{" "}
            <span>
              {site.address.city}, {site.address.state} {site.address.zip}
            </span>
          </a>
          <a href={`tel:${site.phone.tel}`} className="site-footer__fact tabular">
            {site.phone.display}
          </a>
        </div>
        <ul className="site-footer__links">
          <li>
            <a href={site.links.order} {...ext}>
              {microcopy.orderPickup}
            </a>
          </li>
          <li>
            <a href={site.links.eGiftCard} {...ext}>
              eGift cards
            </a>
          </li>
          <li>
            <Link href="/private-events">{inquiryLabels.title}</Link>
          </li>
          <li>
            <a href={site.links.bandBookingForm} {...ext}>
              Book your band
            </a>
          </li>
          <li>
            <Link href="/about">{aboutLabels.title}</Link>
          </li>
          <li>
            <a href={`mailto:${site.email}`}>{microcopy.emailUs}</a>
          </li>
          <li>
            <a href={site.links.instagram} {...ext}>
              Instagram
            </a>
          </li>
          <li>
            <a href={site.links.facebook} {...ext}>
              Facebook
            </a>
          </li>
        </ul>
        <p className="site-footer__small">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>{" "}
          <span>Please drink responsibly.</span>
        </p>
        <div className="site-footer__pause">
          <PauseMotion />
        </div>
        {/* TODO(M7): the goblin hatch ("do not press" stamp) sits beside Pause motion. */}
      </div>
      <Checker />
    </footer>
  );
}
