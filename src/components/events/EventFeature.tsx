// The richer part of a featured event's page (Oktoberfest and the like), from Ops →
// event.page: a photograph, Max's intro, his sections on the ink line, the running order
// and his links. Every part is optional and renders only when Ops sends it; with no
// `page` the event page is exactly as before. Styles: src/styles/fx-announce.css.
import { eventPageLabels } from "@content/microcopy";
import Image from "next/image";
import { opsImage } from "@/lib/events/feature";
import type { EventPage } from "@/lib/events/schema";
import { SectionHead } from "../layout/SectionHead";
import { ExternalLink } from "../ui/TextLink";
import { EventDescription } from "./EventDescription";

export function EventFeature({ page, title }: { page: EventPage | undefined; title: string }) {
  if (!page) return null;
  const hero = opsImage(page.hero, process.env.NEXT_PUBLIC_OPS_ORIGIN ?? "");
  const sections = page.sections ?? [];
  const schedule = page.schedule ?? [];
  const links = page.links ?? [];
  if (!hero && !page.intro && sections.length + schedule.length + links.length === 0) return null;

  return (
    <div className="event-feature">
      {hero ? (
        <figure className="event-feature__hero">
          <Image src={hero} alt={page.heroAlt ?? title} fill sizes="(min-width: 75rem) 70rem, 100vw" />
        </figure>
      ) : null}
      {page.intro ? <p className="event-feature__intro">{page.intro}</p> : null}
      {sections.map((s, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: sections have no identity beyond their order in Ops
        <section key={i} className="event-feature__sec" aria-labelledby={`feature-sec-${i}`}>
          <SectionHead id={`feature-sec-${i}`}>{s.title}</SectionHead>
          <EventDescription text={s.body} />
        </section>
      ))}
      {schedule.length > 0 ? (
        <section className="event-feature__sec" aria-labelledby="feature-schedule">
          <SectionHead id="feature-schedule">{eventPageLabels.schedule}</SectionHead>
          <ol className="event-schedule">
            {schedule.map((r, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: rows have no identity beyond their order
              <li key={i}>
                <span className="event-schedule__time">{r.time}</span>
                <span>{r.what}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {links.length > 0 ? (
        <section className="event-feature__sec" aria-labelledby="feature-links">
          <SectionHead id="feature-links">{eventPageLabels.links}</SectionHead>
          <ul className="event-feature__links">
            {links.map((l) => (
              <li key={l.href}>
                <ExternalLink href={l.href}>{l.label}</ExternalLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
