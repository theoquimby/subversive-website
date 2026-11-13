import type { MetadataRoute } from "next";

// /dev is never indexed, in any build (plan Q1). Sitemap arrives in M8.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dev"] }],
  };
}
