import { db } from "@/db";
import {
  locations,
  rankingSnapshots,
  companies,
  caseStudies,
  teamMembers,
  companyDailyViews,
  companyDailyClicks,
} from "@/db/schema";
import { alias } from "drizzle-orm/pg-core";
import { eq, and, asc, desc, sql, inArray, ilike } from "drizzle-orm";

/** Team members for a company. */
export async function getTeamMembers(companyId: string) {
  return db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.companyId, companyId))
    .orderBy(asc(teamMembers.createdAt));
}

/** Profile-view stats (total + last 30 days) for a set of companies. */
export async function getViewStatsForCompanies(ids: string[]) {
  const map = new Map<string, { total: number; last30: number }>();
  if (ids.length === 0) return map;
  const cutoff = new Date(Date.now() - 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const rows = await db
    .select({
      companyId: companyDailyViews.companyId,
      total: sql<number>`coalesce(sum(${companyDailyViews.count}),0)::int`,
      last30: sql<number>`coalesce(sum(${companyDailyViews.count}) filter (where ${companyDailyViews.day} >= ${cutoff}),0)::int`,
    })
    .from(companyDailyViews)
    .where(inArray(companyDailyViews.companyId, ids))
    .groupBy(companyDailyViews.companyId);
  for (const r of rows) map.set(r.companyId, { total: r.total, last30: r.last30 });
  return map;
}

/** Outbound website-click stats (total + last 30 days) for a set of companies. */
export async function getClickStatsForCompanies(ids: string[]) {
  const map = new Map<string, { total: number; last30: number }>();
  if (ids.length === 0) return map;
  const cutoff = new Date(Date.now() - 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const rows = await db
    .select({
      companyId: companyDailyClicks.companyId,
      total: sql<number>`coalesce(sum(${companyDailyClicks.count}),0)::int`,
      last30: sql<number>`coalesce(sum(${companyDailyClicks.count}) filter (where ${companyDailyClicks.day} >= ${cutoff}),0)::int`,
    })
    .from(companyDailyClicks)
    .where(inArray(companyDailyClicks.companyId, ids))
    .groupBy(companyDailyClicks.companyId);
  for (const r of rows) map.set(r.companyId, { total: r.total, last30: r.last30 });
  return map;
}

// Escape LIKE wildcards in user input (drizzle parameterizes, but % and _ are
// still treated as wildcards otherwise).
function escapeLike(q: string) {
  return q.replace(/[%_\\]/g, "\\$&");
}

/** Portfolio / case studies for a company, newest first. */
export async function getCaseStudies(companyId: string) {
  return db
    .select()
    .from(caseStudies)
    .where(eq(caseStudies.companyId, companyId))
    .orderBy(desc(caseStudies.createdAt));
}

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

/** Search published companies by name. */
export async function searchCompanies(q: string, limit = 24) {
  const term = `%${escapeLike(q.trim())}%`;
  return db
    .select({ company: companies, hqLocationName: primaryLoc.name })
    .from(companies)
    .leftJoin(primaryLoc, eq(companies.primaryLocationId, primaryLoc.id))
    .where(and(eq(companies.isPublished, true), ilike(companies.name, term)))
    .orderBy(desc(sql`coalesce(${companies.googleRatingCount}, 0)`))
    .limit(limit);
}

/** Search locations by name (for jump-to-city results). */
export async function searchLocations(q: string, limit = 8) {
  const term = `%${escapeLike(q.trim())}%`;
  return db
    .select()
    .from(locations)
    .where(ilike(locations.name, term))
    .orderBy(asc(locations.name))
    .limit(limit);
}

/** A company's best (lowest-number) all-time rank and where. For award badges. */
export async function getCompanyBestRank(companyId: string) {
  const [row] = await db
    .select({
      rank: rankingSnapshots.rank,
      locationName: locations.name,
      locationFullSlug: locations.fullSlug,
    })
    .from(rankingSnapshots)
    .innerJoin(locations, eq(rankingSnapshots.locationId, locations.id))
    .where(
      and(
        eq(rankingSnapshots.companyId, companyId),
        eq(rankingSnapshots.period, "all-time"),
      ),
    )
    .orderBy(asc(rankingSnapshots.rank))
    .limit(1);
  return row ?? null;
}

/** A company's rank in a specific location (all-time). */
export async function getCompanyRankInLocation(
  companyId: string,
  locationId: string,
) {
  const [row] = await db
    .select({ rank: rankingSnapshots.rank })
    .from(rankingSnapshots)
    .where(
      and(
        eq(rankingSnapshots.companyId, companyId),
        eq(rankingSnapshots.locationId, locationId),
        eq(rankingSnapshots.period, "all-time"),
      ),
    )
    .limit(1);
  return row?.rank ?? null;
}

/** Case-study counts keyed by company id (for completeness + dashboard). */
export async function getCaseStudyCounts(ids: string[]) {
  if (ids.length === 0) return new Map<string, number>();
  const rows = await db
    .select({ id: caseStudies.companyId, c: sql<number>`count(*)::int` })
    .from(caseStudies)
    .where(inArray(caseStudies.companyId, ids))
    .groupBy(caseStudies.companyId);
  return new Map(rows.map((r) => [r.id, r.c]));
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
