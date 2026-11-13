// Icons (spec §3.9): one component, one sprite. Stroke settings live here because an
// external <use> inherits from the referencing <svg>, not from the sprite file.
// Decorative by default; pass `title` when the icon is the only label for something.
import type { IconName } from "./icons.generated";

export type { IconName };

export function Icon({ name, title, className }: { name: IconName; title?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={["icon", `icon--${name}`, className ?? ""].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="miter"
      strokeLinecap="square"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <use href={`/brand/icons.svg#icon-${name}`} />
    </svg>
  );
}
