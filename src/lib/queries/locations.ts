import { db } from "@/db";
import { locations, rankingSnapshots, companies } from "@/db/schema";
import { alias } from "drizzle-orm/pg-core";
import { eq, and, asc, sql, inArray } from "drizzle-orm";

/** The GTA metro root. */
export async function getMetro() {
  const [metro] = await db
    .select()
    .from(locations)
    .where(eq(locations.slug, "gta"))
    .limit(1);
  return metro ?? null;
}

/** All regions (direct children of the GTA metro root). */
export async function getRegions() {
  const metro = await getMetro();
  if (!metro) return [];
  return db
    .select()
    .from(locations)
    .where(eq(locations.parentId, metro.id))
    .orderBy(asc(locations.name));
}

/** Regions annotated with how many companies rank in each. */
export async function getRegionsWithCounts() {
  const regions = await getRegions();
  if (regions.length === 0) return [];
  const counts = await db
    .select({
      locationId: rankingSnapshots.locationId,
      c: sql<number>`count(*)::int`,
    })
    .from(rankingSnapshots)
    .where(eq(rankingSnapshots.period, "all-time"))
    .groupBy(rankingSnapshots.locationId);
  const map = new Map(counts.map((r) => [r.locationId, r.c]));
  return regions.map((r) => ({ ...r, companyCount: map.get(r.id) ?? 0 }));
}

/** Headline numbers for the homepage. */
export async function getStats() {
  const [companyCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(companies)
    .where(eq(companies.isPublished, true));
  const [cityCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(locations)
    .where(inArray(locations.type, ["city", "district"]));
  const [regionCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(locations)
    .where(eq(locations.type, "region"));
  return {
    companies: companyCount?.c ?? 0,
    cities: cityCount?.c ?? 0,
    regions: regionCount?.c ?? 0,
  };
}

/** A single location by its denormalized full slug path (e.g. "peel/mississauga"). */
export async function getLocationByFullSlug(fullSlug: string) {
  const [row] = await db
    .select()
    .from(locations)
    .where(eq(locations.fullSlug, fullSlug))
    .limit(1);
  return row ?? null;
}

/** Locations by a set of plain slugs (used by the footer). */
export async function getLocationsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];
  return db.select().from(locations).where(inArray(locations.slug, slugs));
}

/** Direct children of a location (regions -> cities, cities -> districts). */
export async function getChildren(parentId: string) {
  return db
    .select()
    .from(locations)
    .where(eq(locations.parentId, parentId))
    .orderBy(asc(locations.name));
}

const primaryLoc = alias(locations, "primary_loc");

/** The ranked companies for a location + period, with HQ location name. */
export async function getRanking(
  locationId: string,
  period = "all-time",
  limit?: number,
) {
  const q = db
    .select({
      rank: rankingSnapshots.rank,
      score: rankingSnapshots.score,
      company: companies,
      hqLocationName: primaryLoc.name,
    })
    .from(rankingSnapshots)
    .innerJoin(companies, eq(rankingSnapshots.companyId, companies.id))
    .leftJoin(primaryLoc, eq(companies.primaryLocationId, primaryLoc.id))
    .where(
      and(
        eq(rankingSnapshots.locationId, locationId),
        eq(rankingSnapshots.period, period),
      ),
    )
    .orderBy(asc(rankingSnapshots.rank));
  return limit ? q.limit(limit) : q;
}

/** Convenience: top N companies for a location slug (e.g. "gta"). */
export async function getTopCompaniesBySlug(slug: string, n = 5) {
  const [loc] = await db
    .select()
    .from(locations)
    .where(eq(locations.slug, slug))
    .limit(1);
  if (!loc) return [];
  return getRanking(loc.id, "all-time", n);
}

/** A single company by slug, with its HQ location name. */
export async function getCompanyBySlug(slug: string) {
  const [row] = await db
    .select({ company: companies, hqLocationName: primaryLoc.name, hqFullSlug: primaryLoc.fullSlug })
    .from(companies)
    .leftJoin(primaryLoc, eq(companies.primaryLocationId, primaryLoc.id))
    .where(eq(companies.slug, slug))
    .limit(1);
  return row ?? null;
}

/** All location full-slugs — for the sitemap and static params. */
export async function getAllLocationFullSlugs() {
  return db.select({ fullSlug: locations.fullSlug }).from(locations);
}

/** All published company slugs + last-updated — for the sitemap. */
export async function getAllPublishedCompanySlugs() {
  return db
    .select({ slug: companies.slug, updatedAt: companies.updatedAt })
    .from(companies)
    .where(eq(companies.isPublished, true));
}
