import { expect, test } from "@playwright/test";

// Spec O10, CLAUDE.md rule 5: nothing public mentions malting. Runs every milestone; the
// route list grows with the site (the sitemap replaces it in M8).
const ROUTES = ["/", "/menu", "/events", "/visit", "/beer", "/about", "/no-such-page", "/robots.txt"];
const BANNED = /malting|malthouse|malt house/i;

for (const route of ROUTES) {
  test(`no malting on ${route}`, async ({ request }) => {
    const res = await request.get(route);
    const body = await res.text();
    expect(body.match(BANNED)?.[0] ?? null).toBeNull();
  });
}
