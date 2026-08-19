import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, Panel, btn } from "@/components/ui";
import { CompanyLogo } from "@/components/company-logo";
import { getCompanyBySlug } from "@/lib/queries/locations";
import { getCurrentUser } from "@/lib/auth";
import { submitClaimAction } from "@/app/actions/claims";

export const metadata = { title: "Claim your profile", robots: { index: false } };

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await getCompanyBySlug(slug).catch(() => null);
  if (!row) notFound();

  const { company } = row;
  const user = await getCurrentUser();
  const userDomain = user?.email?.split("@")[1]?.toLowerCase() ?? null;
  const domainMatches = !!company.domain && userDomain === company.domain;
  const alreadyClaimed = company.claimStatus === "claimed";

  return (
    <PageShell width="narrow">
      <Link
        href={`/company/${slug}`}
        className="text-sm text-slate-500 hover:text-blue-600"
      >
        ← Back to profile
      </Link>

      <Panel className="mt-4 p-8">
        <div className="flex items-center gap-4">
          <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={56} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Claim {company.name}
            </h1>
            {company.domain && (
              <p className="text-sm text-slate-500">{company.domain}</p>
            )}
          </div>
        </div>

        {alreadyClaimed ? (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            This profile has already been claimed. If this is your company and you
            believe this is a mistake, please contact support.
          </p>
        ) : !user ? (
          <div className="mt-6">
            <p className="text-slate-600">
              Sign in with your company email to claim this profile. Claiming is
              free and lets you manage the listing, add your portfolio, and
              collect reviews.
            </p>
            <Link href={`/login?next=/company/${slug}/claim`} className={btn("primary", "mt-5")}>
              Sign in to continue
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <div
              className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                domainMatches
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${domainMatches ? "bg-emerald-500 text-white" : "bg-amber-400 text-white"}`}
              >
                {domainMatches ? "✓" : "!"}
              </span>
              <div>
                {domainMatches ? (
                  <>
                    <p className="font-semibold">Email verified</p>
                    <p className="mt-0.5">
                      Your domain <strong>{userDomain}</strong> matches{" "}
                      <strong>{company.domain}</strong> — your claim is approved
                      instantly.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Manual review needed</p>
                    <p className="mt-0.5">
                      Your domain{" "}
                      <strong>{userDomain ?? "(unknown)"}</strong>{" "}
                      {company.domain ? (
                        <>doesn&apos;t match <strong>{company.domain}</strong>.</>
                      ) : (
                        <>can&apos;t be auto-matched (no website on file).</>
                      )}{" "}
                      You can still submit — we&apos;ll review it.
                    </p>
                  </>
                )}
              </div>
            </div>

            <form action={submitClaimAction} className="mt-5">
              <input type="hidden" name="companyId" value={company.id} />
              <button type="submit" className={btn("primary")}>
                {domainMatches ? "Claim this profile" : "Submit claim for review"}
              </button>
              <p className="mt-2 text-xs text-slate-400">
                Signed in as {user.email}
              </p>
            </form>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
