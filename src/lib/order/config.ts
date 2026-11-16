// Whether ordering is on, whether the kitchen is taking orders right now, and which of the
// menu's items can be ordered (with their sizes and options). Built on the server for the
// browser and for the order routes, from the same catalog, so they can never disagree.
import { hoursEvents } from "@/components/visit/OpenNow";
import { statusAt } from "../hours/status";
import { applySeasonal } from "../menu/seasonal";
import { getMenu } from "../menu/source";
import { menuItemKey } from "../menu/square-prices";
import { buildMenuView } from "../menu/view";
import { getSite } from "../site/site";
import { type SquareEnv, squareEnv } from "../square/api";
import { now } from "../time/now";
import { nyParts } from "../time/ny";
import { type Orderable, readCatalog } from "./catalog";
import { PREP_MINUTES } from "./order";

export interface OrderConfig {
  enabled: boolean;
  /** true while it is wired to Square's sandbox: no real money moves */
  sandbox: boolean;
  applicationId: string;
  locationId: string;
  /** the kitchen is open now */
  open: boolean;
  prepMinutes: number;
  /** menu item id → what Square will take an order for */
  items: Record<string, Orderable>;
}

export const ORDERING_OFF: OrderConfig = {
  enabled: false,
  sandbox: true,
  applicationId: "",
  locationId: "",
  open: false,
  prepMinutes: PREP_MINUTES,
  items: {},
};

export async function orderConfig(): Promise<{ env: SquareEnv | null; config: OrderConfig }> {
  const env = squareEnv();
  if (!env) return { env: null, config: ORDERING_OFF };
  const instant = now();
  const catalog = new Map(await readCatalog(env));
  const view = buildMenuView(applySeasonal(await getMenu(), nyParts(instant).date));
  const items: Record<string, Orderable> = {};
  // food only: draft beer is not sold to go, and cans wait on an age check (Max to decide)
  for (const section of view.food)
    for (const group of section.groups)
      for (const row of group.items) {
        const found = catalog.get(menuItemKey(row.item.name));
        if (found) items[row.id] = found;
      }
  const status = statusAt(instant, getSite(), await hoursEvents());
  return {
    env,
    config: {
      enabled: true,
      sandbox: env.sandbox,
      applicationId: env.applicationId,
      locationId: env.locationId,
      open: status.kind === "open" || status.kind === "open-late",
      prepMinutes: PREP_MINUTES,
      items,
    },
  };
}
