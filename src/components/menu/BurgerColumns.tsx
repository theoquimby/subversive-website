// Burgers (spec §6.2): rows on a phone; from tablet width the three burgers stand as the
// printed menu's three boxed columns — name in a pill, the description in an outlined
// box, the price in a small pill beneath. One markup; a container query reflows it.
import type { ItemView } from "@/lib/menu/view";
import { MenuRow } from "./MenuRow";

export function BurgerColumns({ items }: { items: ItemView[] }) {
  return (
    <ul className="mlist mlist--burgers">
      {items.map((row, i) => (
        <MenuRow key={row.id} row={row} index={i} disclosure={false} />
      ))}
    </ul>
  );
}
