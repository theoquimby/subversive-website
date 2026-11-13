import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import { Checker } from "@/components/graphics/Checker";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StampIn } from "@/components/layout/StampIn";
import { jsonLdText, placeJsonLd } from "@/lib/seo/jsonld";
import { getSite } from "@/lib/site/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://subversive-website.vercel.app";

// Site shell (spec §8.3, plan M2 item 7): rail, header, main, footer. The gate bootstrap
// joins in M7. Analytics are Vercel's cookieless ones, served from this origin.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Checker rows={1} />
      <Header />
      <main id="main" className="site-main">
        {children}
      </main>
      <Footer />
      <StampIn />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON built from site.json, with < escaped
        dangerouslySetInnerHTML={{ __html: jsonLdText(placeJsonLd(getSite(), SITE_URL)) }}
      />
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
