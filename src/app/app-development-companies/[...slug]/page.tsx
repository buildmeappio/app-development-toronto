import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getLocationByFullSlug,
  getChildren,
  getRanking,
} from "@/lib/queries/locations";

// A monthly period looks like "2026/08"; anything else is the all-time page.
function parseSlug(slug: string[]): { fullSlug: string; period: string } {
  const last2 = slug.slice(-2);
  const isMonthly =
    last2.length === 2 && /^\d{4}$/.test(last2[0]) && /^\d{2}$/.test(last2[1]);
  if (isMonthly) {
    return {
      fullSlug: slug.slice(0, -2).join("/"),
      period: `${last2[0]}-${last2[1]}`,
    };
  }
  return { fullSlug: slug.join("/"), period: "all-time" };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { fullSlug, period } = parseSlug(slug);
  const location = await getLocationByFullSlug(fullSlug).catch(() => null);
  if (!location) return { title: "Not found" };

  const periodLabel = period === "all-time" ? "" : ` — ${period}`;
  const title = `Top App Development Companies in ${location.name}${periodLabel}`;
  return {
    title,
    description: `Ranked list of the best app development companies in ${location.name}, GTA. Curated and updated monthly.`,
    alternates: { canonical: `/app-development-companies/${fullSlug}` },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const { fullSlug, period } = parseSlug(slug);

  const location = await getLocationByFullSlug(fullSlug).catch(() => null);
  if (!location) notFound();

  const [ranking, children] = await Promise.all([
    getRanking(location.id, period).catch(() => []),
    getChildren(location.id).catch(() => []),
  ]);

  const isMonthly = period !== "all-time";

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">
          GTA
        </Link>{" "}
        / <span className="text-gray-900">{location.name}</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-gray-900">
        Top App Development Companies in {location.name}
        {isMonthly && (
          <span className="ml-2 text-xl font-normal text-gray-500">
            {period}
          </span>
        )}
      </h1>

      {isMonthly && (
        <p className="mt-2 text-sm text-gray-500">
          Monthly snapshot.{" "}
          <Link
            href={`/app-development-companies/${fullSlug}`}
            className="text-blue-600 hover:underline"
          >
            View current all-time ranking →
          </Link>
        </p>
      )}

      {children.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Explore within {location.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {children.map((c) => (
              <Link
                key={c.id}
                href={`/app-development-companies/${c.fullSlug}`}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:border-blue-400"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        {ranking.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-6 text-gray-500">
            No ranked companies yet for this location. Run the curation engine
            and monthly ranking job to populate this page.
          </p>
        ) : (
          <ol className="space-y-3">
            {ranking.map(({ rank, company }) => (
              <li
                key={company.id}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
              >
                <span className="w-8 text-lg font-bold text-gray-400">
                  {rank}
                </span>
                <div className="flex-1">
                  <Link
                    href={`/company/${company.slug}`}
                    className="font-semibold text-gray-900 hover:text-blue-600"
                  >
                    {company.name}
                  </Link>
                  {company.googleRating != null && (
                    <p className="text-sm text-gray-500">
                      ★ {company.googleRating.toFixed(1)} (
                      {company.googleRatingCount ?? 0} reviews)
                    </p>
                  )}
                </div>
                {company.claimStatus === "unclaimed" && (
                  <Link
                    href={`/company/${company.slug}/claim`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Claim this profile
                  </Link>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
