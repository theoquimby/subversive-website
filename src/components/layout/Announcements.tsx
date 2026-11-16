// The announcement band (Ops → announcements): directly under the header on every page,
// one line per announcement, at most three, only those that stand today in New York.
// Renders nothing when Ops sends none (today: always). Max's words, as he typed them;
// a link, when he gives one, at the end of the line. Styles: src/styles/fx-announce.css.
import { announceLabels } from "@content/microcopy";
import Link from "next/link";
import { getLiveSite } from "@/lib/site/ops";
import { now } from "@/lib/time/now";
import { nyParts } from "@/lib/time/ny";
import { Icon } from "../graphics/Icon";
import { AnnouncementLine } from "./AnnouncementLine";

export async function Announcements() {
  const { announcements } = await getLiveSite(nyParts(now()).date);
  if (announcements.length === 0) return null;
  return (
    <section className="announce" aria-label={announceLabels.region}>
      <ul className="announce__list">
        {announcements.map((a) => (
          <AnnouncementLine key={a.id} id={a.id} tone={a.tone}>
            <span>{a.text}</span>
            {a.link ? (
              <>
                {" "}
                {a.link.href.startsWith("/") ? (
                  <Link className="announce__link" href={a.link.href}>
                    {a.link.label}
                  </Link>
                ) : (
                  <a className="announce__link" href={a.link.href} target="_blank" rel="noopener">
                    {a.link.label}
                    <Icon name="external" className="announce__ext" />
                  </a>
                )}
              </>
            ) : null}
          </AnnouncementLine>
        ))}
      </ul>
    </section>
  );
}
