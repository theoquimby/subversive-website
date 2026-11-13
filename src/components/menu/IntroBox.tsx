// Section intro box (spec §4.5): the outlined rounded box from the printed menu. Producer
// names (from site.json → sourcing) are set in Text 600; the modifiers line sits beneath
// in muted upright type (plan Q8: no italic file).
import { Fragment } from "react";

function emphasise(text: string, names: readonly string[]) {
  const found = names.filter((n) => n && text.includes(n));
  if (found.length === 0) return text;
  const escaped = found.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "g"));
  return parts.map((p, i) =>
    found.includes(p) ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: a fixed split of one string
      <strong key={i}>{p}</strong>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: a fixed split of one string
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}

export function IntroBox({
  intro,
  modifiers,
  producers,
}: {
  intro: string;
  modifiers?: string;
  producers: readonly string[];
}) {
  return (
    <div className="intro-box">
      <p className="intro-box__text">{emphasise(intro, producers)}</p>
      {modifiers ? <p className="intro-box__mods">{modifiers}</p> : null}
    </div>
  );
}
