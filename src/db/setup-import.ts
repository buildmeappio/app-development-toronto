// Configure a company's review-import source (paid feature setup).
// Usage:
//   npm run admin:setup-import -- <company-slug> <google|clutch|goodfirms|designrush> <source-url>
// Google uses the company's known place id; pass their Google profile URL anyway
// for the record. Example:
//   npm run admin:setup-import -- devdec-mississauga google https://maps.google.com/...
//   npm run admin:setup-import -- devdec-mississauga clutch https://clutch.co/profile/devdec
import { db } from "./index";
import { companies, reviewImports } from "./schema";
import { eq } from "drizzle-orm";

const SOURCES = ["google", "clutch", "goodfirms", "designrush"] as const;

async function main() {
  const [, , slug, source, url] = process.argv;
  if (!slug || !SOURCES.includes(source as (typeof SOURCES)[number]) || !url) {
    console.error(
      `Usage: npm run admin:setup-import -- <company-slug> <${SOURCES.join("|")}> <source-url>`,
    );
    process.exit(1);
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!company) throw new Error(`Company not found: ${slug}`);
  if (source === "google" && !company.googlePlaceId) {
    console.warn("  ⚠ This company has no Google place id — Google import will return nothing.");
  }

  await db
    .insert(reviewImports)
    .values({
      companyId: company.id,
      source: source as (typeof SOURCES)[number],
      sourceUrl: url,
      status: "active",
    })
    .onConflictDoUpdate({
      target: reviewImports.companyId,
      set: { source: source as (typeof SOURCES)[number], sourceUrl: url, status: "active" },
    });

  console.log(`✓ Import configured for ${company.name}: ${source} → ${url}`);
  console.log(`  Run it with: npm run admin:run-import -- ${slug}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
