// View pending profile claims. Run: npm run admin:claims
import { db } from "./index";
import { claims, companies, profiles } from "./schema";
import { eq, desc } from "drizzle-orm";

async function main() {
  const rows = await db
    .select({
      claimId: claims.id,
      status: claims.status,
      domainMatched: claims.domainMatched,
      createdAt: claims.createdAt,
      companyName: companies.name,
      companySlug: companies.slug,
      companyDomain: companies.domain,
      userEmail: profiles.email,
    })
    .from(claims)
    .innerJoin(companies, eq(claims.companyId, companies.id))
    .leftJoin(profiles, eq(claims.userId, profiles.id))
    .where(eq(claims.status, "pending"))
    .orderBy(desc(claims.createdAt));

  if (rows.length === 0) {
    console.log("No pending claims. 🎉");
    return;
  }

  console.log(`${rows.length} pending claim(s):\n`);
  for (const r of rows) {
    const when = r.createdAt.toISOString().slice(0, 16).replace("T", " ");
    console.log(`${when}  ${r.companyName}`);
    console.log(`   requested by: ${r.userEmail ?? "?"}  (company domain: ${r.companyDomain ?? "—"})`);
    console.log(`   approve with: npm run admin:approve -- ${r.claimId}\n`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
