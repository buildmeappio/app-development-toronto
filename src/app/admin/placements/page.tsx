import { desc, eq, and, or, isNull, gt, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { placements, companies, locations } from "@/db/schema";
import { Section, Field, inputCls, btn } from "@/components/ui";
import { Badge } from "@/components/badge";
import { activatePlacementAction, cancelPlacementAction } from "@/app/actions/admin";

const plLoc = alias(locations, "pl_admin");

export default async function AdminPlacements() {
  const active = await db
    .select({ p: placements, companyName: companies.name, locationName: plLoc.name })
    .from(placements)
    .innerJoin(companies, eq(placements.companyId, companies.id))
    .leftJoin(plLoc, eq(placements.locationId, plLoc.id))
    .where(
      and(
        eq(placements.status, "active"),
        lte(placements.startsAt, sql`now()`),
        or(isNull(placements.endsAt), gt(placements.endsAt, sql`now()`)),
      ),
    )
    .orderBy(desc(placements.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Placements
        </h1>
        <p className="mt-1 text-slate-500">
          Activate paid features after payment clears.
        </p>
      </div>

      <Section
        title="Activate a feature"
        desc="Use the company's profile slug (from its URL: /company/<slug>)."
      >
        <form action={activatePlacementAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company slug" required>
            <input name="companySlug" required placeholder="devdec-mississauga" className={inputCls} />
          </Field>
          <Field label="Type">
            <select name="type" className={inputCls}>
              <option value="featured">Featured (city ranking)</option>
              <option value="badge">Verified badge</option>
            </select>
          </Field>
          <Field label="City slug" hint="For Featured only — leave blank for site-wide.">
            <input name="citySlug" placeholder="mississauga" className={inputCls} />
          </Field>
          <Field label="Duration (days)">
            <input name="days" type="number" defaultValue={30} className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <button className={btn("primary")}>Activate</button>
          </div>
        </form>
      </Section>

      <Section title="Active placements" desc={`${active.length} live.`}>
        {active.length === 0 ? (
          <p className="text-sm text-slate-500">None active.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {active.map(({ p, companyName, locationName }) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="text-sm">
                  <span className="font-medium text-slate-900">{companyName}</span>
                  <span className="ml-2">
                    <Badge variant={p.type === "featured" ? "sponsored" : "verified"}>
                      {p.type === "featured"
                        ? `★ Featured${locationName ? ` · ${locationName}` : " · site-wide"}`
                        : "✓ Verified"}
                    </Badge>
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    until {p.endsAt ? p.endsAt.toLocaleDateString("en-CA") : "ongoing"}
                  </span>
                </div>
                <form action={cancelPlacementAction}>
                  <input type="hidden" name="placementId" value={p.id} />
                  <button className="text-sm font-medium text-slate-400 transition hover:text-rose-600">
                    Cancel
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
