// Structured data (spec §8.7, plan §5.6). Brewery + Restaurant on every page from
// site.json. geo appears only once real coordinates for the building exist (plan smaller
// assumptions); Tuesday, closed, is simply absent from the opening hours.
import type { Site } from "@/lib/site/schema";
import { WEEKDAYS, type Weekday } from "@/lib/time/ny";

/** JSON for an inline <script type="application/ld+json">, with "<" escaped so no value can close the tag. */
export function jsonLdText(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const SCHEMA_DAY: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function placeJsonLd(site: Site, siteUrl: string): Record<string, unknown> {
  const base = siteUrl.replace(/\/$/, "");
  const hours = WEEKDAYS.flatMap((w) => {
    const h = site.hours[w];
    return h
      ? [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: `https://schema.org/${SCHEMA_DAY[w]}`,
            opens: h.open,
            closes: h.close,
          },
        ]
      : [];
  });
  return {
    "@context": "https://schema.org",
    "@type": ["Brewery", "Restaurant"],
    name: site.legalOrLongName,
    alternateName: site.name,
    description: site.descriptor,
    url: `${base}/`,
    telephone: site.phone.tel,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.zip,
      addressCountry: "US",
    },
    ...(site.address.geo
      ? {
          geo: { "@type": "GeoCoordinates", latitude: site.address.geo.lat, longitude: site.address.geo.lng },
        }
      : {}),
    openingHoursSpecification: hours,
    servesCuisine: ["Burgers"],
    menu: `${base}/menu`,
    acceptsReservations: false,
    sameAs: [site.links.instagram, site.links.facebook],
  };
}
