// Header (spec §4.1). Phone: barley + loud wordmark at left; Order and the menu button at
// right (Order sits in the thumb's reach on the right edge). Desktop: inline links with the
// active page marked by a solid kernel, Order at right. Holds still through page wipes
// (view-transition-name). Scroll behaviour lives in the HeaderScroll leaf.
import { getSite, NAV } from "@/lib/site/site";
import { BarleyMark } from "../graphics/BarleyMark";
import { Wordmark } from "../graphics/Wordmark";
import { Button } from "../ui/Button";
import { Link } from "../ui/Link";
import { HeaderScroll } from "./HeaderScroll";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";

export function Header() {
  const site = getSite();
  return (
    <header id="site-header" className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand">
          <BarleyMark className="brand__mark" />
          <Wordmark className="brand__word" name={site.name} />
        </Link>
        <nav className="site-nav" aria-label="Main">
          <NavLinks items={NAV} />
        </nav>
        <div className="site-header__actions">
          <Button href={site.links.order} external className="site-header__order">
            Order
          </Button>
          <MobileMenu
            nav={NAV}
            address={`${site.address.street}, ${site.address.city} ${site.address.state}`}
            mapHref={site.links.map}
            phone={site.phone}
            instagram={site.links.instagram}
            facebook={site.links.facebook}
          />
        </div>
      </div>
      <HeaderScroll />
    </header>
  );
}
