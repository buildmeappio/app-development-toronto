// Activate a paid feature after an offline (e-Transfer) payment.
// Usage:
//   npm run admin:activate -- <company-slug> <featured|badge> <days> [city-slug]
// Examples:
//   npm run admin:activate -- miit-technologies-inc-mississauga featured 30 mississauga
//   npm run admin:activate -- devdec-mississauga badge 365
import { db } from "./index";
import { companies, locations, placements } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  const [, , slug, typeArg = "featured", daysArg = "30", citySlug] =
    process.argv;

  if (!slug || (typeArg !== "featured" && typeArg !== "badge")) {
    console.error(
      "Usage: npm run admin:activate -- <company-slug> <featured|badge> <days> [city-slug]",
    );
    process.exit(1);
  }
  const type = typeArg as "featured" | "badge";
  const days = Number.parseInt(daysArg, 10) || 30;

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!company) throw new Error(`Company not found: ${slug}`);

  // "featured" can be scoped to a city; "badge" is global.
  let locationId: string | null = null;
  let locationFullSlug: string | null = null;
  if (type === "featured" && citySlug) {
    const [loc] = await db
      .select()
      .from(locations)
      .where(eq(locations.slug, citySlug))
      .limit(1);
    if (!loc) throw new Error(`Location not found: ${citySlug}`);
    locationId = loc.id;
    locationFullSlug = loc.fullSlug;
  }

  const endsAt = new Date(Date.now() + days * 86_400_000);
  await db.insert(placements).values({
    companyId: company.id,
    locationId,
    type,
    status: "active",
    endsAt,
  });

  console.log(
    `✓ Activated ${type} for ${company.name}` +
      `${type === "featured" ? (citySlug ? ` in ${citySlug}` : " (site-wide)") : ""}` +
      ` for ${days} days (until ${endsAt.toISOString().slice(0, 10)}).`,
  );

  // Bust the ISR cache so the feature shows immediately.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (siteUrl && secret) {
    const paths = [`/company/${company.slug}`];
    if (locationFullSlug) {
      paths.push(`/app-development-companies/${locationFullSlug}`);
    }
    try {
      const res = await fetch(`${siteUrl}/api/revalidate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ paths }),
      });
      const json = await res.json();
      console.log(`  revalidated: ${JSON.stringify(json.revalidated ?? [])}`);
    } catch {
      console.log("  (revalidate skipped — page will refresh within 24h)");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
