// /menu (spec §6.2): the page people open most, standing outside or at a table. Static,
// revalidated hourly; the seasonal cut uses New York's date at render. Everything that
// depends on the reader (list, today, filters) happens in the browser over this HTML.
import { menuLabels } from "@content/microcopy";
import type { Metadata } from "next";
import { PageWipe } from "@/components/layout/PageWipe";
import { MenuEnhancer } from "@/components/menu/MenuEnhancer";
import { MenuSection } from "@/components/menu/MenuSection";
import { MenuTabs } from "@/components/menu/MenuTabs";
import { menuBootScript } from "@/components/menu/menu-boot";
import { OrderBar } from "@/components/menu/OrderBar";
import { PourLine } from "@/components/menu/PourLine";
import { type Chip, SectionChips } from "@/components/menu/SectionChips";
import { TodayFeatures } from "@/components/menu/TodayFeatures";
import { Under21Note } from "@/components/menu/Under21Note";
import { OpenNow } from "@/components/visit/OpenNow";
import { weeklyFeatures } from "@/lib/menu/features";
import { isBeer } from "@/lib/menu/kinds";
import { applySeasonal } from "@/lib/menu/seasonal";
import { getMenu } from "@/lib/menu/source";
import { buildMenuView, draftBeers, type ItemView, type SectionView } from "@/lib/menu/view";
import { getSite } from "@/lib/site/site";
import { now } from "@/lib/time/now";
import { formatMonthDay, nyParts } from "@/lib/time/ny";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Menu · Subversive, Catskill NY",
  description: "Draft beer, smash burgers and takeout at Subversive, 96 West Bridge Street, Catskill NY.",
};

function chipsFor(sections: SectionView[]): Chip[] {
  const chips: Chip[] = [];
  for (const s of sections) {
    const same = chips.find((c) => c.label === s.chip);
    if (same) same.sections.push(s.id);
    else chips.push({ id: s.id, label: s.chip, sections: [s.id] });
  }
  return chips;
}

const idsOf = (sections: SectionView[]) =>
  sections.flatMap((s) => [s.id, ...s.groups.flatMap((g) => g.items.map((i) => i.id))]);

// only what the filters read crosses to the client
const slim = (i: ItemView): ItemView => ({
  id: i.id,
  sectionId: i.sectionId,
  ...(i.family ? { family: i.family } : {}),
  item: isBeer(i.item)
    ? { name: i.item.name, style: i.item.style, abv: i.item.abv, prices: i.item.prices, color: i.item.color }
    : { name: i.item.name, ...(i.item.tags ? { tags: i.item.tags } : {}) },
});

export default async function MenuPage() {
  const site = getSite();
  const view = buildMenuView(applySeasonal(await getMenu(), nyParts(now()).date));
  const features = weeklyFeatures(view);
  const legend = `${view.pourSizes.half} / ${view.pourSizes.full}`;
  const producers = site.sourcing.flatMap((s) => s.who.split(" · "));
  const dishes = view.food.flatMap((s) => s.groups.flatMap((g) => g.items)).map(slim);

  return (
    <PageWipe>
      <div className="page page--menu">
        <header className="menu-head">
          <h1 className="page__title">Menu</h1>
          <OpenNow className="menu-head__open" />
          <p className="menu-head__updated">
            <time dateTime={view.updated}>{menuLabels.updated(formatMonthDay(view.updated))}</time>
          </p>
          <Under21Note />
        </header>

        <div className="menu" data-menu="" suppressHydrationWarning>
          <script
            // biome-ignore lint/security/noDangerouslySetInnerHtml: our own pre-paint script, built from menu ids
            dangerouslySetInnerHTML={{ __html: menuBootScript(idsOf(view.drinks), idsOf(view.food)) }}
          />
          <span className="menu-bar-sentinel" aria-hidden="true" />
          <nav className="menu-bar" aria-label={menuLabels.sections}>
            <div className="menu-bar__row">
              <MenuTabs beers={draftBeers(view).map(slim)} dishes={dishes} />
              <p className="menu-bar__nojs">
                <a href="#drinks">{menuLabels.drinks}</a>
                <a href="#food">{menuLabels.food}</a>
              </p>
            </div>
            <SectionChips drinks={chipsFor(view.drinks)} food={chipsFor(view.food)} />
          </nav>

          <section id="drinks" className="menu-list" data-list="drinks" aria-labelledby="drinks-title">
            <h2 id="drinks-title" className="sr-only">
              {menuLabels.drinks}
            </h2>
            {view.drinks.map((s) => (
              <MenuSection
                key={s.id}
                section={s}
                legend={s.id === "house-beer" ? legend : undefined}
                producers={producers}
              />
            ))}
          </section>

          <section id="food" className="menu-list" data-list="food" aria-labelledby="food-title">
            <h2 id="food-title" className="sr-only">
              {menuLabels.food}
            </h2>
            <TodayFeatures groups={features} />
            {view.food.map((s) => (
              <MenuSection
                key={s.id}
                section={s}
                features={s.id === "weekly-features" ? features : undefined}
                producers={producers}
              />
            ))}
          </section>

          <footer className="menu-notices">
            {view.notices.map((n) => (
              <p key={n}>{n}</p>
            ))}
          </footer>
        </div>
      </div>
      <OrderBar orderUrl={site.links.order} />
      <PourLine drinks={view.drinks.map((s) => s.id)} food={view.food.map((s) => s.id)} />
      <MenuEnhancer />
    </PageWipe>
  );
}
