// Re-slug all companies to clean name-only slugs (drop the city suffix), with a
// numeric suffix only on a genuine name collision. Run once after merging:
//   npm run admin:reslug
import { db } from "./index";
import { companies } from "./schema";
import { eq, desc, sql } from "drizzle-orm";
import { slugBase } from "../lib/curation";

async function main() {
  // Most-reviewed company wins the un-suffixed slug.
  const rows = await db
    .select({ id: companies.id, name: companies.name, slug: companies.slug })
    .from(companies)
    .orderBy(desc(sql`coalesce(${companies.googleRatingCount}, 0)`));

  const used = new Set<string>();
  let changed = 0;

  for (const r of rows) {
    const base = slugBase(r.name);
    let slug = base;
    let n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);

    if (slug !== r.slug) {
      await db.update(companies).set({ slug }).where(eq(companies.id, r.id));
      changed++;
    }
  }

  console.log(`✓ Re-slugged ${changed} of ${rows.length} companies to name-only slugs.`);
  console.log("  Next: npm run curate:rank (then redeploy to refresh static pages).");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
