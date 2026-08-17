// Refresh Google ratings for existing companies (fixes data decay).
// Uses Place Details (cheaper than search). Run periodically, then re-rank:
//   npm run curate:refresh && npm run curate:rank
import { db } from "./index";
import { companies } from "./schema";
import { eq, isNotNull } from "drizzle-orm";
import { placeDetails } from "../lib/places";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const rows = await db
    .select({
      id: companies.id,
      name: companies.name,
      placeId: companies.googlePlaceId,
    })
    .from(companies)
    .where(isNotNull(companies.googlePlaceId));

  console.log(`Refreshing ratings for ${rows.length} companies...`);
  let updated = 0;
  let closed = 0;
  let gone = 0;

  for (const c of rows) {
    if (!c.placeId) continue;
    try {
      const d = await placeDetails(c.placeId);
      if (!d) {
        gone++;
        continue;
      }
      const isClosed = d.businessStatus === "CLOSED_PERMANENTLY";
      await db
        .update(companies)
        .set({
          googleRating: d.rating ?? null,
          googleRatingCount: d.userRatingCount ?? null,
          ...(isClosed ? { isPublished: false } : {}),
          updatedAt: new Date(),
        })
        .where(eq(companies.id, c.id));
      updated++;
      if (isClosed) closed++;
    } catch (err) {
      console.error(`  ✗ ${c.name}: ${(err as Error).message}`);
    }
    await sleep(120); // be gentle on the API
  }

  console.log(
    `\n✓ Refreshed ${updated} companies. Unpublished ${closed} now-closed, ${gone} delisted from Google.` +
      `\n  Next: run \`npm run curate:rank\` to re-rank with fresh ratings.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
