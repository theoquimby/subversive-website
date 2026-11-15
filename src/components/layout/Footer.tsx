// Footer (redesign 2026-11-15): on paper, like every page. The ground line from Home's
// first screen runs across its top; the wordmark at the header's size with the open-now
// line; three short columns (Visit · Do · Follow); the seal, small; the small print; the
// printed menu's checker closes the page. About half its old height on a phone.
// the global "Pause motion" control (§9.2). The open-now pill and hours summary arrive with
// lib/hours in M4; the goblin hatch with M7; the mailing list stays hidden until O6.
import { microcopy } from "@content/microcopy";
import { getSite } from "@/lib/site/site";
import { Checker } from "../graphics/Checker";
import { Seal } from "../graphics/Seal";
import { Wordmark } from "../graphics/Wordmark";
import { Link } from "../ui/Link";
import { OpenNow } from "../visit/OpenNow";
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
        preserveAspectRatio="none"
        className="site-footer__ground"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M0 44C80 40 130 20 200 24S300 46 380 40S520 14 600 22S720 46 800 38S930 18 1010 26S1130 44 1200 40" />
      </svg>
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <Link href="/" className="site-footer__word">
            <Wordmark name={site.name} />
          </Link>
          <OpenNow className="site-footer__open" />
        </div>
        <div className="site-footer__cols">
          <section aria-labelledby="f-visit">
            <h2 id="f-visit" className="site-footer__head">
              Visit
            </h2>
            <a href={site.links.map} {...ext}>
              {site.address.street}
              <br />
              {site.address.city}, {site.address.state} {site.address.zip}
            </a>
            <a href={`tel:${site.phone.tel}`} className="tabular">
              {site.phone.display}
            </a>
            <a href={`mailto:${site.email}`}>{microcopy.emailUs}</a>
          </section>
          <section aria-labelledby="f-do">
            <h2 id="f-do" className="site-footer__head">
              Do
            </h2>
            <a href={site.links.order} {...ext}>
              {microcopy.orderPickup}
            </a>
            <a href={site.links.eGiftCard} {...ext}>
              eGift cards
            </a>
            <a href={site.links.bandBookingForm} {...ext}>
              Book your band
            </a>
          </section>
          <section aria-labelledby="f-follow">
            <h2 id="f-follow" className="site-footer__head">
              Follow
            </h2>
            <a href={site.links.instagram} {...ext}>
              Instagram
            </a>
            <a href={site.links.facebook} {...ext}>
              Facebook
            </a>
          </section>
          <Seal spin className="site-footer__seal" />
        </div>
        <div className="site-footer__base">
          {/* each clause holds together; the line breaks only between them */}
          <p className="site-footer__small">
            <span>
              © {new Date().getFullYear()} {site.name}
            </span>{" "}
            <span>
              · {site.address.street}, {site.address.city} {site.address.state}
            </span>{" "}
            <span>· Please drink responsibly.</span>
          </p>
          <PauseMotion />
          {/* TODO(M7): the goblin hatch ("do not press" stamp) sits here. */}
        </div>
      </div>
      <Checker />
    </footer>
  );
}
