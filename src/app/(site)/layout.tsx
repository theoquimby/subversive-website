import type { ReactNode } from "react";
import { Checker } from "@/components/graphics/Checker";

// Site shell. Header, footer, gate bootstrap and page wipe arrive in M2 and M7.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Checker />
      {children}
    </>
  );
}
