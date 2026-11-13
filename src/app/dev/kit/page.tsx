import menu from "@content/menu.json";
import { CurvePlot } from "@/components/dev/CurvePlot";
import { SkinSwitch } from "@/components/dev/SkinSwitch";
import { Checker } from "@/components/graphics/Checker";
import { adjustments, cssVar, raw, semanticNames } from "@/styles/tokens";

// /dev/kit: every token, in either skin, set with real menu content (plan M0 item 14).
// M1 adds the graphic primitives; each later milestone adds its components and motion sheets.

type Beer = {
  name: string;
  style: string;
  abv: number;
  description: string;
  prices: { half: number; full: number };
};
const isBeerItem = (i: object): i is Beer => "abv" in i && "prices" in i;
const beer = menu.drinks[0]?.groups[0]?.items.find(isBeerItem);
const burgers = menu.food[0];

const ROLES: Record<string, string> = {
  paper: "Menu stock. Default background.",
  paperDeep: "Tinted panels, image placeholders.",
  card: "Raised surfaces on paper.",
  ink: "Text, rules, pills, checker.",
  pils: "The primary action; today and tonight.",
  ember: "Display accents and event dates. Large only.",
  emberDeep: "Ember for small text on paper.",
  emberGlow: "Ember on night: accent, accent text, CTA.",
  sky: "Kids, dogs, specials.",
  skyDeep: "Sky for small text; the focus ring on paper.",
  spruce: "Sourcing.",
  currant: "Sour beers, one sticker.",
  night: "Overtime background.",
  nightRaised: "Cards on night.",
  bone: "Text on night.",
  court: "Game nights. A fill only.",
  go: "The open-now dot.",
};

const TYPE = [
  { token: "--t-mega", range: "64–168", cls: "kit-t-mega", sample: "Beer." },
  { token: "--t-h1", range: "44–96", cls: "kit-t-h1", sample: "Burgers." },
  { token: "--t-h2", range: "30–52", cls: "kit-t-h2", sample: burgers?.title ?? "" },
  { token: "--t-h3", range: "21–26", cls: "kit-t-h3", sample: beer?.name ?? "" },
  {
    token: "--t-label",
    range: "13–14",
    cls: "kit-t-label",
    sample: `${beer?.style ?? ""} · ${beer?.abv ?? ""}%`,
  },
  { token: "--t-body", range: "16–17", cls: "kit-t-body", sample: burgers?.intro ?? "" },
  { token: "--t-small", range: "14–15", cls: "kit-t-small", sample: beer?.description ?? "" },
  {
    token: "--t-price",
    range: "15–17",
    cls: "kit-t-price tabular",
    sample: `${beer?.prices.half ?? ""} / ${beer?.prices.full ?? ""}`,
  },
] as const;

const SPACE = [4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96, 128];

const CURVES = [
  { name: "--ease-out", values: [0.2, 0.8, 0.2, 1], job: "Entrances, reveals" },
  { name: "--ease-in-out", values: [0.65, 0, 0.35, 1], job: "Wipes, page transitions" },
  { name: "--ease-stamp", values: [0.3, 1.6, 0.5, 1], job: "Stickers and stamps overshoot" },
  { name: "--ease-fall", values: [0.33, 0, 0.67, 0.33], job: "Under gravity, falling" },
  { name: "--ease-rise", values: [0.33, 0.67, 0.67, 1], job: "Under gravity, rising" },
] as const;

const DURATIONS = [
  { token: "--d-1", ms: 120, job: "Press" },
  { token: "--d-2", ms: 220, job: "Hover, small moves" },
  { token: "--d-3", ms: 420, job: "Reveals, panels" },
  { token: "--d-4", ms: 800, job: "Set pieces, once" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="kit-section" aria-labelledby={id}>
      <h2 id={id} className="kit-pill">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function KitPage() {
  return (
    <SkinSwitch>
      <Checker />
      <main id="main" className="kit-main">
        <header className="kit-head">
          <h1 className="kit-label">Dev kit · M0 foundation · Tokens</h1>
        </header>

        <Section id="kit-colour" title="Colour">
          <ul className="kit-swatches">
            {Object.entries(raw).map(([key, hex]) => (
              <li key={key} className="kit-swatch">
                <span className="kit-swatch__chip" style={{ background: `var(${cssVar(key)})` }} />
                <span className="kit-label">{cssVar(key)}</span>
                <code className="kit-code tabular">{hex}</code>
                <span className="kit-note">{ROLES[key]}</span>
              </li>
            ))}
          </ul>

          <h3 className="kit-sub">Semantic, this skin</h3>
          <ul className="kit-semantic">
            {semanticNames.map((name) => (
              <li key={name}>
                <span className="kit-semantic__chip" style={{ background: `var(${cssVar(name)})` }} />
                <span className="kit-label">{cssVar(name)}</span>
              </li>
            ))}
          </ul>

          <h3 className="kit-sub">Changed by the contrast test</h3>
          <ol className="kit-ledger">
            {adjustments.map((a) => (
              <li key={a.token}>
                <span className="kit-label">{a.token}</span>
                <span className="kit-code tabular">
                  {a.from} → {a.to}
                </span>
                <p className="kit-note">{a.why}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="kit-type" title="Type">
          <ol className="kit-type">
            {TYPE.map((t) => (
              <li key={t.token}>
                <div className="kit-type__meta">
                  <span className="kit-label">{t.token}</span>
                  <span className="kit-code tabular">{t.range} px</span>
                </div>
                <p className={t.cls}>{t.sample}</p>
              </li>
            ))}
          </ol>
        </Section>

        <div className="kit-split">
          <Section id="kit-space" title="Space">
            <ol className="kit-space">
              {SPACE.map((px, i) => (
                <li key={px}>
                  <span className="kit-label">--s-{i + 1}</span>
                  <span className="kit-space__bar" style={{ width: `var(--s-${i + 1})` }} />
                  <span className="kit-code tabular">{px}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="kit-shape" title="Shape">
            <div className="kit-shapes">
              <figure>
                <span className="kit-shape kit-shape--box" />
                <figcaption className="kit-label">--r-box 22</figcaption>
              </figure>
              <figure>
                <span className="kit-shape kit-shape--card" />
                <figcaption className="kit-label">--r-card 16</figcaption>
              </figure>
              <figure>
                <span className="kit-shape kit-shape--tag" />
                <figcaption className="kit-label">--r-tag 8</figcaption>
              </figure>
              <figure>
                <button type="button" className="kit-stamp">
                  Press
                </button>
                <figcaption className="kit-label">--shadow-press</figcaption>
              </figure>
            </div>
            <div className="kit-angles">
              {(["a", "b", "c"] as const).map((k) => (
                <figure key={k}>
                  <span className="kit-angle" style={{ rotate: `var(--rot-${k})` }} />
                  <figcaption className="kit-label">--rot-{k}</figcaption>
                </figure>
              ))}
            </div>
          </Section>
        </div>

        <Section id="kit-motion" title="Motion">
          <div className="kit-curves">
            {CURVES.map((c) => (
              <CurvePlot key={c.name} name={c.name} values={c.values} job={c.job} />
            ))}
          </div>
          <ol className="kit-durations">
            {DURATIONS.map((d) => (
              <li key={d.token}>
                <span className="kit-label">{d.token}</span>
                <span className="kit-durations__bar" style={{ width: `calc(${d.ms} / 800 * 100%)` }} />
                <span className="kit-code tabular">{d.ms} ms</span>
                <span className="kit-note">{d.job}</span>
              </li>
            ))}
          </ol>
        </Section>
      </main>
      <Checker />
    </SkinSwitch>
  );
}
