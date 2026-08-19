import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviewImports, companies } from "@/db/schema";
import { Section, Field, inputCls, btn } from "@/components/ui";
import { Badge } from "@/components/badge";
import { setupImportAction, runImportAction } from "@/app/actions/admin";

export default async function AdminImports() {
  const rows = await db
    .select({ cfg: reviewImports, slug: companies.slug, name: companies.name, companyId: companies.id })
    .from(reviewImports)
    .innerJoin(companies, eq(reviewImports.companyId, companies.id))
    .orderBy(desc(reviewImports.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Review imports
        </h1>
        <p className="mt-1 text-slate-500">
          Pull a company&apos;s reviews from an external platform (paid feature).
        </p>
      </div>

      <Section
        title="Configure a source"
        desc="One source per company. Google uses their known place id; others read the page's review markup."
      >
        <form action={setupImportAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company slug" required>
            <input name="companySlug" required placeholder="devdec-mississauga" className={inputCls} />
          </Field>
          <Field label="Source">
            <select name="source" className={inputCls}>
              <option value="google">Google</option>
              <option value="clutch">Clutch</option>
              <option value="goodfirms">GoodFirms</option>
              <option value="designrush">DesignRush</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Source URL" required>
              <input name="sourceUrl" required placeholder="https://clutch.co/profile/…" className={inputCls} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <button className={btn("primary")}>Save source</button>
          </div>
        </form>
      </Section>

      <Section title="Configured sources" desc={`${rows.length} companies.`}>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No import sources configured yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map(({ cfg, name, companyId }) => (
              <li key={cfg.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 text-sm">
                  <span className="font-medium text-slate-900">{name}</span>{" "}
                  <Badge variant="neutral">{cfg.source}</Badge>
                  <p className="truncate text-xs text-slate-400">
                    {cfg.lastRunAt
                      ? `last run ${cfg.lastRunAt.toLocaleDateString("en-CA")} · ${cfg.lastCount ?? 0} reviews${cfg.lastError ? ` · error: ${cfg.lastError}` : ""}`
                      : "never run"}
                  </p>
                </div>
                <form action={runImportAction}>
                  <input type="hidden" name="companyId" value={companyId} />
                  <button className={btn("secondary", "!px-3.5 !py-1.5")}>Run now</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
