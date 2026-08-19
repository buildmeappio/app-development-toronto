import Link from "next/link";
import { redirect } from "next/navigation";
import { CompanyLogo } from "@/components/company-logo";
import { Badge } from "@/components/badge";
import { PageShell, PageHeading, Panel, StatCard, btn } from "@/components/ui";
import { getCurrentUser, getUserClaims } from "@/lib/auth";
import {
  getActivePlacementsForCompanyIds,
} from "@/lib/queries/placements";
import { getCaseStudyCounts, getViewStatsForCompanies } from "@/lib/queries/locations";
import { getAllReviewAggregates } from "@/lib/queries/reviews";
import { computeCompleteness } from "@/lib/completeness";

export const metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const { pending } = await searchParams;
  const allClaims = await getUserClaims(user.id).catch(() => []);
  const approved = allClaims.filter((c) => c.status === "approved");
  const inReview = allClaims.filter((c) => c.status === "pending");
  const ids = approved.map((c) => c.company.id);

  const [placementRows, csCounts, reviewAgg, viewStats] = await Promise.all([
    getActivePlacementsForCompanyIds(ids).catch(() => []),
    getCaseStudyCounts(ids).catch(() => new Map<string, number>()),
    getAllReviewAggregates().catch(() => new Map()),
    getViewStatsForCompanies(ids).catch(
      () => new Map<string, { total: number; last30: number }>(),
    ),
  ]);
  const totalViews30 = ids.reduce(
    (n, id) => n + (viewStats.get(id)?.last30 ?? 0),
    0,
  );

  const featuresByCompany = new Map<string, typeof placementRows>();
  for (const p of placementRows) {
    const arr = featuresByCompany.get(p.companyId) ?? [];
    arr.push(p);
    featuresByCompany.set(p.companyId, arr);
  }
  const fmtDate = (d: Date | null) =>
    d
      ? d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })
      : "ongoing";

  const socialsCount = (c: (typeof approved)[number]["company"]) =>
    [c.linkedinUrl, c.twitterUrl, c.facebookUrl, c.instagramUrl].filter(Boolean)
      .length;

  const totalReviews = approved.reduce(
    (n, c) => n + (reviewAgg.get(c.company.id)?.count ?? 0),
    0,
  );
  const activeFeatures = placementRows.length;

  return (
    <PageShell>
      <PageHeading
        eyebrow="Dashboard"
        title="Your companies"
        desc={`Signed in as ${user.email}`}
      >
        <Link href="/app-development-companies/gta" className={btn("secondary")}>
          Find a company to claim
        </Link>
      </PageHeading>

      {pending && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your claim was submitted and is pending review — we&apos;ll verify it
          shortly.
        </div>
      )}

      {(approved.length > 0 || inReview.length > 0) && (
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Profile views" value={totalViews30} hint="last 30 days" />
          <StatCard label="Reviews" value={totalReviews} hint="published" />
          <StatCard label="Active features" value={activeFeatures} />
          <StatCard label="Claimed" value={approved.length} />
        </div>
      )}

      {approved.length === 0 && inReview.length === 0 ? (
        <Panel className="p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
            🔎
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            You haven&apos;t claimed any companies yet
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Find your company in the directory and claim it for free to manage
            your listing.
          </p>
          <Link
            href="/app-development-companies/gta"
            className={btn("primary", "mt-5")}
          >
            Browse the directory
          </Link>
        </Panel>
      ) : (
        <div className="space-y-4">
          {approved.map((c) => {
            const features = featuresByCompany.get(c.company.id) ?? [];
            const badge = features.find((f) => f.type === "badge");
            const featuredIn = features.filter((f) => f.type === "featured");
            const comp = computeCompleteness(c.company, {
              caseStudies: csCounts.get(c.company.id) ?? 0,
              socials: socialsCount(c.company),
            });
            return (
              <Panel key={c.claimId} className="p-5">
                <div className="flex items-start gap-4">
                  <CompanyLogo
                    name={c.company.name}
                    logoUrl={c.company.logoUrl}
                    size={52}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">
                        {c.company.name}
                      </p>
                      {badge && <Badge variant="verified">✓ Verified</Badge>}
                    </div>
                    <p className="text-sm text-slate-500">{c.company.domain}</p>

                    {/* completeness */}
                    <div className="mt-3 max-w-md">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500">
                          Profile {comp.percent}% complete
                          <span className="text-slate-400">
                            {" · "}
                            {viewStats.get(c.company.id)?.last30 ?? 0} views (30d)
                          </span>
                        </span>
                        {comp.percent < 100 && (
                          <Link
                            href={`/company/${c.company.slug}/edit`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Complete it →
                          </Link>
                        )}
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${comp.percent === 100 ? "bg-emerald-500" : "bg-blue-600"}`}
                          style={{ width: `${comp.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/company/${c.company.slug}`}
                      className={btn("ghost", "!px-3 !py-1.5")}
                    >
                      View
                    </Link>
                    <Link
                      href={`/company/${c.company.slug}/edit`}
                      className={btn("dark", "!px-3.5 !py-1.5")}
                    >
                      Edit
                    </Link>
                  </div>
                </div>

                {/* features row */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Features
                  </span>
                  {features.length === 0 && (
                    <span className="text-sm text-slate-400">None active</span>
                  )}
                  {badge && (
                    <Badge variant="verified">
                      Verified · until {fmtDate(badge.endsAt)}
                    </Badge>
                  )}
                  {featuredIn.map((f, i) => (
                    <Badge key={i} variant="sponsored">
                      ★ Featured{f.locationName ? ` in ${f.locationName}` : ""} ·
                      until {fmtDate(f.endsAt)}
                    </Badge>
                  ))}
                  <Link
                    href={`/company/${c.company.slug}/reviews`}
                    className="ml-auto text-sm font-medium text-slate-600 hover:text-blue-600"
                  >
                    Collect reviews
                  </Link>
                  <Link
                    href={`/upgrade?company=${c.company.slug}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    {features.length === 0 ? "Boost visibility" : "Renew / add"} →
                  </Link>
                </div>
              </Panel>
            );
          })}

          {inReview.map((c) => (
            <Panel key={c.claimId} className="flex items-center gap-4 p-5">
              <CompanyLogo name={c.company.name} logoUrl={c.company.logoUrl} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {c.company.name}
                </p>
                <p className="text-sm text-slate-500">{c.company.domain}</p>
              </div>
              <Badge variant="sponsored">Pending review</Badge>
            </Panel>
          ))}
        </div>
      )}
    </PageShell>
  );
}
