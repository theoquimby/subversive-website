// Photo frame (spec §3.7): a designed frame at a designed ratio. On Paper: radius 22 and the
// one 2 px ink stroke; `bleed` drops the frame (heroes, Overtime). A photo is simply there:
// it is fetched with the page (not when scrolled to) and never wipes or sweeps in (Theo,
// 2026-11-16: "photos should be pre loaded, they should never do the weird scan in effect").
// Hover scales the image 1.03 inside its fixed frame. Never past the files' 1500 px.
import { type PhotoId, photos } from "@content/photos";
import Image from "next/image";

export type Ratio = "4/3" | "1/1" | "3/2" | "16/10" | "4/5";

export function PhotoFrame({
  id,
  ratio = "4/3",
  sizes,
  bleed = false,
  priority = false,
  className,
}: {
  id: PhotoId;
  ratio?: Ratio;
  /** Written per use (spec §2.5): never 100vw by habit. */
  sizes: string;
  bleed?: boolean;
  priority?: boolean;
  /** no longer used: photos never animate in; kept so older call sites still compile */
  reveal?: boolean;
  className?: string;
}) {
  const p = photos[id];
  return (
    <figure
      className={["photo", bleed ? "photo--bleed" : "", className ?? ""].filter(Boolean).join(" ")}
      style={{ aspectRatio: ratio.replace("/", " / ") }}
    >
      <Image
        src={p.src}
        alt={p.alt}
        sizes={sizes}
        fill
        placeholder="blur"
        priority={priority}
        loading={priority ? undefined : "eager"}
        fetchPriority={priority ? "high" : undefined}
        style={{ objectFit: "cover", objectPosition: `${p.focal[0]}% ${p.focal[1]}%` }}
      />
    </figure>
  );
}
