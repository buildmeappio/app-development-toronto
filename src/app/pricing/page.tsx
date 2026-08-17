import Link from "next/link";
import { Container } from "@/components/container";

export const metadata = {
  title: "Pricing & paid features",
  description:
    "Featured listings and verified badges for app development companies in the GTA. Simple, human onboarding — request a call to get started.",
};

const FEATURES = [
  {
    name: "Featured listing",
    tagline: "Top of your city's rankings",
    icon: "★",
    points: [
      "Pinned above the organic ranking on your city and region pages",
      "Clearly labeled “Sponsored” — buyers still trust the list",
      "Choose the cities where you want to stand out",
    ],
    feature: "featured",
  },
  {
    name: "Verified badge",
    tagline: "A trust mark buyers look for",
    icon: "✓",
    points: [
      "A verified checkmark on your profile and every listing",
      "Signals a vetted, responsive company",
      "Pairs well with a completed, claimed profile",
    ],
    feature: "badge",
  },
];

export default function PricingPage() {
  return (
    <main>
      <section className="border-b border-slate-200 bg-slate-50">
        <Container className="py-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Grow your presence in the GTA
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Claiming your profile is always free. When you&apos;re ready for more
            visibility, we set up featured placement and verified badges
            personally — no online checkout, no lock-in.
          </p>
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-600">
                {f.icon}
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-900">{f.name}</h2>
              <p className="text-sm text-slate-500">{f.tagline}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {f.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm text-slate-600">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href={`/upgrade?feature=${f.feature}`}
                className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Request a call
              </Link>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h3 className="text-lg font-semibold text-slate-900">How it works</h3>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <Step n={1}>Request a call — tell us what you&apos;re interested in.</Step>
            <Step n={2}>We reach out, confirm the details, and agree on pricing.</Step>
            <Step n={3}>You send payment by e-Transfer.</Step>
            <Step n={4}>We activate your features — usually the same day.</Step>
          </ol>
          <p className="mt-6 text-sm text-slate-500">
            Transparent by design: rankings are computed from real signals and
            never sold. Featured slots are always labeled.
          </p>
        </div>
      </Container>
    </main>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
