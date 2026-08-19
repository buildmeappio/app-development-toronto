import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { claims, companies, profiles } from "@/db/schema";
import { Panel } from "@/components/ui";
import { decideClaimAction } from "@/app/actions/admin";

export default async function AdminClaims() {
  const rows = await db
    .select({
      claimId: claims.id,
      domainMatched: claims.domainMatched,
      createdAt: claims.createdAt,
      companyName: companies.name,
      companyDomain: companies.domain,
      companySlug: companies.slug,
      userEmail: profiles.email,
    })
    .from(claims)
    .innerJoin(companies, eq(claims.companyId, companies.id))
    .leftJoin(profiles, eq(claims.userId, profiles.id))
    .where(eq(claims.status, "pending"))
    .orderBy(desc(claims.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Pending claims
      </h1>
      <p className="mt-1 text-slate-500">{rows.length} awaiting review.</p>

      {rows.length === 0 ? (
        <Panel className="mt-6 p-10 text-center text-slate-500">
          No pending claims. 🎉
        </Panel>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <Panel key={r.claimId} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold text-slate-900">{r.companyName}</p>
                <p className="text-sm text-slate-500">
                  requested by <strong>{r.userEmail ?? "?"}</strong> · company
                  domain {r.companyDomain ?? "—"}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={decideClaimAction}>
                  <input type="hidden" name="claimId" value={r.claimId} />
                  <input type="hidden" name="decision" value="approve" />
                  <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                    Approve
                  </button>
                </form>
                <form action={decideClaimAction}>
                  <input type="hidden" name="claimId" value={r.claimId} />
                  <input type="hidden" name="decision" value="reject" />
                  <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-rose-300 hover:text-rose-600">
                    Reject
                  </button>
                </form>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
