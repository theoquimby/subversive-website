// Photo frame (spec §3.7): a designed frame at a designed ratio. On Paper: radius 22 and the
// one 2 px ink stroke; `bleed` drops the frame (heroes, Overtime). Below the first screen the
// frame draws in (300 ms) and the photo is uncovered by a clip-path (420 ms) — set by
// StampIn through data-pop; at rest, and without JS or motion, it is simply there.
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
  reveal = !priority,
  className,
}: {
  id: PhotoId;
  ratio?: Ratio;
  /** Written per use (spec §2.5): never 100vw by habit. */
  sizes: string;
  bleed?: boolean;
  priority?: boolean;
  reveal?: boolean;
  className?: string;
}) {
  const p = photos[id];
  return (
    <figure
      className={["photo", bleed ? "photo--bleed" : "", className ?? ""].filter(Boolean).join(" ")}
      style={{ aspectRatio: ratio.replace("/", " / ") }}
      data-pop={reveal ? "" : undefined}
    >
      <Image
        src={p.src}
        alt={p.alt}
        sizes={sizes}
        fill
        placeholder="blur"
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        style={{ objectFit: "cover", objectPosition: `${p.focal[0]}% ${p.focal[1]}%` }}
      />
    </figure>
  );
}
