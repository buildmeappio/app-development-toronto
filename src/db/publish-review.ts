// Publish (or reject) a pending review, then re-rank so it counts.
// Usage:
//   npm run admin:publish-review -- <review-id> [reject]
import { db } from "./index";
import { reviews, companies } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  const [, , reviewId, action = "publish"] = process.argv;
  if (!reviewId) {
    console.error("Usage: npm run admin:publish-review -- <review-id> [reject]");
    process.exit(1);
  }
  const reject = action === "reject";

  const [r] = await db
    .select({ id: reviews.id, companyId: reviews.companyId, slug: companies.slug, name: companies.name })
    .from(reviews)
    .innerJoin(companies, eq(reviews.companyId, companies.id))
    .where(eq(reviews.id, reviewId))
    .limit(1);
  if (!r) throw new Error(`Review not found: ${reviewId}`);

  await db
    .update(reviews)
    .set({ status: reject ? "rejected" : "published", verified: !reject })
    .where(eq(reviews.id, reviewId));

  console.log(`${reject ? "✗ Rejected" : "✓ Published"} review for ${r.name}.`);

  if (!reject) {
    // Revalidate the profile so the review shows immediately.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const secret = process.env.CRON_SECRET;
    if (siteUrl && secret) {
      await fetch(`${siteUrl}/api/revalidate`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
        body: JSON.stringify({ paths: [`/company/${r.slug}`] }),
      }).catch(() => {});
    }
    console.log("  Tip: run `npm run curate:rank` to fold this review into the rankings.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
