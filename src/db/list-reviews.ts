// View pending reviews to moderate. Run: npm run admin:reviews
import { db } from "./index";
import { reviews, companies } from "./schema";
import { eq, desc } from "drizzle-orm";

async function main() {
  const rows = await db
    .select({ r: reviews, companyName: companies.name })
    .from(reviews)
    .innerJoin(companies, eq(reviews.companyId, companies.id))
    .where(eq(reviews.status, "pending"))
    .orderBy(desc(reviews.createdAt));

  if (rows.length === 0) {
    console.log("No pending reviews. 🎉");
    return;
  }

  console.log(`${rows.length} pending review(s):\n`);
  for (const { r, companyName } of rows) {
    console.log(`${r.rating}★  ${companyName}  — ${r.reviewerName}${r.reviewerCompany ? ` (${r.reviewerCompany})` : ""}`);
    if (r.title) console.log(`   "${r.title}"`);
    console.log(`   ${r.body}`);
    console.log(`   publish: npm run admin:publish-review -- ${r.id}   (or: ... ${r.id} reject)\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
