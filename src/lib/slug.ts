/** Turn an arbitrary string into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Normalize a website URL to its apex domain (for claim verification). */
export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname;
    return host.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Build a unique company slug from name + city (collisions handled by caller). */
export function companySlug(name: string, citySlug?: string): string {
  const base = slugify(name);
  return citySlug ? `${base}-${citySlug}` : base;
}
