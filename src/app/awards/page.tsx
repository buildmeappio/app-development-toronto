import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { getRegions, getChildren } from "@/lib/queries/locations";

export const revalidate = 86400;

const YEAR = String(new Date().getFullYear());

export const metadata: Metadata = {
  title: `Top App Developer Awards (${YEAR})`,
  description: `The best app development companies across the Greater Toronto Area, ranked for ${YEAR} by region and city.`,
  alternates: { canonical: "/awards" },
};

export default async function AwardsHub() {
  const regions = await getRegions().catch(() => []);
  const withCities = await Promise.all(
    regions.map(async (r) => ({
      region: r,
      cities: await getChildren(r.id).catch(() => []),
    })),
  );

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-950 text-white">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <Container className="relative py-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-1 text-sm font-semibold text-amber-300">
            🏆 {YEAR}
          </span>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Top App Developer Awards
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            The highest-ranked app development companies across the GTA — by
            region and city, updated for {YEAR}.
          </p>
          <Link
            href={`/awards/${YEAR}/gta`}
            className="mt-8 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
          >
            See the GTA-wide winners →
          </Link>
        </Container>
      </section>

      <Container className="py-12">
        <div className="space-y-10">
          {withCities.map(({ region, cities }) => (
            <div key={region.id}>
              <h2 className="text-lg font-semibold text-slate-900">
                <Link
                  href={`/awards/${YEAR}/${region.fullSlug}`}
                  className="hover:text-blue-600"
                >
                  {region.name}
                </Link>
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {cities.map((c) => (
                  <Link
                    key={c.id}
                    href={`/awards/${YEAR}/${c.fullSlug}`}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
