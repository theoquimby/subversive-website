import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { ReactNode } from "react";
import { TicketTear } from "@/components/events/TicketTear";
import { Announcements } from "@/components/layout/Announcements";
import { Beacon } from "@/components/layout/Beacon";
import { Curtain } from "@/components/layout/Curtain";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { StampIn } from "@/components/layout/StampIn";
import { CartSheet } from "@/components/order/CartSheet";
import { jsonLdText, placeJsonLd } from "@/lib/seo/jsonld";
import { getSite } from "@/lib/site/site";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://subversive-website.vercel.app";

// Site shell: header, main, footer (the checker band at the top went on 2026-11-15; the
// footer keeps it as the page's closing band). The gate bootstrap
// joins in M7. Analytics are Vercel's cookieless ones, served from this origin.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {/* Max's announcements from Ops; nothing at all until Ops sends some */}
      <Announcements />
      <main id="main" className="site-main">
        {children}
      </main>
      {/* a holiday's few small drawings by the footer's ground line (nothing otherwise) */}
      <Footer />
      <StampIn />
      {/* iOS 26 Safari tints its bottom bar from a fixed element at that edge (shell.css) */}
      <div className="edge-top" aria-hidden="true" />
      <div className="edge-bottom" aria-hidden="true" />
      <Curtain />
      <TicketTear />
      {/* the order sheet; renders nothing unless ordering is switched on */}
      <CartSheet />
      <Beacon orderHost={new URL(getSite().links.order).hostname} />
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
