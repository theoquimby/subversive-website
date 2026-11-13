import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import { Checker } from "@/components/graphics/Checker";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StampIn } from "@/components/layout/StampIn";

// Site shell (spec §8.3, plan M2 item 7): rail, header, main, footer. The gate bootstrap
// joins in M7. Analytics are Vercel's cookieless ones, served from this origin.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Checker />
      <Header />
      <main id="main" className="site-main">
        {children}
      </main>
      <Footer />
      <StampIn />
      {/* Vercel serves these scripts only on its own deployments */}
      {process.env.VERCEL === "1" ? (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}
    </>
  );
}
