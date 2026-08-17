// Env loaded via `tsx --env-file=.env.local` (see package.json curate:reassess).
// Re-evaluates isPublished for every stored company against the current
// relevance rules — no Google Places calls. Run after tuning curation.ts.
import { db } from "./index";
import { companies } from "./schema";
import { eq } from "drizzle-orm";
import { assessText } from "../lib/curation";

async function reassess() {
  const all = await db.select().from(companies);
  let published = 0;
  let unpublished = 0;
  const nowHidden: string[] = [];

  for (const c of all) {
    // Name-only pass: we DON'T have the Places `types` signal here, so a missing
    // ALLOW keyword is not evidence against a brandable name (Tekrevol, iQlance…).
    // Only a positive DENY match (or bareness) should hide a company.
    const { reason } = assessText(c.name);
    const denied = reason.startsWith("deny:");
    const bare = !c.website && c.googleRating == null;
    const shouldPublish = !denied && !bare;

    if (shouldPublish !== c.isPublished) {
      await db
        .update(companies)
        .set({ isPublished: shouldPublish })
        .where(eq(companies.id, c.id));
      if (!shouldPublish) nowHidden.push(c.name);
    }
    if (shouldPublish) published++;
    else unpublished++;
  }

  console.log(`✓ Reassessed ${all.length} companies.`);
  console.log(`  Published: ${published} | Unpublished: ${unpublished}`);
  console.log(`  Newly hidden (sample): ${nowHidden.slice(0, 20).join(", ")}`);
}

reassess()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
