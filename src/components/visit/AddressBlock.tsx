// Address block (spec §6.4): the address in Display, then Directions and Call as
// full-width buttons in the thumb's reach on a phone, with the phone's note beneath.
import { visitLabels } from "@content/microcopy";
import type { Site } from "@/lib/site/schema";
import { Icon } from "../graphics/Icon";
import { DirectionsButton } from "./DirectionsButton";

export function AddressBlock({ site }: { site: Site }) {
  const { address, phone } = site;
  return (
    <div className="address-block">
      <address className="address-block__addr">
        <span>{address.street}</span>
        <span>
          {address.city}, {address.state} {address.zip}
        </span>
      </address>
      <div className="visit-actions">
        <DirectionsButton
          google={site.links.map}
          query={`${site.name}, ${address.street}, ${address.city}, ${address.state} ${address.zip}`}
        />
        <a className="btn btn--quiet visit-actions__btn" href={`tel:${phone.tel}`}>
          <Icon name="phone" className="btn__icon" />
          <span className="btn__label tabular">{visitLabels.call(phone.display)}</span>
        </a>
        <p className="visit-actions__note">{phone.note}</p>
      </div>
    </div>
  );
}
