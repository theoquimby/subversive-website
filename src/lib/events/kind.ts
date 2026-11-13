// Event kinds as the Ops feed sends them (plan §5.4). Unknown strings parse to "OTHER".
export const EVENT_KINDS = ["GAME", "MUSIC", "FESTIVAL", "OTHER", "HOLIDAY", "CLOSURE"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export function toEventKind(raw: string): EventKind {
  return (EVENT_KINDS as readonly string[]).includes(raw) ? (raw as EventKind) : "OTHER";
}

/** "Subversive Overtime: Knicks at Pacers" → "Knicks at Pacers" (plan smaller assumptions). */
export function displayTitleOf(title: string): string {
  return title.replace(/^Subversive Overtime:\s*/i, "").trim() || title;
}
