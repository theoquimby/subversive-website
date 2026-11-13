"use client";

// Directions (spec §6.4, §2.5): opens the platform's maps app. The server renders the
// Google Maps link; on Apple devices the browser swaps it for Apple Maps, which iOS and
// macOS open in Maps. Ruling: maps.apple.com rather than the bare maps: scheme, which some
// desktop browsers refuse; the result in the app is the same.
import { microcopy } from "@content/microcopy";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";

export function DirectionsButton({ google, query }: { google: string; query: string }) {
  const [href, setHref] = useState(google);
  useEffect(() => {
    const ua = navigator.userAgent;
    const apple = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    if (apple) setHref(`https://maps.apple.com/?q=${encodeURIComponent(query)}`);
  }, [query]);
  return (
    <Button href={href} external className="visit-actions__btn">
      {microcopy.directions}
    </Button>
  );
}
