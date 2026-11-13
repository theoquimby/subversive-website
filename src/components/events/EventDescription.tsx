// The feed's description as plain paragraphs and a clean list, links autolinked (spec §6.3).
import { type DescPart, renderDescription } from "@/lib/events/description";

function Parts({ parts }: { parts: DescPart[] }) {
  return parts.map((p, i) =>
    "href" in p ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: a fixed split of one string
      <a key={i} href={p.href} target="_blank" rel="noopener">
        {p.text}
      </a>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: a fixed split of one string
      <span key={i}>{p.text}</span>
    ),
  );
}

export function EventDescription({ text }: { text: string }) {
  const blocks = renderDescription(text);
  if (blocks.length === 0) return null;
  return (
    <div className="event-desc">
      {blocks.map((b, i) =>
        b.type === "p" ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: blocks have no identity beyond order
          <p key={i}>
            <Parts parts={b.parts} />
          </p>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: blocks have no identity beyond order
          <ul key={i}>
            {b.items.map((item, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list items have no identity beyond order
              <li key={j}>
                <Parts parts={item} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
