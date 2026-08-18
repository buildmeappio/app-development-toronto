import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { SearchForm } from "@/components/search-form";
import { CompanyLogo } from "@/components/company-logo";
import { StarRating } from "@/components/star-rating";
import { searchCompanies, searchLocations } from "@/lib/queries/locations";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [companies, locations] = query
    ? await Promise.all([
        searchCompanies(query).catch(() => []),
        searchLocations(query).catch(() => []),
      ])
    : [[], []];

  return (
    <Container className="max-w-3xl py-12">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Search</h1>
      <div className="mt-4">
        <SearchForm defaultValue={query} />
      </div>

      {!query ? (
        <p className="mt-10 text-slate-500">
          Search for an app development company or a city in the GTA.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          {locations.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cities & regions
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {locations.map((l) => (
                  <Link
                    key={l.id}
                    href={`/app-development-companies/${l.fullSlug}`}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                  >
                    {l.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Companies {companies.length > 0 && `(${companies.length})`}
            </h2>
            {companies.length === 0 ? (
              <p className="mt-3 text-slate-500">
                No companies found for &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {companies.map(({ company, hqLocationName }) => (
                  <li key={company.id}>
                    <Link
                      href={`/company/${company.slug}`}
                      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                    >
                      <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{company.name}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                          {company.googleRating != null && (
                            <StarRating rating={company.googleRating} count={company.googleRatingCount} />
                          )}
                          {hqLocationName && <span>📍 {hqLocationName}</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Container>
  );
}
