// Sourcing ledger (spec §4.8): a ruled grid, no icons. Label, maker, place, from
// site.json → sourcing. Two across on a phone, three on desktop beside the map.
import type { Site } from "@/lib/site/schema";

export function SourcingLedger({ sourcing }: { sourcing: Site["sourcing"] }) {
  return (
    <dl className="sourcing">
      {sourcing.map((s) => (
        <div key={s.what} className="sourcing__cell">
          <dt className="sourcing__what">{s.what}</dt>
          <dd className="sourcing__who">{s.who}</dd>
          <dd className="sourcing__where">{s.where}</dd>
        </div>
      ))}
    </dl>
  );
}
