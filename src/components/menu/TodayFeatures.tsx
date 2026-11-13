// Today's features (spec §6.2, §8.4): a pils box at the top of Food on the day a feature
// runs. Every box is in the HTML and hidden; the pre-paint script sets data-today on the
// menu wrapper and CSS shows the matching one, so cached HTML is never wrong and nothing
// shifts after hydration. The rows themselves stay in "This week"; the box links to them.
import type { FeatureGroup } from "@/lib/menu/features";
import { rowPrice } from "./MenuRow";

export function TodayFeatures({ groups }: { groups: FeatureGroup[] }) {
  return groups.map((g) => (
    <aside key={g.title} className="today" data-days={g.days.join(" ")} aria-label={g.title}>
      <p className="today__title">{g.title}</p>
      <ul className="today__list">
        {g.items.map((row) => (
          <li key={row.id}>
            <a href={`#${row.id}`} className="today__item">
              <span className="today__name">{row.item.name}</span>
              <span className="today__price">{rowPrice(row)}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  ));
}
