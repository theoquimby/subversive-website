"use client";

// Spec §5.1: after a "Not yet" at the gate, a small sky tag on the menu says the sodas are
// there. Nothing is blocked (O9). Reads the gate's stored answer; renders nothing otherwise
// (the gate itself arrives in M7).
import { microcopy } from "@content/microcopy";
import { useEffect, useState } from "react";

export function Under21Note() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("sv.age") ?? "null") as { ok?: unknown } | null;
      setShow(v?.ok === false);
    } catch {
      setShow(false);
    }
  }, []);
  if (!show) return null;
  return (
    <a className="under21" href="#no-alcohol">
      {microcopy.under21}
    </a>
  );
}
