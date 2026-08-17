import type { MetadataRoute } from "next";
import {
  getAllLocationFullSlugs,
  getAllPublishedCompanySlugs,
} from "@/lib/queries/locations";
import { SITE_URL } from "@/lib/jsonld";

// Revalidate the sitemap daily.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  let locations: { fullSlug: string }[] = [];
  let companies: { slug: string; updatedAt: Date }[] = [];
  try {
    [locations, companies] = await Promise.all([
      getAllLocationFullSlugs(),
      getAllPublishedCompanySlugs(),
    ]);
  } catch {
    // DB unavailable at build — still emit the homepage.
  }

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const locationUrls: MetadataRoute.Sitemap = locations.map((l) => ({
    url: `${SITE_URL}/app-development-companies/${l.fullSlug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const companyUrls: MetadataRoute.Sitemap = companies.map((c) => ({
    url: `${SITE_URL}/company/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...home, ...locationUrls, ...companyUrls];
}
