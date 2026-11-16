// The five latest Instagram posts: square pictures, each opening its post on Instagram in
// a new tab, the caption as the picture's alt text. Renders nothing until
// INSTAGRAM_ACCESS_TOKEN is set, and nothing whenever Instagram does not answer well.
// Not placed on any page yet. Styles: src/styles/fx-announce.css (.ig-feed).
import { socialLabels } from "@content/microcopy";
import Image from "next/image";
import { getInstagramPosts } from "@/lib/social/instagram";

export async function InstagramFeed({ className }: { className?: string }) {
  const posts = await getInstagramPosts(socialLabels.post);
  if (posts.length === 0) return null;
  return (
    <ul
      className={["ig-feed", className ?? ""].filter(Boolean).join(" ")}
      aria-label={socialLabels.instagram}
    >
      {posts.map((p) => (
        <li key={p.id}>
          <a className="ig-feed__post" href={p.href} target="_blank" rel="noopener">
            <Image src={p.image} alt={p.alt} fill sizes="(min-width: 48rem) 20vw, 42vw" />
          </a>
        </li>
      ))}
    </ul>
  );
}
