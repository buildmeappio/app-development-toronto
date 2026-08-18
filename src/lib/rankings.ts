import { db } from "../db";
import {
  locations,
  companies,
  companyLocations,
  rankingSnapshots,
} from "../db/schema";
import { inArray, eq } from "drizzle-orm";
import { computeScore } from "./ranking";
import { getAllReviewAggregates } from "./queries/reviews";

/** Current month as "YYYY-MM". */
export function periodForDate(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Recompute ranking snapshots for the "all-time" canonical page and the current
 * month's dated archive. Rolls companies up the location tree (city → region →
 * metro) and scores only published companies. Shared by the CLI script and the
 * monthly Vercel Cron.
 */
export async function generateRankings(now: Date = new Date()) {
  const currentYear = now.getFullYear();
  const monthPeriod = periodForDate(now);

  const allLocations = await db.select().from(locations);
  const allCompanies = await db
    .select()
    .from(companies)
    .where(eq(companies.isPublished, true));
  const links = await db.select().from(companyLocations);
  const reviewAgg = await getAllReviewAggregates();

  const companyById = new Map(allCompanies.map((c) => [c.id, c]));

  const directLinks = new Map<string, { companyId: string; weight: number }[]>();
  for (const l of links) {
    const arr = directLinks.get(l.locationId) ?? [];
    arr.push({ companyId: l.companyId, weight: l.weight });
    directLinks.set(l.locationId, arr);
  }

  const children = new Map<string, string[]>();
  for (const loc of allLocations) {
    if (loc.parentId) {
      const arr = children.get(loc.parentId) ?? [];
      arr.push(loc.id);
      children.set(loc.parentId, arr);
    }
  }

  function descendants(id: string): string[] {
    const out = [id];
    for (const child of children.get(id) ?? []) out.push(...descendants(child));
    return out;
  }

  const snapshotRows: {
    companyId: string;
    locationId: string;
    period: string;
    rank: number;
    score: number;
  }[] = [];

  for (const loc of allLocations) {
    const bestWeight = new Map<string, number>();
    for (const locId of descendants(loc.id)) {
      for (const { companyId, weight } of directLinks.get(locId) ?? []) {
        if (!companyById.has(companyId)) continue;
        bestWeight.set(
          companyId,
          Math.max(bestWeight.get(companyId) ?? 0, weight),
        );
      }
    }
    if (bestWeight.size === 0) continue;

    const scored = [...bestWeight.entries()]
      .map(([companyId, weight]) => {
        const c = companyById.get(companyId)!;
        const fp = reviewAgg.get(companyId);
        const score = computeScore({
          googleRating: c.googleRating,
          googleRatingCount: c.googleRatingCount,
          firstPartyRating: fp?.avg ?? null,
          firstPartyCount: fp?.count ?? null,
          foundedYear: c.foundedYear,
          teamSize: c.teamSize,
          hasDescription: !!c.description,
          hasLogo: !!c.logoUrl,
          hasWebsite: !!c.website,
          isClaimed: c.claimStatus === "claimed",
          locationWeight: weight,
          currentYear,
        });
        return { companyId, score };
      })
      .sort((a, b) => b.score - a.score);

    scored.forEach((s, i) => {
      for (const period of ["all-time", monthPeriod]) {
        snapshotRows.push({
          companyId: s.companyId,
          locationId: loc.id,
          period,
          rank: i + 1,
          score: Math.round(s.score * 100) / 100,
        });
      }
    });
  }

  await db
    .delete(rankingSnapshots)
    .where(inArray(rankingSnapshots.period, ["all-time", monthPeriod]));

  for (let i = 0; i < snapshotRows.length; i += 500) {
    await db.insert(rankingSnapshots).values(snapshotRows.slice(i, i + 500));
  }

  return { pairs: snapshotRows.length / 2, period: monthPeriod };
}
