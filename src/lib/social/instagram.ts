// The brewery's latest Instagram posts, read with the Instagram API (Instagram Login,
// professional account): GET graph.instagram.com/me/media with a long-lived token from
// INSTAGRAM_ACCESS_TOKEN (server only; setup in docs/announcements-and-instagram.md).
// Cached for an hour under the "instagram" tag. Any failure (no token, an expired token,
// a bad answer, no network) gives an empty list, and the feed then renders nothing.
import { unstable_cache } from "next/cache";
import { z } from "zod";

export const INSTAGRAM_LIMIT = 5;
const FIELDS = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
const ALT_MAX = 200;

/** The image hosts Instagram serves media from; next.config.ts allows the same. */
export function isInstagramCdn(src: string): boolean {
  try {
    const u = new URL(src);
    return u.protocol === "https:" && /(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(u.hostname);
  } catch {
    return false;
  }
}

const mediaSchema = z.object({
  id: z.string().min(1),
  caption: z.string().nullish(),
  media_type: z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]),
  // omitted for some videos (copyrighted audio); thumbnail_url is then the picture
  media_url: z.url().nullish(),
  thumbnail_url: z.url().nullish(),
  permalink: z.url({ protocol: /^https$/, hostname: /^(www\.)?instagram\.com$/ }),
  timestamp: z.string().min(1),
});

const envelope = z.object({ data: z.array(z.unknown()) });

export interface InstagramPost {
  id: string;
  image: string;
  alt: string;
  href: string;
  timestamp: string;
}

/** The caption as alt text: one line, at most 200 characters, cut at a word. */
export function captionAlt(caption: string | null | undefined, fallback: string): string {
  const flat = (caption ?? "").replace(/\s+/g, " ").trim();
  if (!flat) return fallback;
  if (flat.length <= ALT_MAX) return flat;
  const cut = flat.slice(0, ALT_MAX);
  const space = cut.lastIndexOf(" ");
  return `${(space > ALT_MAX / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/** The API's answer as posts: each checked on its own; one with no usable picture is left out. */
export function parseMedia(json: unknown, fallbackAlt: string): InstagramPost[] {
  const env = envelope.parse(json);
  const out: InstagramPost[] = [];
  for (const raw of env.data) {
    const r = mediaSchema.safeParse(raw);
    if (!r.success) continue;
    const m = r.data;
    const image = m.media_type === "VIDEO" ? (m.thumbnail_url ?? null) : (m.media_url ?? null);
    if (!image || !isInstagramCdn(image)) continue;
    out.push({
      id: m.id,
      image,
      alt: captionAlt(m.caption, fallbackAlt),
      href: m.permalink,
      timestamp: m.timestamp,
    });
    if (out.length === INSTAGRAM_LIMIT) break;
  }
  return out;
}

async function fetchMedia(token: string): Promise<unknown> {
  const url = new URL("https://graph.instagram.com/me/media");
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("limit", String(INSTAGRAM_LIMIT));
  url.searchParams.set("access_token", token);
  // the result is cached below; the raw call (its URL carries the token) is not
  const res = await fetch(url, {
    cache: "no-store",
    redirect: "error",
    headers: { accept: "application/json" },
  });
  if (res.status !== 200) throw new Error(`instagram: HTTP ${res.status}`);
  return res.json();
}

const read = unstable_cache(
  async (fallbackAlt: string): Promise<InstagramPost[]> => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN ?? "";
    return parseMedia(await fetchMedia(token), fallbackAlt);
  },
  ["instagram-media"],
  { revalidate: 3600, tags: ["instagram"] },
);

/** The latest posts, newest first, at most five; [] when not set up or on any failure. */
export async function getInstagramPosts(fallbackAlt: string): Promise<InstagramPost[]> {
  if (!process.env.INSTAGRAM_ACCESS_TOKEN) return [];
  try {
    return await read(fallbackAlt);
  } catch (e) {
    // never log the URL: it carries the token
    console.warn(`instagram: feed not shown (${e instanceof Error ? e.message.slice(0, 80) : "error"})`);
    return [];
  }
}
