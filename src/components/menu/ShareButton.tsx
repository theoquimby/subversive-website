"use client";

// Share (spec §6.2): the Web Share sheet where there is one; otherwise the address is
// copied and a short toast says so. The toast is a polite live region of our own; Radix
// Toast joins when a second toast needs swipe and stacking (plan Q3 budget).
import { menuLabels } from "@content/microcopy";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../graphics/Icon";

export function ShareButton() {
  const [toast, setToast] = useState("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const share = async () => {
    const data = { title: document.title, url: window.location.href };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(data.url);
      setToast(menuLabels.linkCopied);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setToast(""), 2400);
    } catch {
      // no share sheet and no clipboard: nothing to say
    }
  };

  return (
    <>
      <button type="button" className="icon-btn" onClick={share}>
        <Icon name="share" className="icon-btn__icon" />
        <span className="sr-only">{menuLabels.share}</span>
      </button>
      <p className="toast" role="status" data-visible={toast ? "" : undefined}>
        {toast}
      </p>
    </>
  );
}
