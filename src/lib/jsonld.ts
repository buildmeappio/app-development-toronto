/**
 * Schema.org JSON-LD builders. We intentionally do NOT emit aggregateRating
 * (those ratings are Google's, not first-party) to stay within structured-data
 * guidelines. ItemList + BreadcrumbList + Organization are the safe, useful set.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://appdevelopmenttoronto.com";

const SITE_NAME = "Toronto App Developers";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "A curated, monthly-ranked directory of app development companies across the Greater Toronto Area.",
  };
}

export function breadcrumbJsonLd(items: { name: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: `${SITE_URL}${item.url}` } : {}),
    })),
  };
}

export function itemListJsonLd(
  title: string,
  entries: { rank: number; name: string; slug: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    numberOfItems: entries.length,
    itemListElement: entries.map((e) => ({
      "@type": "ListItem",
      position: e.rank,
      url: `${SITE_URL}/company/${e.slug}`,
      name: e.name,
    })),
  };
}

export function companyJsonLd(company: {
  name: string;
  slug: string;
  website?: string | null;
  description?: string | null;
  addressText?: string | null;
  hqLocationName?: string | null;
  // First-party review aggregate (our own reviews — safe to mark up).
  reviewCount?: number;
  reviewAvg?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: `${SITE_URL}/company/${company.slug}`,
    ...(company.website ? { sameAs: [company.website] } : {}),
    ...(company.description ? { description: company.description } : {}),
    ...(company.addressText
      ? {
          address: {
            "@type": "PostalAddress",
            addressRegion: "ON",
            addressCountry: "CA",
            streetAddress: company.addressText,
          },
        }
      : {}),
    ...(company.hqLocationName ? { areaServed: company.hqLocationName } : {}),
    ...(company.reviewCount && company.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number((company.reviewAvg ?? 0).toFixed(1)),
            reviewCount: company.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}
