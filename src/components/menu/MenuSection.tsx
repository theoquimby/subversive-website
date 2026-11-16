// One menu section (spec §6.2): its name on the ink line, the beer legend, the intro, then
// groups of rows, or the week's features by day. Every item is the same kind of row.
import type { FeatureGroup } from "@/lib/menu/features";
import type { SectionView } from "@/lib/menu/view";
import { SectionHead } from "../layout/SectionHead";
import { IntroBox } from "./IntroBox";
import { MenuRow } from "./MenuRow";

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
  let body: React.ReactNode;
  if (features) {
    body = features.map((f) => (
      <div key={f.title} className="mgroup">
        <h4 className="mgroup__head">
          <span className="mgroup__title">{f.title}</span>
          {f.label !== f.title ? <span className="mgroup__note">{f.label}</span> : null}
        </h4>
        <ul className="mlist">
          {f.items.map((row, i) => (
            <MenuRow key={row.id} row={row} index={i} detail />
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
            <MenuRow key={row.id} row={row} index={i} detail />
          ))}
        </ul>
      </div>
    ));
  }

  return (
    <section
      id={s.id}
      className={legend ? "msec msec--pours" : "msec"}
      aria-labelledby={`${s.id}-title`}
      data-section={s.id}
    >
      {/* the section's name on the ink line; the pour sizes sit at the line's end */}
      <SectionHead as="h3" id={`${s.id}-title`} note={legend}>
        {s.title}
      </SectionHead>
      {s.note && !legend ? <p className="msec__note">{s.note}</p> : null}
      {legend && s.note ? <p className="sr-only">{s.note}</p> : null}
      {s.intro ? <IntroBox intro={s.intro} modifiers={s.modifiers} producers={producers} /> : null}
      {body}
    </section>
  );
}
