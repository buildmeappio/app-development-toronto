import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/container";
import { CompanyLogo } from "@/components/company-logo";
import { Badge } from "@/components/badge";
import { getCurrentUser, getUserClaims } from "@/lib/auth";
import { getActivePlacementsForCompanyIds } from "@/lib/queries/placements";

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

  // Group each claimed company's active paid features.
  const placementRows = await getActivePlacementsForCompanyIds(
    approved.map((c) => c.company.id),
  ).catch(() => []);
  const featuresByCompany = new Map<string, typeof placementRows>();
  for (const p of placementRows) {
    const arr = featuresByCompany.get(p.companyId) ?? [];
    arr.push(p);
    featuresByCompany.set(p.companyId, arr);
  }
  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) : "ongoing";

  return (
    <Container className="max-w-3xl py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Your companies
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as {user.email}
          </p>
        </div>
        <Link
          href="/app-development-companies/gta"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          Find a company to claim
        </Link>
      </div>

      {pending && (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Your claim was submitted and is pending review. We&apos;ll verify it
          shortly.
        </p>
      )}

      {approved.length === 0 && inReview.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-600">You haven&apos;t claimed any companies yet.</p>
          <Link
            href="/app-development-companies/gta"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Browse the directory
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {approved.map((c) => {
            const features = featuresByCompany.get(c.company.id) ?? [];
            const badge = features.find((f) => f.type === "badge");
            const featuredIn = features.filter((f) => f.type === "featured");
            return (
              <div
                key={c.claimId}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center gap-4">
                  <CompanyLogo name={c.company.name} logoUrl={c.company.logoUrl} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">
                        {c.company.name}
                      </p>
                      {badge && <Badge variant="verified">✓ Verified</Badge>}
                    </div>
                    <p className="text-sm text-slate-500">{c.company.domain}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/company/${c.company.slug}`}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600"
                    >
                      View
                    </Link>
                    <Link
                      href={`/company/${c.company.slug}/edit`}
                      className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      Edit
                    </Link>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
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
                    href={`/upgrade?company=${c.company.slug}`}
                    className="ml-auto text-sm font-medium text-blue-600 hover:underline"
                  >
                    {features.length === 0 ? "Boost visibility" : "Renew / add"} →
                  </Link>
                </div>
              </div>
            );
          })}

          {inReview.map((c) => (
            <div
              key={c.claimId}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <CompanyLogo name={c.company.name} logoUrl={c.company.logoUrl} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {c.company.name}
                </p>
                <p className="text-sm text-slate-500">{c.company.domain}</p>
              </div>
              <Badge variant="sponsored">Pending review</Badge>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
