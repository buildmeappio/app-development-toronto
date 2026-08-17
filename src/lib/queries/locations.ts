import { db } from "@/db";
import { locations, rankingSnapshots, companies } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

/** All regions (direct children of the GTA metro root). */
export async function getRegions() {
  const [metro] = await db
    .select()
    .from(locations)
    .where(eq(locations.slug, "gta"))
    .limit(1);
  if (!metro) return [];

  return db
    .select()
    .from(locations)
    .where(eq(locations.parentId, metro.id))
    .orderBy(asc(locations.name));
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

/** Direct children of a location (regions -> cities, cities -> districts). */
export async function getChildren(parentId: string) {
  return db
    .select()
    .from(locations)
    .where(eq(locations.parentId, parentId))
    .orderBy(asc(locations.name));
}

/**
 * The ranked companies for a location + period.
 * period: "all-time" (canonical) or "YYYY-MM" (dated monthly archive).
 */
export async function getRanking(locationId: string, period = "all-time") {
  return db
    .select({
      rank: rankingSnapshots.rank,
      score: rankingSnapshots.score,
      company: companies,
    })
    .from(rankingSnapshots)
    .innerJoin(companies, eq(rankingSnapshots.companyId, companies.id))
    .where(
      and(
        eq(rankingSnapshots.locationId, locationId),
        eq(rankingSnapshots.period, period),
      ),
    )
    .orderBy(asc(rankingSnapshots.rank));
}
