"use client";

// Sticky order bar (spec §6.2, §2.5 thumb zone): on a phone, once the reader is past the
// first section of the open list, a 56 px bar rises from the bottom edge with Order
// pickup and Share. It steps aside when the footer arrives and respects the safe area.
import { microcopy } from "@content/microcopy";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { ShareButton } from "./ShareButton";
import { useShow } from "./show-store";

export function OrderBar({ orderUrl }: { orderUrl: string }) {
  const show = useShow();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const first = document.querySelector<HTMLElement>(`[data-list="${show}"] [data-section]`);
    const footer = document.querySelector<HTMLElement>(".site-footer");
    if (!first) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const past = first.getBoundingClientRect().bottom < 0;
      const atFooter = (footer?.getBoundingClientRect().top ?? Infinity) < window.innerHeight;
      setVisible(past && !atFooter);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [show]);

  return (
    <div className="order-bar" data-visible={visible ? "" : undefined} inert={!visible}>
      <Button href={orderUrl} external className="order-bar__order">
        {microcopy.orderPickup}
      </Button>
      <ShareButton />
    </div>
  );
}
