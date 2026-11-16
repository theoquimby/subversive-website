// A small pen drawing for the kind of night it is (2026-11-15): a ball for a game, a note
// for music, bunting for a festival, a question mark for trivia, a star for anything else.
// Drawn in the site's hand, no team or league marks (spec §4.7). Decorative: the title
// beside it says what the night is.
import type { EventKind } from "@/lib/events/kind";

const MARKS: Record<string, string[]> = {
  game: [
    "M12 3.2C7 3.1 3.1 7.2 3.2 12.1C3.3 17 7.2 20.9 12.1 20.8C17 20.7 20.9 16.8 20.8 11.9C20.7 7 16.9 3.3 12 3.2",
    "M12.2 3.4C11.5 9 11.6 15 12 20.6",
    "M3.4 11.6C8 12.6 16 12.5 20.6 11.4",
    "M6.2 5.6C9.2 9 9.3 15.2 6 18.3",
    "M17.9 5.7C14.8 9.2 14.9 15 18 18.2",
  ],
  music: [
    "M9.2 17.4V5.6L18.2 4V15.4",
    "M9.2 17.4C9.2 19 7.9 19.9 6.6 19.8C5.2 19.7 4.4 18.6 4.8 17.5C5.3 16.2 7.6 15.6 9.2 17.4",
    "M18.2 15.4C18.2 17 16.9 17.9 15.6 17.8C14.2 17.7 13.4 16.6 13.8 15.5C14.3 14.2 16.6 13.6 18.2 15.4",
    "M9.2 9.2L18.2 7.6",
  ],
  festival: [
    "M2.6 5.6C8 9.4 16 9.5 21.4 5.4",
    "M5.4 7.4L6.4 12.6L9.2 8.6",
    "M10.6 8.9L12 14.2L13.8 8.9",
    "M15.2 8.6L17.9 12.5L18.8 7.2",
  ],
  trivia: [
    "M8.4 8.6C8.3 5.6 10.9 3.9 13.1 4.3C15.7 4.8 16.7 7.5 15.1 9.5C13.9 11 12.3 11.5 12.2 14.2",
    "M12.2 18.1C12.6 18.1 12.9 18.4 12.9 18.8C12.9 19.2 12.6 19.5 12.2 19.5C11.8 19.5 11.5 19.2 11.5 18.8C11.5 18.4 11.8 18.1 12.2 18.1",
  ],
  other: ["M12 3.6L13.9 9.5L20.2 10.1L15.3 13.9L16.9 20L12 16.5L7.1 20.1L8.8 13.9L3.9 10.2L10.1 9.6Z"],
};

export function markFor(kind: EventKind, title: string): keyof typeof MARKS {
  if (kind === "GAME") return "game";
  if (kind === "MUSIC") return "music";
  if (kind === "FESTIVAL") return "festival";
  if (/trivia|quiz/i.test(title)) return "trivia";
  return "other";
}

export function EventMark({
  kind,
  title,
  className,
}: {
  kind: EventKind;
  title: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ? `emark ${className}` : "emark"}
      aria-hidden="true"
      focusable="false"
    >
      {(MARKS[markFor(kind, title)] ?? []).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
