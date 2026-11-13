import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Spec §8.8 with plan Q4. Pages stay static, so there is no nonce. Tried first (M0):
// script-src 'self' with experimental.sri. The e2e CSP check showed Next 16.4's inline
// RSC payload scripts (self.__next_f.push) are blocked: their hashes change per page and
// per build, so they cannot be listed. Shipped: 'self' 'unsafe-inline', with SRI integrity
// still on every script file. No third-party origin is allowed anywhere.
const scriptSrc = isDev ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self' 'unsafe-inline'";

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'", // Motion writes inline styles
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'" + (isDev ? " ws:" : ""),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
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
