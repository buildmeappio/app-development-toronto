import { db } from "@/db";
import { placements, companies, locations } from "@/db/schema";
import { alias } from "drizzle-orm/pg-core";
import { and, eq, or, isNull, gt, lte, sql } from "drizzle-orm";

// A placement is live when active, started, and not yet expired.
function activeCond() {
  return and(
    eq(placements.status, "active"),
    lte(placements.startsAt, sql`now()`),
    or(isNull(placements.endsAt), gt(placements.endsAt, sql`now()`)),
  );
}

/** Company ids with an active "verified badge" placement (badges are global). */
export async function getActiveBadgeCompanyIds(): Promise<Set<string>> {
  const rows = await db
    .select({ id: placements.companyId })
    .from(placements)
    .where(and(eq(placements.type, "badge"), activeCond()));
  return new Set(rows.map((r) => r.id));
}

const pl = alias(locations, "pl_featured");

/**
 * Companies with an active "featured" placement for this location (or a
 * site-wide one). Pinned above the organic ranking as sponsored slots.
 */
export async function getFeaturedForLocation(locationId: string) {
  return db
    .select({ company: companies, hqLocationName: pl.name })
    .from(placements)
    .innerJoin(companies, eq(placements.companyId, companies.id))
    .leftJoin(pl, eq(companies.primaryLocationId, pl.id))
    .where(
      and(
        eq(placements.type, "featured"),
        eq(companies.isPublished, true),
        or(eq(placements.locationId, locationId), isNull(placements.locationId)),
        activeCond(),
      ),
    );
}
