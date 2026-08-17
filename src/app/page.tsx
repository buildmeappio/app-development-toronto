import Link from "next/link";
import { getRegions } from "@/lib/queries/locations";

export default async function Home() {
  let regions: Awaited<ReturnType<typeof getRegions>> = [];
  let dbReady = true;
  try {
    regions = await getRegions();
  } catch {
    dbReady = false;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
          Greater Toronto Area
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
          Top App Development Companies in the GTA
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-600">
          Curated, ranked directory of app developers across Toronto, Peel,
          York, Halton, and Durham. Updated monthly.
        </p>
      </header>

      {!dbReady ? (
        <SetupNotice />
      ) : regions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-6 text-gray-500">
          No locations yet. Run <code className="font-mono">npm run db:seed</code>{" "}
          to load the GTA geography.
        </p>
      ) : (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Browse by region
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {regions.map((region) => (
              <Link
                key={region.id}
                href={`/app-development-companies/${region.fullSlug}`}
                className="rounded-lg border border-gray-200 p-4 transition hover:border-blue-400 hover:shadow-sm"
              >
                <span className="font-medium text-gray-900">{region.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function SetupNotice() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
      <h2 className="font-semibold text-amber-900">Finish setup</h2>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-amber-800">
        <li>
          Fill <code className="font-mono">.env.local</code> with your Supabase
          connection strings.
        </li>
        <li>
          Push the schema: <code className="font-mono">npm run db:push</code>
        </li>
        <li>
          Seed the GTA tree: <code className="font-mono">npm run db:seed</code>
        </li>
      </ol>
    </div>
  );
}
