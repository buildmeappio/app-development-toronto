import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews, companies } from "@/db/schema";
import { Panel } from "@/components/ui";
import { decideReviewAction } from "@/app/actions/admin";

export default async function AdminReviews() {
  const rows = await db
    .select({ r: reviews, companyName: companies.name })
    .from(reviews)
    .innerJoin(companies, eq(reviews.companyId, companies.id))
    .where(eq(reviews.status, "pending"))
    .orderBy(desc(reviews.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Pending reviews
      </h1>
      <p className="mt-1 text-slate-500">{rows.length} to moderate.</p>

      {rows.length === 0 ? (
        <Panel className="mt-6 p-10 text-center text-slate-500">
          No pending reviews. 🎉
        </Panel>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map(({ r, companyName }) => (
            <Panel key={r.id} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-amber-500">
                  {"★".repeat(r.rating)}
                  <span className="text-slate-200">{"★".repeat(5 - r.rating)}</span>
                </p>
                <span className="text-xs text-slate-400">{companyName}</span>
              </div>
              {r.title && <h3 className="mt-2 font-semibold text-slate-900">{r.title}</h3>}
              <p className="mt-1.5 text-sm text-slate-600">{r.body}</p>
              <p className="mt-2 text-xs text-slate-400">
                {r.reviewerName}
                {r.reviewerCompany ? ` · ${r.reviewerCompany}` : ""}
                {r.source !== "firstparty" ? ` · via ${r.source}` : ""}
              </p>
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                <form action={decideReviewAction}>
                  <input type="hidden" name="reviewId" value={r.id} />
                  <input type="hidden" name="decision" value="publish" />
                  <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                    Publish
                  </button>
                </form>
                <form action={decideReviewAction}>
                  <input type="hidden" name="reviewId" value={r.id} />
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
