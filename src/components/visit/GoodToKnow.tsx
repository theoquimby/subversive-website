// Good to know (spec §6.4, plan §2 item 11): one ruled ledger of four rows rather than
// four icon boxes (the feature-row tell of a generated site, §3A). The icon sits in the
// label column only; every sentence is the site's own (site.json → visit).
import { visitLabels } from "@content/microcopy";
import type { Site } from "@/lib/site/schema";
import { Icon, type IconName } from "../graphics/Icon";

export function GoodToKnow({ visit }: { visit: Site["visit"] }) {
  const rows: { icon: IconName; label: string; text: string; tag?: string }[] = [
    { icon: "clock", label: visitLabels.seating, text: visit.seating },
    { icon: "tent", label: visitLabels.tent, text: visit.tent },
    { icon: "parking", label: visitLabels.parking, text: visit.parking },
    { icon: "dog", label: visitLabels.dogs, text: visit.dogs, tag: visitLabels.dogsTag },
  ];
  return (
    <dl className="ledger">
      {rows.map((r) => (
        <div key={r.label} className="ledger__row">
          <dt className="ledger__label">
            <Icon name={r.icon} className="ledger__icon" />
            {r.label}
          </dt>
          <dd className="ledger__text">
            {r.tag ? <span className="tag-sky">{r.tag}</span> : null}
            <span>{r.text}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
