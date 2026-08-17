import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompanyCard } from "@/components/company-card";
import {
  getLocationByFullSlug,
  getChildren,
  getRanking,
  getLocationsBySlugs,
  getAllLocationFullSlugs,
} from "@/lib/queries/locations";
import {
  getFeaturedForLocation,
  getActiveBadgeCompanyIds,
} from "@/lib/queries/placements";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/jsonld";

// Cache location pages; refresh daily (monthly cron changes them at most once/mo).
export const revalidate = 86400;

// Pre-render the canonical all-time page for every location.
export async function generateStaticParams() {
  const locs = await getAllLocationFullSlugs().catch(() => []);
  return locs.map((l) => ({ slug: l.fullSlug.split("/") }));
}

const PER_PAGE = 24;

// URL shapes handled: ".../city", ".../city/2026/08" (monthly),
// ".../city/page/2" and ".../city/2026/08/page/2" (paginated).
function parseSlug(slug: string[]): {
  fullSlug: string;
  period: string;
  page: number;
} {
  let segs = [...slug];
  let page = 1;

  // Trailing "page/N"
  if (
    segs.length >= 2 &&
    segs[segs.length - 2] === "page" &&
    /^\d+$/.test(segs[segs.length - 1])
  ) {
    page = Math.max(1, Number.parseInt(segs[segs.length - 1], 10));
    segs = segs.slice(0, -2);
  }

  // Trailing "YYYY/MM"
  const last2 = segs.slice(-2);
  const isMonthly =
    last2.length === 2 && /^\d{4}$/.test(last2[0]) && /^\d{2}$/.test(last2[1]);
  if (isMonthly) {
    return {
      fullSlug: segs.slice(0, -2).join("/"),
      period: `${last2[0]}-${last2[1]}`,
      page,
    };
  }
  return { fullSlug: segs.join("/"), period: "all-time", page };
}

function pagePath(fullSlug: string, period: string, page: number): string {
  const periodPart = period === "all-time" ? "" : `/${period.replace("-", "/")}`;
  const pagePart = page > 1 ? `/page/${page}` : "";
  return `/app-development-companies/${fullSlug}${periodPart}${pagePart}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { fullSlug, period, page } = parseSlug(slug);
  const location = await getLocationByFullSlug(fullSlug).catch(() => null);
  if (!location) return { title: "Not found" };

  const periodLabel = period === "all-time" ? "" : ` — ${period}`;
  const pageLabel = page > 1 ? ` — Page ${page}` : "";
  const title = `Top App Development Companies in ${location.name}${periodLabel}${pageLabel}`;
  return {
    title,
    description: `Ranked list of the best app development companies in ${location.name}, GTA. Curated and updated monthly.`,
    alternates: { canonical: pagePath(fullSlug, period, page) },
    // Dated monthly snapshots are archives — keep them out of the index (thin
    // duplicates of the canonical all-time page until monthly data diverges).
    ...(period !== "all-time" ? { robots: { index: false, follow: true } } : {}),
  };
}

async function buildBreadcrumbs(fullSlug: string) {
  const segments = fullSlug.split("/");
  const locs = await getLocationsBySlugs(segments).catch(() => []);
  const bySlug = new Map(locs.map((l) => [l.slug, l]));
  const items: { label: string; href?: string }[] = [
    { label: "GTA", href: "/app-development-companies/gta" },
  ];
  segments.forEach((seg, i) => {
    const loc = bySlug.get(seg);
    if (!loc) return;
    const isLast = i === segments.length - 1;
    items.push({
      label: loc.name,
      href: isLast ? undefined : `/app-development-companies/${loc.fullSlug}`,
    });
  });
  return items;
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const { fullSlug, period, page } = parseSlug(slug);

  const location = await getLocationByFullSlug(fullSlug).catch(() => null);
  if (!location) notFound();

  const [ranking, children, crumbs, featuredAll, badgeIds] = await Promise.all([
    getRanking(location.id, period).catch(() => []),
    getChildren(location.id).catch(() => []),
    buildBreadcrumbs(fullSlug),
    getFeaturedForLocation(location.id).catch(() => []),
    getActiveBadgeCompanyIds().catch(() => new Set<string>()),
  ]);

  const isMonthly = period !== "all-time";
  const featuredIds = new Set(featuredAll.map((f) => f.company.id));
  // Featured firms are pinned above; drop them from the organic list to avoid
  // showing them twice, then renumber the organic ranks for display.
  const organicAll = ranking.filter((r) => !featuredIds.has(r.company.id));

  // Pagination — featured pins only on page 1.
  const totalPages = Math.max(1, Math.ceil(organicAll.length / PER_PAGE));
  if (page > totalPages && page > 1) notFound();
  const featured = page === 1 ? featuredAll : [];
  const start = (page - 1) * PER_PAGE;
  const organic = organicAll.slice(start, start + PER_PAGE);

  return (
    <main className="pb-4">
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, url: c.href }))),
          ...(page === 1 && ranking.length > 0
            ? [
                itemListJsonLd(
                  `Top App Development Companies in ${location.name}`,
                  ranking.map((r) => ({
                    rank: r.rank,
                    name: r.company.name,
                    slug: r.company.slug,
                  })),
                ),
              ]
            : []),
        ]}
      />
      {/* Header band */}
      <div className="border-b border-slate-200 bg-slate-50">
        <Container className="py-8">
          <Breadcrumbs items={crumbs} />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Top App Development Companies in {location.name}
              </h1>
              <p className="mt-2 text-slate-500">
                {ranking.length > 0
                  ? `${ranking.length} companies ranked`
                  : "Ranking coming soon"}
                {isMonthly ? ` · ${period} snapshot` : " · Updated monthly"}
              </p>
            </div>
            {isMonthly && (
              <Link
                href={`/app-development-companies/${fullSlug}`}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
              >
                View current ranking →
              </Link>
            )}
          </div>

          {children.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Explore within {location.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {children.map((c) => (
                  <Link
                    key={c.id}
                    href={`/app-development-companies/${c.fullSlug}`}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Container>
      </div>

      {/* Body */}
      <Container className="py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {featured.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Featured
                </p>
                {featured.map(({ company, hqLocationName }) => (
                  <CompanyCard
                    key={company.id}
                    rank={0}
                    company={company}
                    hqLocationName={hqLocationName}
                    featured
                    verified={badgeIds.has(company.id)}
                  />
                ))}
              </div>
            )}

            {organic.length === 0 && featured.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                No ranked companies yet for this location.
              </div>
            ) : (
              <ol className="space-y-3">
                {organic.map(({ company, hqLocationName }, i) => (
                  <li key={company.id}>
                    <CompanyCard
                      rank={start + i + 1}
                      company={company}
                      hqLocationName={hqLocationName}
                      verified={badgeIds.has(company.id)}
                    />
                  </li>
                ))}
              </ol>
            )}

            {totalPages > 1 && (
              <nav className="flex items-center justify-between border-t border-slate-200 pt-6">
                {page > 1 ? (
                  <Link
                    href={pagePath(fullSlug, period, page - 1)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={pagePath(fullSlug, period, page + 1)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                  >
                    Next →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-slate-900">
                How we rank
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Rankings combine verified review quality, profile completeness,
                and years in business. Scores refresh monthly and sponsorships
                never influence position.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h2 className="text-sm font-semibold text-blue-900">
                Is this your company?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-blue-800/80">
                Claim your profile for free to manage your listing and reach more
                buyers in {location.name}.
              </p>
              <Link
                href="/#for-companies"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Claim your listing
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
