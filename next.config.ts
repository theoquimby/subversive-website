import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const isDev = process.env.NODE_ENV === "development";
const OPS_ORIGIN = process.env.NEXT_PUBLIC_OPS_ORIGIN ?? "";

// Spec §8.8 with plan Q4. Pages stay static, so there is no nonce. Tried first (M0):
// script-src 'self' with experimental.sri. The e2e CSP check showed Next 16.4's inline
// RSC payload scripts (self.__next_f.push) are blocked: their hashes change per page and
// per build, so they cannot be listed. Shipped: 'self' 'unsafe-inline', with SRI integrity
// still on every script file. No third-party origin is allowed anywhere.
// No upgrade-insecure-requests: HSTS already forces https, and WebKit applies the
// directive to http://localhost, which broke every asset in the CI WebKit runs.
// Ordering (NEXT_PUBLIC_ORDERING=on) loads Square's card form: its script, its iframe, its
// stylesheet and fonts, and its own calls home. The hosts are the ones Square documents
// for the Web Payments SDK (checked 2026-11-15), sandbox or production by SQUARE_ENVIRONMENT.
// With ordering off, no third-party origin is allowed anywhere, as before.
const ORDERING = process.env.NEXT_PUBLIC_ORDERING === "on";
const SQ_LIVE = process.env.SQUARE_ENVIRONMENT === "production";
const SQ_WEB = ORDERING
  ? SQ_LIVE
    ? " https://web.squarecdn.com"
    : " https://sandbox.web.squarecdn.com"
  : "";
const SQ_CONNECT = ORDERING
  ? `${SQ_LIVE ? " https://pci-connect.squareup.com" : " https://pci-connect.squareupsandbox.com"} https://o160250.ingest.sentry.io`
  : "";
const SQ_FONTS = ORDERING
  ? " https://square-fonts-production-f.squarecdn.com https://d1g145x70srn7h.cloudfront.net"
  : "";

// Pictures from elsewhere, each only when its feature is configured at build time:
// Ops (a featured event's photograph; NEXT_PUBLIC_OPS_ORIGIN) and Instagram's CDN (the
// Instagram feed; INSTAGRAM_ACCESS_TOKEN). next/image fetches them on the server, so
// img-src needs them only for a picture shown unoptimized; both lists say the same thing.
const INSTAGRAM = Boolean(process.env.INSTAGRAM_ACCESS_TOKEN);
const IG_HOSTS = ["cdninstagram.com", "fbcdn.net"];
function opsImagePattern(): RemotePattern | null {
  try {
    const u = new URL(OPS_ORIGIN);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return {
      protocol: u.protocol === "https:" ? "https" : "http",
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/**",
    };
  } catch {
    return null; // not set, or not an origin
  }
}
const OPS_IMAGES = opsImagePattern();
const remotePatterns: RemotePattern[] = [
  ...(OPS_IMAGES ? [OPS_IMAGES] : []),
  ...(INSTAGRAM ? IG_HOSTS.map((h): RemotePattern => ({ protocol: "https", hostname: `**.${h}` })) : []),
];
const IMG_EXTRA = `${OPS_IMAGES ? ` ${new URL(OPS_ORIGIN).origin}` : ""}${INSTAGRAM ? IG_HOSTS.map((h) => ` https://*.${h}`).join("") : ""}`;

const scriptSrc = isDev ? `'self' 'unsafe-inline' 'unsafe-eval'${SQ_WEB}` : `'self' 'unsafe-inline'${SQ_WEB}`;

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  `style-src 'self' 'unsafe-inline'${SQ_WEB}`, // Motion writes inline styles
  `img-src 'self' data: blob:${IMG_EXTRA}`,
  `font-src 'self'${SQ_FONTS}`,
  // the analytics beacon posts to Ops; allowed only when that origin is configured
  `connect-src 'self'${OPS_ORIGIN ? ` ${OPS_ORIGIN}` : ""}${SQ_WEB}${SQ_CONNECT}${isDev ? " ws:" : ""}`,
  ...(ORDERING ? [`frame-src${SQ_WEB}`] : []),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    ...(remotePatterns.length > 0 ? { remotePatterns } : {}),
  },
  experimental: {
    sri: { algorithm: "sha256" },
  },
  env: {
    NEXT_PUBLIC_DEV_KIT: process.env.NEXT_PUBLIC_DEV_KIT ?? "",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return []; // old Squarespace URLs arrive in M8 (spec §6)
  },
};

export default config;
