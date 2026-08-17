// Merge companies that share a domain into one company with multiple office
// locations (Clutch-style). The ingest used to key on Google place_id, so a
// firm with several branch listings became several records. Run once:
//   npm run admin:merge
import { db } from "./index";
import { companies, companyLocations, claims, placements, inquiries } from "./schema";
import { isNotNull, inArray } from "drizzle-orm";

async function main() {
  const all = await db
    .select()
    .from(companies)
    .where(isNotNull(companies.domain));

  // Group by domain.
  const byDomain = new Map<string, typeof all>();
  for (const c of all) {
    const arr = byDomain.get(c.domain!) ?? [];
    arr.push(c);
    byDomain.set(c.domain!, arr);
  }

  let mergedGroups = 0;
  let deleted = 0;

  for (const [domain, group] of byDomain) {
    if (group.length < 2) continue;

    // Primary = most-reviewed listing (the most established office).
    group.sort(
      (a, b) =>
        (b.googleRatingCount ?? 0) - (a.googleRatingCount ?? 0) ||
        (b.googleRating ?? 0) - (a.googleRating ?? 0),
    );
    const primary = group[0];
    const dups = group.slice(1);
    const dupIds = dups.map((d) => d.id);

    // 1. Each duplicate's HQ city becomes a headquartered office of the primary.
    for (const d of dups) {
      if (d.primaryLocationId) {
        await db
          .insert(companyLocations)
          .values({
            companyId: primary.id,
            locationId: d.primaryLocationId,
            relation: "headquartered",
            weight: 1,
          })
          .onConflictDoUpdate({
            target: [companyLocations.companyId, companyLocations.locationId],
            set: { relation: "headquartered", weight: 1 },
          });
      }
    }

    // 2. Carry over any other location links (serves) the duplicates had.
    const dupLinks = await db
      .select()
      .from(companyLocations)
      .where(inArray(companyLocations.companyId, dupIds));
    for (const link of dupLinks) {
      await db
        .insert(companyLocations)
        .values({
          companyId: primary.id,
          locationId: link.locationId,
          relation: link.relation,
          weight: link.weight,
        })
        .onConflictDoNothing();
    }

    // 3. Reassign any owned records to the primary (safety; none expected yet).
    await db.update(claims).set({ companyId: primary.id }).where(inArray(claims.companyId, dupIds));
    await db.update(placements).set({ companyId: primary.id }).where(inArray(placements.companyId, dupIds));
    await db.update(inquiries).set({ companyId: primary.id }).where(inArray(inquiries.companyId, dupIds));

    // 4. Delete the duplicates (their companyLocations + snapshots cascade).
    await db.delete(companies).where(inArray(companies.id, dupIds));

    mergedGroups++;
    deleted += dups.length;
    console.log(`  ${domain}: kept "${primary.name}", merged ${dups.length} office(s)`);
  }

  console.log(`\n✓ Merged ${mergedGroups} domains, removed ${deleted} duplicate records.`);
  console.log("  Next: npm run admin:reslug && npm run curate:rank");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
