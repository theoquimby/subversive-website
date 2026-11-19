// A beer's own mark, in the pen: the motif from its label, redrawn (Doodle.tsx). The label
// itself is only ever on the can; this is the same idea in the page's hand. It stands at
// the head of the beer's view, and at the end of a library row for a beer not on the menu.
import type { DoodleName } from "../graphics/Doodle";

export const MOTIFS: Readonly<Partial<Record<string, DoodleName>>> = {
  "cheap-dills": "pickle",
  "chinga-la-migra": "monarch",
  "hoppy-american-lager": "hop",
  "camp-comet": "comet",
  "golden-lime": "calamansi",
};
