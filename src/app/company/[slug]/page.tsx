import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompanyLogo } from "@/components/company-logo";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/badge";
import { getCompanyBySlug } from "@/lib/queries/locations";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, companyJsonLd } from "@/lib/jsonld";

// Cache company profiles; refresh daily. Empty static params => on-demand ISR
// (each profile renders once on first hit, then is cached — no giant build).
export const revalidate = 86400;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = await getCompanyBySlug(slug).catch(() => null);
  if (!row) return { title: "Company not found" };
  return {
    title: row.company.name,
    description:
      row.company.description ??
      `${row.company.name} — app development company${row.hqLocationName ? ` in ${row.hqLocationName}` : ""}, GTA.`,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await getCompanyBySlug(slug).catch(() => null);
  if (!row) notFound();

  const { company, hqLocationName, hqFullSlug } = row;
  const claimed = company.claimStatus === "claimed";

  const details = [
    { label: "Founded", value: company.foundedYear?.toString() },
    { label: "Team size", value: company.teamSize },
    { label: "Hourly rate", value: company.hourlyRate },
    { label: "Min. project size", value: company.minProjectSize },
    { label: "Headquarters", value: hqLocationName },
  ].filter((d) => d.value);

  return (
    <main className="pb-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "GTA", url: "/app-development-companies/gta" },
            ...(hqLocationName && hqFullSlug
              ? [{ name: hqLocationName, url: `/app-development-companies/${hqFullSlug}` }]
              : []),
            { name: company.name },
          ]),
          companyJsonLd({
            name: company.name,
            slug: company.slug,
            website: company.website,
            description: company.description,
            addressText: company.addressText,
            hqLocationName,
          }),
        ]}
      />
      <div className="border-b border-slate-200 bg-slate-50">
        <Container className="py-8">
          <Breadcrumbs
            items={[
              { label: "GTA", href: "/app-development-companies/gta" },
              ...(hqLocationName && hqFullSlug
                ? [{ label: hqLocationName, href: `/app-development-companies/${hqFullSlug}` }]
                : []),
              { label: company.name },
            ]}
          />

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={80} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {company.name}
                </h1>
                {claimed ? (
                  <Badge variant="verified">✓ Verified</Badge>
                ) : (
                  <Badge variant="neutral">Unclaimed</Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                {company.googleRating != null && (
                  <StarRating
                    rating={company.googleRating}
                    count={company.googleRatingCount}
                    size="md"
                  />
                )}
                {hqLocationName && <span>📍 {hqLocationName}</span>}
              </div>
            </div>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Visit website ↗
              </a>
            )}
          </div>
        </Container>
      </div>

      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">About</h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                {company.description ??
                  `${company.name} is an app development company${hqLocationName ? ` based in ${hqLocationName}` : ""} in the Greater Toronto Area. This profile was curated automatically — if you represent ${company.name}, claim it to add a full description, portfolio, and services.`}
              </p>
            </section>

            {details.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900">Details</h2>
                <dl className="mt-3 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
                  {details.map((d) => (
                    <div key={d.label} className="bg-white p-4">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        {d.label}
                      </dt>
                      <dd className="mt-1 font-medium text-slate-900">
                        {d.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>

          <aside>
            {!claimed && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 lg:sticky lg:top-24">
                <h2 className="font-semibold text-blue-900">
                  Is this your company?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-blue-800/80">
                  Claim {company.name} for free to manage this listing, add your
                  portfolio, and reach more buyers.
                </p>
                <Link
                  href={`/company/${company.slug}/claim`}
                  className="mt-4 inline-block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Claim this profile — free
                </Link>
              </div>
            )}
          </aside>
        </div>
      </Container>
    </main>
  );
}
