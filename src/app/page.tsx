import Link from "next/link";
import { Container } from "@/components/container";
import { CompanyCard } from "@/components/company-card";
import { JsonLd } from "@/components/json-ld";
import { websiteJsonLd, organizationJsonLd } from "@/lib/jsonld";
import {
  getRegionsWithCounts,
  getStats,
  getTopCompaniesBySlug,
} from "@/lib/queries/locations";

// Cache the homepage; refresh hourly.
export const revalidate = 3600;

export default async function Home() {
  let regions: Awaited<ReturnType<typeof getRegionsWithCounts>> = [];
  let stats = { companies: 0, cities: 0, regions: 0 };
  let topCompanies: Awaited<ReturnType<typeof getTopCompaniesBySlug>> = [];
  let dbReady = true;
  try {
    [regions, stats, topCompanies] = await Promise.all([
      getRegionsWithCounts(),
      getStats(),
      getTopCompaniesBySlug("gta", 5),
    ]);
  } catch {
    dbReady = false;
  }

  return (
    <main>
      <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />
      <Hero stats={stats} />

      {dbReady && (
        <>
          <RegionsSection regions={regions} />
          {topCompanies.length > 0 && <TopSection companies={topCompanies} />}
        </>
      )}

      <HowItWorks />
      <ForCompanies />

      {!dbReady && (
        <Container>
          <div className="mb-20 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
            Database not connected — showing static sections only.
          </div>
        </Container>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */

function Hero({ stats }: { stats: { companies: number; cities: number; regions: number } }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white">
      <div className="bg-grid absolute inset-0" />
      <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

      <Container className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Greater Toronto Area · Updated monthly
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Find the best{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              app developers
            </span>{" "}
            in the GTA
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
            A curated, independently-ranked directory of app development
            companies across Toronto, Peel, York, Halton, and Durham — so you can
            shortlist the right partner with confidence.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#regions"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
            >
              Browse by region
            </Link>
            <Link
              href="#for-companies"
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              List your company free
            </Link>
          </div>

          <dl className="mx-auto mt-14 grid max-w-lg grid-cols-3 gap-8">
            <Stat value={`${stats.companies}+`} label="Companies" />
            <Stat value={stats.cities} label="Cities & towns" />
            <Stat value={stats.regions} label="Regions" />
          </dl>
        </div>
      </Container>
    </section>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <dt className="text-3xl font-bold tracking-tight sm:text-4xl">{value}</dt>
      <dd className="mt-1 text-sm text-slate-400">{label}</dd>
    </div>
  );
}

function RegionsSection({
  regions,
}: {
  regions: Awaited<ReturnType<typeof getRegionsWithCounts>>;
}) {
  return (
    <section id="regions" className="scroll-mt-20 py-20">
      <Container>
        <SectionHeading
          eyebrow="Browse the directory"
          title="Explore by region"
          subtitle="The GTA broken down into its five regions. Drill into any region to reach individual cities and towns."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((region) => (
            <Link
              key={region.id}
              href={`/app-development-companies/${region.fullSlug}`}
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
            >
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {region.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {region.companyCount} companies ranked
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition group-hover:bg-blue-600 group-hover:text-white">
                →
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

function TopSection({
  companies,
}: {
  companies: Awaited<ReturnType<typeof getTopCompaniesBySlug>>;
}) {
  return (
    <section className="bg-slate-50 py-20">
      <Container>
        <SectionHeading
          eyebrow="This month"
          title="Top-ranked across the GTA"
          subtitle="Ranked by review quality, profile completeness, and tenure. Fully transparent — sponsorships never affect the score."
        />
        <div className="mt-10 space-y-3">
          {companies.map(({ rank, company, hqLocationName }) => (
            <CompanyCard
              key={company.id}
              rank={rank}
              company={company}
              hqLocationName={hqLocationName}
            />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/app-development-companies/gta"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View the full GTA ranking →
          </Link>
        </div>
      </Container>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: "🔍",
      title: "Browse & compare",
      body: "Explore ranked companies by city or region, with ratings, reviews, and firmographics side by side.",
    },
    {
      icon: "📊",
      title: "Transparent rankings",
      body: "Every ranking is computed from objective signals and refreshed monthly. No pay-to-win.",
    },
    {
      icon: "🤝",
      title: "Connect directly",
      body: "Reach out to shortlisted partners directly — no middleman, no lead fees for buyers.",
    },
  ];
  return (
    <section id="how" className="scroll-mt-20 py-20">
      <Container>
        <SectionHeading
          eyebrow="How it works"
          title="Shortlist with confidence"
          subtitle="Built on the Clutch model — independent rankings that buyers can trust and companies can grow with."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-slate-200 bg-white p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                {s.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ForCompanies() {
  return (
    <section id="for-companies" className="scroll-mt-20 pb-8">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-8 py-14 text-center text-white sm:px-16">
          <div className="bg-grid absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Own an app studio in the GTA?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Your profile may already be listed. Claim it for free to manage your
              information, respond to buyers, and grow your visibility.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/app-development-companies/gta"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                Find your company
              </Link>
              <span className="text-sm text-blue-200">
                Free to claim · No credit card
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-lg text-slate-500">{subtitle}</p>}
    </div>
  );
}
