// One menu section (spec §6.2): its pill, the beer legend, the intro box, then groups of
// rows — or the burger columns, the sauce list, or the week's features by day.
import type { FeatureGroup } from "@/lib/menu/features";
import type { SectionView } from "@/lib/menu/view";
import { Pill } from "../layout/Pill";
import { BurgerColumns } from "./BurgerColumns";
import { IntroBox } from "./IntroBox";
import { MenuRow } from "./MenuRow";
import { SauceList } from "./SauceList";

const BURGERS = new Set(["smash-burgers", "impossible-burgers"]);

export function MenuSection({
  section: s,
  legend,
  features,
  producers,
}: {
  section: SectionView;
  /** "9 oz / 16 oz", once per section that prices two pours (spec §4.4) */
  legend?: string;
  features?: FeatureGroup[];
  producers: readonly string[];
}) {
  const items = s.groups.flatMap((g) => g.items);
  let body: React.ReactNode;
  if (BURGERS.has(s.id)) {
    body = <BurgerColumns items={items} />;
  } else if (s.id === "sauces") {
    body = <SauceList items={items} />;
  } else if (features) {
    body = features.map((f) => (
      <div key={f.title} className="mgroup">
        <h4 className="mgroup__head">
          <span className="mgroup__title">{f.title}</span>
          {f.label !== f.title ? <span className="mgroup__note">{f.label}</span> : null}
        </h4>
        <ul className="mlist">
          {f.items.map((row, i) => (
            <MenuRow key={row.id} row={row} index={i} />
          ))}
        </ul>
      </div>
    ));
  } else {
    body = s.groups.map((g, gi) => (
      <div key={g.title ?? gi} className="mgroup">
        {g.title ? (
          <h4 className="mgroup__head">
            <span className="mgroup__title">{g.title}</span>
            {g.note ? <span className="mgroup__note">{g.note}</span> : null}
          </h4>
        ) : g.note ? (
          <p className="mgroup__head mgroup__head--note">
            <span className="mgroup__note">{g.note}</span>
          </p>
        ) : null}
        <ul className="mlist">
          {g.items.map((row, i) => (
            <MenuRow key={row.id} row={row} index={i} />
          ))}
        </ul>
      </div>
    ));
  }

  return (
    <section
      id={s.id}
      className={["msec", BURGERS.has(s.id) ? "msec--burgers" : "", legend ? "msec--pours" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={`${s.id}-title`}
      data-section={s.id}
    >
      <div className="msec__head">
        <Pill as="h3" id={`${s.id}-title`}>
          {s.title}
        </Pill>
        {legend ? (
          <p className="msec__legend" aria-hidden="true">
            {legend}
          </p>
        ) : null}
      </div>
      {s.note && !legend ? <p className="msec__note">{s.note}</p> : null}
      {legend && s.note ? <p className="sr-only">{s.note}</p> : null}
      {s.intro ? <IntroBox intro={s.intro} modifiers={s.modifiers} producers={producers} /> : null}
      {body}
    </section>
  );
}
