import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompanyLogo } from "@/components/company-logo";
import { StarRating } from "@/components/star-rating";
import { RankBadge } from "@/components/badge";
import { JsonLd } from "@/components/json-ld";
import { itemListJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import {
  getLocationByFullSlug,
  getRanking,
  getAllLocationFullSlugs,
} from "@/lib/queries/locations";

const AWARD_SIZE = 15;

function parseSlug(slug: string[]): { year: string; fullSlug: string } {
  if (/^\d{4}$/.test(slug[0])) {
    return { year: slug[0], fullSlug: slug.slice(1).join("/") };
  }
  return { year: String(new Date().getFullYear()), fullSlug: slug.join("/") };
}

export async function generateStaticParams() {
  const year = String(new Date().getFullYear());
  const locs = await getAllLocationFullSlugs().catch(() => []);
  return locs.map((l) => ({ slug: [year, ...l.fullSlug.split("/")] }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { year, fullSlug } = parseSlug(slug);
  const loc = await getLocationByFullSlug(fullSlug).catch(() => null);
  if (!loc) return { title: "Not found" };
  const title = `Top App Development Companies in ${loc.name} (${year})`;
  return {
    title,
    description: `The ${AWARD_SIZE} best-ranked app development companies in ${loc.name} for ${year}, curated by Toronto App Dev.`,
    alternates: { canonical: `/awards/${year}/${fullSlug}` },
  };
}

export const revalidate = 86400;

export default async function AwardPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const { year, fullSlug } = parseSlug(slug);

  const loc = await getLocationByFullSlug(fullSlug).catch(() => null);
  if (!loc) notFound();

  const ranking = await getRanking(loc.id, "all-time", AWARD_SIZE).catch(() => []);
  if (ranking.length === 0) notFound();

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Awards", url: "/awards" },
            { name: `${loc.name} ${year}` },
          ]),
          itemListJsonLd(
            `Top App Development Companies in ${loc.name} (${year})`,
            ranking.map((r) => ({ rank: r.rank, name: r.company.name, slug: r.company.slug })),
          ),
        ]}
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950 text-white">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <Container className="relative py-16 text-center">
          <Breadcrumbs
            items={[
              { label: "Awards", href: "/awards" },
              { label: `${loc.name} ${year}` },
            ]}
          />
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-1 text-sm font-semibold text-amber-300">
            🏆 {year} Rankings
          </span>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Top App Development Companies in {loc.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            The {ranking.length} highest-ranked app developers in {loc.name},
            scored on verified reviews, portfolio, and track record.
          </p>
        </Container>
      </section>

      <Container className="py-12">
        <ol className="mx-auto max-w-3xl space-y-3">
          {ranking.map(({ rank, company }) => (
            <li
              key={company.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-4">
                <RankBadge rank={rank} />
                <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={52} />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/company/${company.slug}`}
                  className="font-semibold text-slate-900 hover:text-blue-600"
                >
                  {company.name}
                </Link>
                <div className="mt-1">
                  {company.googleRating != null ? (
                    <StarRating rating={company.googleRating} count={company.googleRatingCount} />
                  ) : (
                    <span className="text-sm text-slate-400">Curated pick</span>
                  )}
                </div>
              </div>
              <Link
                href={`/awards/embed/${company.slug}?location=${fullSlug}&year=${year}`}
                className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
              >
                Get your badge →
              </Link>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          <p>
            <strong className="text-slate-900">How this list is made:</strong>{" "}
            rankings are computed from review quality, profile completeness, and
            years in business, refreshed monthly. Sponsorships never affect
            placement. On this list?{" "}
            <span className="font-medium text-slate-900">
              Grab your badge above
            </span>{" "}
            to show it off.
          </p>
        </div>
      </Container>
    </main>
  );
}
