import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { inquiries, companies } from "@/db/schema";
import { Panel } from "@/components/ui";
import { Badge } from "@/components/badge";
import { updateInquiryStatusAction } from "@/app/actions/admin";

const STATUS_VARIANT = {
  new: "sponsored",
  contacted: "verified",
  won: "success",
  closed: "neutral",
} as const;

export default async function AdminLeads() {
  const rows = await db
    .select({ i: inquiries, companyName: companies.name })
    .from(inquiries)
    .leftJoin(companies, eq(inquiries.companyId, companies.id))
    .orderBy(desc(inquiries.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leads</h1>
      <p className="mt-1 text-slate-500">{rows.length} “request a call” inquiries.</p>

      {rows.length === 0 ? (
        <Panel className="mt-6 p-10 text-center text-slate-500">No leads yet.</Panel>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map(({ i, companyName }) => (
            <Panel key={i.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {i.contactName}{" "}
                    <Badge variant={STATUS_VARIANT[i.status]}>{i.status}</Badge>
                  </p>
                  <p className="text-sm text-slate-500">
                    <a href={`mailto:${i.email}`} className="text-blue-600 hover:underline">{i.email}</a>
                    {i.phone ? ` · ${i.phone}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {companyName ?? "—"} · interested: {i.interestedIn ?? "—"}
                  </p>
                  {i.message && <p className="mt-2 text-sm text-slate-600">“{i.message}”</p>}
                </div>
                <span className="text-xs text-slate-400">
                  {i.createdAt.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                {(["contacted", "won", "closed"] as const).map((st) => (
                  <form key={st} action={updateInquiryStatusAction}>
                    <input type="hidden" name="id" value={i.id} />
                    <input type="hidden" name="status" value={st} />
                    <button
                      type="submit"
                      disabled={i.status === st}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600 disabled:opacity-40"
                    >
                      Mark {st}
                    </button>
                  </form>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
