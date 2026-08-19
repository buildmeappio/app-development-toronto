import Link from "next/link";
import { sql, eq, and, or, isNull, gt, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  inquiries,
  claims,
  reviews,
  placements,
  reviewImports,
  companies,
} from "@/db/schema";
import { StatCard } from "@/components/ui";

export default async function AdminOverview() {
  const one = async (q: PromiseLike<{ c: number }[]>) =>
    (await q)[0]?.c ?? 0;

  const [newLeads, pendingClaims, pendingReviews, activePlacements, importCfgs, published] =
    await Promise.all([
      one(db.select({ c: sql<number>`count(*)::int` }).from(inquiries).where(eq(inquiries.status, "new"))),
      one(db.select({ c: sql<number>`count(*)::int` }).from(claims).where(eq(claims.status, "pending"))),
      one(db.select({ c: sql<number>`count(*)::int` }).from(reviews).where(eq(reviews.status, "pending"))),
      one(
        db
          .select({ c: sql<number>`count(*)::int` })
          .from(placements)
          .where(
            and(
              eq(placements.status, "active"),
              lte(placements.startsAt, sql`now()`),
              or(isNull(placements.endsAt), gt(placements.endsAt, sql`now()`)),
            ),
          ),
      ),
      one(db.select({ c: sql<number>`count(*)::int` }).from(reviewImports)),
      one(db.select({ c: sql<number>`count(*)::int` }).from(companies).where(eq(companies.claimStatus, "claimed"))),
    ]);

  const cards = [
    { label: "New leads", value: newLeads, href: "/admin/leads", urgent: newLeads > 0 },
    { label: "Pending claims", value: pendingClaims, href: "/admin/claims", urgent: pendingClaims > 0 },
    { label: "Pending reviews", value: pendingReviews, href: "/admin/reviews", urgent: pendingReviews > 0 },
    { label: "Active placements", value: activePlacements, href: "/admin/placements" },
    { label: "Import sources", value: importCfgs, href: "/admin/imports" },
    { label: "Claimed companies", value: published, href: "/admin/claims" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
      <p className="mt-1 text-slate-500">Everything that needs your attention.</p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="block transition hover:-translate-y-0.5">
            <div className={c.urgent ? "rounded-2xl ring-2 ring-amber-300" : ""}>
              <StatCard label={c.label} value={c.value} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
