// Square Catalog source (spec §8.4): open item O3, not built. Kept as a stub so the
// MenuSource seam exists and choosing it fails loudly instead of serving an empty menu.
import type { MenuSource } from "./source";

export const squareMenuSource: MenuSource = {
  getMenu() {
    return Promise.reject(new Error("squareMenuSource is not built (spec O3)"));
  },
};
