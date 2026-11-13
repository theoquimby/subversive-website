// Feed descriptions as clean blocks (spec §6.3): paragraphs on blank lines; lines that
// start with an emoji or a bullet become list items with the marker stripped; bare URLs
// become links. Nothing else is interpreted (no HTML, no markdown).
export type DescPart = { text: string } | { href: string; text: string };
export type DescBlock = { type: "p"; parts: DescPart[] } | { type: "list"; items: DescPart[][] };

const MARKER = /^\s*(?:\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*|[•·\-*–])\s*/u;
const URL = /https?:\/\/[^\s<>"]+/g;

function linkify(text: string): DescPart[] {
  const parts: DescPart[] = [];
  let last = 0;
  for (const m of text.matchAll(URL)) {
    let href = m[0];
    const trail = /[.,;:!?)]+$/.exec(href)?.[0] ?? "";
    href = href.slice(0, href.length - trail.length);
    const start = m.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ href, text: href.replace(/^https?:\/\//, "").replace(/\/$/, "") });
    last = start + href.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

export function renderDescription(text: string): DescBlock[] {
  const blocks: DescBlock[] = [];
  for (const chunk of text.replace(/\r\n?/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    let para: string[] = [];
    let list: DescPart[][] = [];
    const flushPara = () => {
      if (para.length) blocks.push({ type: "p", parts: linkify(para.join(" ")) });
      para = [];
    };
    const flushList = () => {
      if (list.length) blocks.push({ type: "list", items: list });
      list = [];
    };
    for (const line of lines) {
      if (MARKER.test(line)) {
        flushPara();
        list.push(linkify(line.replace(MARKER, "")));
      } else {
        flushList();
        para.push(line);
      }
    }
    flushPara();
    flushList();
  }
  return blocks;
}
