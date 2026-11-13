// Wordmark (spec §3.1). The V of SUBVERSIVE is one long slash with a short arm.
//   loud     — the name in Caprasimo, the v replaced by an accent parallelogram cut at the
//              slash angle (the hero and footer version). Mixed case: Sub/ersive.
//   heritage — thin geometric caps, wide tracking; used small (metadata, seal, small print).
// Both are read as "Subversive" by assistive tech.
import { slashBand, toPoints } from "./slash";

// Slash proportions in em, estimated against Caprasimo: it stands on the baseline and
// reaches the ascender; its thickness matches the face's heavy stems.
const SLASH = slashBand({ height: 100, thickness: 21 });
const SLASH_W = 21 + (SLASH[3]?.[0] ?? 0);

export function Wordmark({
  variant = "loud",
  className,
  name = "Subversive",
}: {
  variant?: "loud" | "heritage";
  className?: string;
  name?: string;
}) {
  if (variant === "heritage") return <HeritageWordmark className={className} name={name} />;
  return (
    <span className={["wordmark", className ?? ""].filter(Boolean).join(" ")} role="img" aria-label={name}>
      <span aria-hidden="true">Sub</span>
      <svg
        className="wordmark__slash"
        viewBox={`0 0 ${SLASH_W.toFixed(2)} 100`}
        aria-hidden="true"
        focusable="false"
        shapeRendering="geometricPrecision"
      >
        <polygon points={toPoints(SLASH)} />
      </svg>
      <span aria-hidden="true">ersive</span>
    </span>
  );
}

function HeritageWordmark({ className, name }: { className?: string; name: string }) {
  return (
    <svg
      viewBox="0 0 664 64"
      className={["wordmark-heritage", className ?? ""].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinejoin="round"
      role="img"
      focusable="false"
    >
      <title>{name}</title>
      <path d="M38 14C34 7 28 4 21 4 12 4 6 9 6 17c0 18 33 10 33 29 0 9-7 14-17 14-8 0-14-4-18-11" />
      <path d="M72 4v36c0 12 7 20 18 20s18-8 18-20V4" />
      <path d="M142 4v56h20c10 0 17-6 17-15s-7-14-17-14h-20m0-27h18c9 0 15 5 15 13.5S169 31 160 31" />
      <path d="M238 4 212 60 200 33" stroke="var(--accent)" strokeLinejoin="miter" />
      <path d="M302 4h-34v56h34M268 31h28" />
      <path d="M336 60V4h20c10 0 17 6 17 15s-7 15-17 15h-20m20 0 18 26" />
      <path d="M442 14c-4-7-10-10-17-10-9 0-15 5-15 13 0 18 33 10 33 29 0 9-7 14-17 14-8 0-14-4-18-11" />
      <path d="M478 4v56" />
      <path d="M510 4l24 56 24-56" />
      <path d="M626 4h-34v56h34M592 31h28" />
    </svg>
  );
}
