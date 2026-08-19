import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompanyLogo } from "@/components/company-logo";
import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/badge";
import { getCompanyBySlug, getCaseStudies, getTeamMembers } from "@/lib/queries/locations";
import { getActiveBadgeCompanyIds } from "@/lib/queries/placements";
import { getPublishedReviews, getReviewAggregate } from "@/lib/queries/reviews";
import { TrackView } from "@/components/track-view";
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
  const [badgeIds, studies, companyReviews, reviewAgg, team] = await Promise.all([
    getActiveBadgeCompanyIds().catch(() => new Set<string>()),
    getCaseStudies(company.id).catch(() => []),
    getPublishedReviews(company.id).catch(() => []),
    getReviewAggregate(company.id).catch(() => ({ count: 0, avg: 0 })),
    getTeamMembers(company.id).catch(() => []),
  ]);
  const techStack = company.techStack ?? [];
  const verified = badgeIds.has(company.id);
  const focusAreas = company.focusAreas ?? [];
  const socials = [
    { label: "LinkedIn", url: company.linkedinUrl },
    { label: "X", url: company.twitterUrl },
    { label: "Facebook", url: company.facebookUrl },
    { label: "Instagram", url: company.instagramUrl },
  ].filter((s) => s.url);

  const details = [
    { label: "Founded", value: company.foundedYear?.toString() },
    { label: "Team size", value: company.teamSize },
    { label: "Hourly rate", value: company.hourlyRate },
    { label: "Min. project size", value: company.minProjectSize },
    { label: "Headquarters", value: hqLocationName },
  ].filter((d) => d.value);

  return (
    <main className="pb-8">
      <TrackView companyId={company.id} />
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
            reviewCount: reviewAgg.count,
            reviewAvg: reviewAgg.avg,
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
                {verified && <Badge variant="verified">✓ Verified</Badge>}
                {claimed ? (
                  <Badge variant="success">Claimed</Badge>
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
              {focusAreas.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {focusAreas.map((area) => (
                    <span
                      key={area}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-100"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              )}
              {techStack.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tech stack
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {techStack.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {studies.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900">
                  Portfolio
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {studies.map((cs) => (
                    <div
                      key={cs.id}
                      className="overflow-hidden rounded-2xl border border-slate-200"
                    >
                      {cs.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cs.imageUrl}
                          alt={cs.title}
                          className="aspect-[16/9] w-full object-cover"
                        />
                      )}
                      <div className="p-5">
                        <h3 className="font-semibold text-slate-900">{cs.title}</h3>
                        {cs.description && (
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                            {cs.description}
                          </p>
                        )}
                        {cs.url && (
                          <a
                            href={cs.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
                          >
                            View project →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {team.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900">Team</h2>
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {team.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                      <CompanyLogo name={m.name} logoUrl={m.photoUrl} size={44} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{m.name}</p>
                        {m.role && <p className="truncate text-xs text-slate-500">{m.role}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section id="reviews">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Reviews
                  {reviewAgg.count > 0 && (
                    <span className="ml-2 text-sm font-normal text-slate-500">
                      {reviewAgg.avg.toFixed(1)}★ · {reviewAgg.count}
                    </span>
                  )}
                </h2>
                <Link
                  href={`/company/${company.slug}/review`}
                  className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                >
                  Write a review
                </Link>
              </div>

              {companyReviews.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No reviews yet. Worked with {company.name}?{" "}
                  <Link href={`/company/${company.slug}/review`} className="font-medium text-blue-600 hover:underline">
                    Be the first to review.
                  </Link>
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {companyReviews.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-amber-500">
                          {"★".repeat(r.rating)}
                          <span className="text-slate-200">
                            {"★".repeat(5 - r.rating)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.source !== "firstparty" && (
                            <a
                              href={r.sourceUrl ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="text-xs font-medium text-slate-400 hover:text-blue-600"
                            >
                              via{" "}
                              {r.source.charAt(0).toUpperCase() + r.source.slice(1)}
                            </a>
                          )}
                          {r.verified && (
                            <Badge variant="verified">✓ Verified</Badge>
                          )}
                        </div>
                      </div>
                      {r.title && (
                        <h3 className="mt-2 font-semibold text-slate-900">{r.title}</h3>
                      )}
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{r.body}</p>
                      <p className="mt-3 text-xs text-slate-400">
                        {r.reviewerName}
                        {r.reviewerRole ? `, ${r.reviewerRole}` : ""}
                        {r.reviewerCompany ? ` · ${r.reviewerCompany}` : ""}
                        {r.projectType ? ` · ${r.projectType}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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

            {socials.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-slate-900">Connect</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.url!}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
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

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
              <h2 className="font-semibold text-slate-900">
                Stand out in {hqLocationName ?? "the GTA"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Get a featured slot at the top of the rankings and a verified
                badge. We set it up personally — no online checkout.
              </p>
              <Link
                href={`/upgrade?company=${company.slug}`}
                className="mt-4 inline-block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:border-blue-400 hover:text-blue-600"
              >
                Promote this company
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
