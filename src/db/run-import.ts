// Fetch reviews from a company's configured source (on-demand).
// Usage:
//   npm run admin:run-import -- <company-slug>
//   npm run admin:run-import -- all
import { db } from "./index";
import { companies, reviewImports } from "./schema";
import { eq } from "drizzle-orm";
import { runImport, runAllImports } from "../lib/imports";

async function revalidate(slug: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.CRON_SECRET;
  if (!siteUrl || !secret) return;
  await fetch(`${siteUrl}/api/revalidate`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
    body: JSON.stringify({ paths: [`/company/${slug}`] }),
  }).catch(() => {});
}

async function main() {
  const [, , target] = process.argv;
  if (!target) {
    // No arg → list configs.
    const rows = await db
      .select({ slug: companies.slug, name: companies.name, cfg: reviewImports })
      .from(reviewImports)
      .innerJoin(companies, eq(reviewImports.companyId, companies.id));
    if (!rows.length) return console.log("No import configs. Set one with admin:setup-import.");
    for (const r of rows) {
      console.log(`${r.slug}  [${r.cfg.source}] ${r.cfg.status}  last: ${r.cfg.lastCount ?? "—"} reviews${r.cfg.lastError ? ` · err: ${r.cfg.lastError}` : ""}`);
    }
    return;
  }

  if (target === "all") {
    const r = await runAllImports();
    console.log(`✓ Ran ${r.configs} imports, ${r.imported} reviews upserted.`);
    console.log("  Run `npm run curate:rank` to fold them into rankings.");
    return;
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, target))
    .limit(1);
  if (!company) throw new Error(`Company not found: ${target}`);

  const result = await runImport(company.id);
  console.log(`Result:`, result);
  if (result.ok && result.imported) {
    await revalidate(company.slug);
    console.log("  Profile revalidated. Run `npm run curate:rank` to update rankings.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
