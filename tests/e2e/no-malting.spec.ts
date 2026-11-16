import { expect, test } from "@playwright/test";

// Spec O10, CLAUDE.md rule 5: nothing public mentions malting. Runs every milestone; the
// route list grows with the site (the sitemap replaces it in M8). One exception (Theo,
// 2026-11-16): the brewing-process drawing on /beer may show its malting stage, so on /beer
// that one section is cut out before the page is checked, and only that section.
const ROUTES = [
  "/",
  "/menu",
  "/events",
  "/visit",
  "/beer",
  "/about",
  "/private-events",
  "/no-such-page",
  "/robots.txt",
];
const BANNED = /malting|malthouse|malt house/i;

/** The page's HTML with the brewing drawing's section removed (its <section> to its </section>). */
function withoutBrewSection(html: string): string {
  const open = html.search(/<section[^>]*class="[^"]*\bbrew-section\b/);
  if (open < 0) return html;
  // walk to the matching close tag, counting nested sections
  const tag = /<\/?section\b/g;
  tag.lastIndex = open + 1;
  let depth = 1;
  for (let m = tag.exec(html); m; m = tag.exec(html)) {
    depth += m[0] === "<section" ? 1 : -1;
    if (depth === 0) {
      const end = html.indexOf(">", m.index) + 1;
      return html.slice(0, open) + html.slice(end);
    }
  }
  return html.slice(0, open);
}

for (const route of ROUTES) {
  test(`no malting on ${route}`, async ({ request }) => {
    const res = await request.get(route);
    let body = await res.text();
    if (route === "/beer") body = withoutBrewSection(body);
    expect(body.match(BANNED)?.[0] ?? null).toBeNull();
  });
}
