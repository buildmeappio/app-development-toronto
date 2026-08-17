import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/jsonld";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep dated monthly archives out of the crawl; the all-time page is canonical.
      disallow: ["/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
