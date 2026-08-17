// Env loaded via `tsx --env-file=.env.local` (see package.json curate:rank).
import { db } from "./index";
import { locations, companies, companyLocations, rankingSnapshots } from "./schema";
import { inArray, eq } from "drizzle-orm";
import { computeScore } from "../lib/ranking";

/** Current month as "YYYY-MM". */
function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function generateRankings() {
  const currentYear = new Date().getFullYear();
  const monthPeriod = currentPeriod();

  const allLocations = await db.select().from(locations);
  const allCompanies = await db
    .select()
    .from(companies)
    .where(eq(companies.isPublished, true));
  const links = await db.select().from(companyLocations);

  // Only published companies are eligible; unpublished ones are skipped in roll-up.
  const companyById = new Map(allCompanies.map((c) => [c.id, c]));

  // location -> direct (companyId, weight) links.
  const directLinks = new Map<string, { companyId: string; weight: number }[]>();
  for (const l of links) {
    const arr = directLinks.get(l.locationId) ?? [];
    arr.push({ companyId: l.companyId, weight: l.weight });
    directLinks.set(l.locationId, arr);
  }

  // Adjacency: parent -> children.
  const children = new Map<string, string[]>();
  for (const loc of allLocations) {
    if (loc.parentId) {
      const arr = children.get(loc.parentId) ?? [];
      arr.push(loc.id);
      children.set(loc.parentId, arr);
    }
  }

  // All descendant location ids (inclusive) for a location.
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
    // Companies on this page = those linked here OR to any descendant location.
    // Keep the strongest link weight per company (HQ beats serves).
    const bestWeight = new Map<string, number>();
    for (const locId of descendants(loc.id)) {
      for (const { companyId, weight } of directLinks.get(locId) ?? []) {
        // Skip links to unpublished (filtered-out) companies.
        if (!companyById.has(companyId)) continue;
        bestWeight.set(companyId, Math.max(bestWeight.get(companyId) ?? 0, weight));
      }
    }
    if (bestWeight.size === 0) continue;

    const scored = [...bestWeight.entries()]
      .map(([companyId, weight]) => {
        const c = companyById.get(companyId)!;
        const score = computeScore({
          googleRating: c.googleRating,
          googleRatingCount: c.googleRatingCount,
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
      // Snapshot the same ranking under both the canonical all-time page and
      // the current dated monthly archive page.
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

  // Clean regenerate for these periods.
  await db
    .delete(rankingSnapshots)
    .where(inArray(rankingSnapshots.period, ["all-time", monthPeriod]));

  for (let i = 0; i < snapshotRows.length; i += 500) {
    await db.insert(rankingSnapshots).values(snapshotRows.slice(i, i + 500));
  }

  console.log(
    `✓ Ranked ${snapshotRows.length / 2} (location,company) pairs across periods "all-time" and "${monthPeriod}".`,
  );
}

generateRankings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
