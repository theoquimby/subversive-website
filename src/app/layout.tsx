import { microcopy } from "@content/microcopy";
import site from "@content/site.json";
import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { PrintFilter } from "@/components/graphics/PrintFilter";
import { raw } from "@/styles/tokens";
import { fontVariables } from "./fonts";
import "@/styles/globals.css";

// The ?grid overlay is compiled in only when NEXT_PUBLIC_DEV_KIT=1 at build (plan Q1);
// otherwise the branch is dead code and the import is dropped.
const GridOverlay =
  process.env.NEXT_PUBLIC_DEV_KIT === "1"
    ? dynamic(() => import("@/components/dev/GridOverlay").then((m) => m.GridOverlay))
    : () => null;

export const metadata: Metadata = {
  title: `${site.name}, Catskill NY`,
  description: site.descriptor,
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
};

// viewport-fit=cover for safe areas; zoom is never locked (spec §2.5).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
  themeColor: raw.paper,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables} data-skin="paper">
      <body>
        <PrintFilter />
        <a className="skip-link" href="#main">
          {microcopy.skipToContent}
        </a>
        {children}
        <GridOverlay />
      </body>
    </html>
  );
}
