// House sauces (spec §6.2): a compact two-column definition list, not rows.
import { menuLabels } from "@content/microcopy";
import type { ItemView } from "@/lib/menu/view";

export function SauceList({ items }: { items: ItemView[] }) {
  return (
    <dl className="sauces">
      {items.map(({ id, item }) => (
        <div key={id} id={id} className="sauces__item" data-row={id}>
          <dt className="sauces__name">
            {item.name}
            {item.tags?.map((t) => (
              <span key={t} className="mtag">
                {menuLabels.tags[t]}
              </span>
            ))}
          </dt>
          {item.description ? <dd className="sauces__desc">{item.description}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
