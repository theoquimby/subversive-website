"use client";

// One menu item, looked at closely (Theo asked for it; review pass 2026-11-15). A tap on a
// row opens a sheet with what the row says, set large: a photo when the item has one (no
// placeholder when it has not), the glass poured in the beer's colour for a beer, the name on the
// ink line, the price by pour size, the whole description, the tags and the add-ons.
// The address gains ?item=<id>, so Back closes the sheet and the link can be shared; the
// left and right arrow keys step through the list. Nothing is sent to the browser twice:
// the sheet reads the row that is already in the page.
import { brewLabels, menuLabels } from "@content/microcopy";
import { Dialog } from "radix-ui";
import { type KeyboardEvent, useCallback, useEffect, useState } from "react";
import type { Show } from "@/lib/menu/filters";
import { AddToOrder } from "../order/AddToOrder";
import { Sheet } from "../ui/Sheet";
import { TextLink } from "../ui/TextLink";
import { ItemGlass } from "./ItemGlass";
import { setShow } from "./show-store";

interface Detail {
  id: string;
  list: Show;
  name: string;
  meta: string;
  badge: string;
  desc: string;
  tags: string[];
  /** [pour size, price] pairs, or one price with no size */
  prices: [string, string][];
  more: string;
  addons: string;
  color?: string;
  hazy: boolean;
  photo?: { src: string; alt: string };
}

function read(id: string): Detail | null {
  const row = document.querySelector<HTMLElement>(`[data-menu] [data-row="${CSS.escape(id)}"]`);
  if (!row?.querySelector("a[data-item]")) return null;
  const text = (sel: string, root: Element | null = row) =>
    root?.querySelector(sel)?.textContent?.trim() ?? "";
  const section = row.closest("[data-section]");
  const price = text(".mrow__price")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  const sizes = text(".sec-head__note", section)
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  const paired = price.length > 1 && sizes.length === price.length;
  return {
    id,
    list: row.closest("[data-list]")?.getAttribute("data-list") === "food" ? "food" : "drinks",
    name: text(".mrow__name"),
    meta: text(".mrow__meta"),
    badge: text(".badge"),
    desc: text(".mrow__desc"),
    tags: [...row.querySelectorAll(".mtag")].map((t) => t.textContent ?? ""),
    prices: paired ? price.map((p, i) => [sizes[i] ?? "", p]) : price.length ? [["", price.join(" / ")]] : [],
    more: text(".mrow__more"),
    addons: text(".intro-box__mods", section),
    color: row.dataset.color,
    hazy: row.dataset.hazy !== undefined,
    photo: row.dataset.photo ? { src: row.dataset.photo, alt: row.dataset.photoAlt ?? "" } : undefined,
  };
}

const itemParam = () => new URLSearchParams(window.location.search).get("item");
const urlFor = (id: string | null) => {
  const u = new URL(window.location.href);
  if (id) u.searchParams.set("item", id);
  else u.searchParams.delete("item");
  return u;
};

export function ItemSheet() {
  // the item stays while the sheet leaves, so it does not empty on the way out
  const [item, setItem] = useState<Detail | null>(null);
  const [open, setOpen] = useState(false);

  const showItem = useCallback((id: string | null) => {
    const next = id ? read(id) : null;
    if (!next) {
      setOpen(false);
      return;
    }
    setShow(next.list);
    setItem(next);
    setOpen(true);
  }, []);

  useEffect(() => {
    showItem(itemParam()); // a shared link opens on its item
    const onPop = () => showItem(itemParam());
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[data-item]") as HTMLAnchorElement | null;
      const id = a?.dataset.item;
      if (!id) return;
      e.preventDefault();
      window.history.pushState({ svItem: true }, "", urlFor(id));
      showItem(id);
    };
    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick);
    };
  }, [showItem]);

  const close = () => {
    // opened by a tap here: Back is the way out, so the history stays one entry deep
    if ((window.history.state as { svItem?: boolean } | null)?.svItem) window.history.back();
    else {
      window.history.replaceState(window.history.state, "", urlFor(null));
      setOpen(false);
    }
  };

  const step = (by: 1 | -1) => {
    if (!item) return;
    const rows = [...document.querySelectorAll<HTMLElement>(`[data-list="${item.list}"] [data-row]`)]
      .filter((r) => r.querySelector("a[data-item]"))
      .map((r) => r.dataset.row ?? "");
    const next = rows[rows.indexOf(item.id) + by];
    if (!next) return;
    window.history.replaceState(window.history.state, "", urlFor(next));
    showItem(next);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  };

  // one price sits beside the name; a price per pour size gets its own line
  const single = item && item.prices.length === 1 ? item.prices[0]?.[1] : undefined;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
      closeLabel={menuLabels.close}
      className="sheet--item"
      onKeyDown={onKeyDown}
    >
      {item ? (
        <article className="item" data-item-open={item.id}>
          {item.photo ? (
            // biome-ignore lint/performance/noImgElement: the address is already an optimised one, written by the server on the row
            <img className="item__photo" src={item.photo.src} alt={item.photo.alt} width={828} height={621} />
          ) : item.color ? (
            <ItemGlass id={item.id} color={item.color} hazy={item.hazy} />
          ) : null}
          <div className="item__head">
            <Dialog.Title className="item__name">{item.name}</Dialog.Title>
            {single ? <span className="item__price tabular">{single}</span> : null}
          </div>
          {item.meta || item.badge ? (
            <p className="item__meta">
              {item.meta ? <span>{item.meta}</span> : null}
              {item.badge ? <span className="item__badge">{item.badge}</span> : null}
            </p>
          ) : null}
          {!single && item.prices.length ? (
            <dl className="item__prices">
              {item.prices.map(([size, price]) => (
                <div key={size}>
                  <dt>{size}</dt>
                  <dd className="tabular">{price}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {item.desc ? <p className="item__desc">{item.desc}</p> : null}
          {/* house beers (the only items with a colour): how this one is brewed, on Our beer */}
          {item.color ? (
            <p className="item__more">
              <TextLink href={`/beer?brew=${encodeURIComponent(item.id)}#brew`}>{brewLabels.seeHow}</TextLink>
            </p>
          ) : null}
          {item.tags.length ? (
            <ul className="item__tags">
              {item.tags.map((t) => (
                <li key={t} className="mtag">
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
          {item.more ? <p className="item__more">{item.more}</p> : null}
          {item.addons ? <p className="item__more">{item.addons}</p> : null}
          {/* nothing at all unless ordering is on and Square has this item */}
          <AddToOrder itemId={item.id} name={item.name} />
        </article>
      ) : null}
    </Sheet>
  );
}
