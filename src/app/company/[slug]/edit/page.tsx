import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/container";
import { getCompanyBySlug, getCaseStudies } from "@/lib/queries/locations";
import { isCompanyVerified } from "@/lib/queries/placements";
import { getCurrentUser, hasApprovedClaim } from "@/lib/auth";
import { FOCUS_AREAS, FREE_CASE_STUDY_LIMIT } from "@/db/schema";
import {
  updateProfileAction,
  addCaseStudyAction,
  deleteCaseStudyAction,
} from "@/app/actions/claims";

export const metadata = { title: "Edit profile", robots: { index: false } };

export default async function EditCompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; claimed?: string; limit?: string }>;
}) {
  const { slug } = await params;
  const { saved, claimed, limit } = await searchParams;

  const row = await getCompanyBySlug(slug).catch(() => null);
  if (!row) notFound();
  const { company } = row;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/company/${slug}/edit`);

  if (!(await hasApprovedClaim(user.id, company.id))) {
    return (
      <Container className="max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Not authorized</h1>
        <p className="mt-2 text-slate-500">
          You don&apos;t have an approved claim for {company.name}.
        </p>
        <Link
          href={`/company/${slug}/claim`}
          className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Claim this profile
        </Link>
      </Container>
    );
  }

  const [studies, verified] = await Promise.all([
    getCaseStudies(company.id),
    isCompanyVerified(company.id),
  ]);
  const atLimit = studies.length >= FREE_CASE_STUDY_LIMIT && !verified;
  const selectedFocus = new Set(company.focusAreas ?? []);

  return (
    <Container className="max-w-2xl py-12">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-blue-600">
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        Edit {company.name}
      </h1>

      {claimed && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          🎉 Profile claimed! Fill in the details below — a complete profile
          ranks higher.
        </p>
      )}
      {saved && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Changes saved.
        </p>
      )}

      {/* ---- Core profile (all free) ---- */}
      <form action={updateProfileAction} className="mt-6 space-y-5">
        <input type="hidden" name="companyId" value={company.id} />

        <Field label="Description">
          <textarea
            name="description"
            rows={4}
            defaultValue={company.description ?? ""}
            placeholder="What does your company do? Services, specialties, notable clients…"
            className={inputClass}
          />
        </Field>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">
            Focus areas
          </legend>
          <p className="text-xs text-slate-400">What you build.</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FOCUS_AREAS.map((area) => (
              <label
                key={area}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-blue-300"
              >
                <input
                  type="checkbox"
                  name="focusAreas"
                  value={area}
                  defaultChecked={selectedFocus.has(area)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                {area}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Founded (year)">
            <input name="foundedYear" type="number" min={1900} max={2100} defaultValue={company.foundedYear ?? ""} placeholder="2015" className={inputClass} />
          </Field>
          <Field label="Team size">
            <input name="teamSize" defaultValue={company.teamSize ?? ""} placeholder="10-49" className={inputClass} />
          </Field>
          <Field label="Hourly rate">
            <input name="hourlyRate" defaultValue={company.hourlyRate ?? ""} placeholder="$50 - $99 / hr" className={inputClass} />
          </Field>
          <Field label="Min. project size">
            <input name="minProjectSize" defaultValue={company.minProjectSize ?? ""} placeholder="$10,000+" className={inputClass} />
          </Field>
        </div>

        <Field label="Logo URL">
          <input name="logoUrl" type="url" defaultValue={company.logoUrl ?? ""} placeholder="https://yourcompany.com/logo.png" className={inputClass} />
        </Field>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700">Social links</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input name="linkedinUrl" type="url" defaultValue={company.linkedinUrl ?? ""} placeholder="LinkedIn URL" className={inputClass} />
            <input name="twitterUrl" type="url" defaultValue={company.twitterUrl ?? ""} placeholder="X / Twitter URL" className={inputClass} />
            <input name="facebookUrl" type="url" defaultValue={company.facebookUrl ?? ""} placeholder="Facebook URL" className={inputClass} />
            <input name="instagramUrl" type="url" defaultValue={company.instagramUrl ?? ""} placeholder="Instagram URL" className={inputClass} />
          </div>
        </fieldset>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
            Save changes
          </button>
          <Link href={`/company/${slug}`} className="text-sm font-medium text-slate-500 hover:text-slate-900">
            View public profile
          </Link>
        </div>
      </form>

      {/* ---- Portfolio / case studies ---- */}
      <section id="portfolio" className="mt-12 scroll-mt-24 border-t border-slate-200 pt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold text-slate-900">Portfolio</h2>
          <span className="text-sm text-slate-400">
            {verified ? "Verified · unlimited" : `${studies.length} / ${FREE_CASE_STUDY_LIMIT} free`}
          </span>
        </div>

        {limit && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You&apos;ve reached the free limit of {FREE_CASE_STUDY_LIMIT} case
            studies.{" "}
            <Link href={`/upgrade?company=${slug}&feature=badge`} className="font-semibold underline">
              Upgrade to Verified
            </Link>{" "}
            for unlimited.
          </p>
        )}

        {studies.length > 0 && (
          <ul className="mt-5 space-y-3">
            {studies.map((cs) => (
              <li key={cs.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{cs.title}</p>
                  {cs.description && <p className="mt-1 text-sm text-slate-500">{cs.description}</p>}
                  {cs.url && (
                    <a href={cs.url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-sm text-blue-600 hover:underline">
                      {cs.url}
                    </a>
                  )}
                </div>
                <form action={deleteCaseStudyAction}>
                  <input type="hidden" name="caseStudyId" value={cs.id} />
                  <button type="submit" className="text-sm font-medium text-slate-400 transition hover:text-rose-600">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {atLimit ? (
          <div className="mt-5 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-6 text-center">
            <p className="text-sm text-slate-600">
              You&apos;ve added the {FREE_CASE_STUDY_LIMIT} free case studies.
            </p>
            <Link href={`/upgrade?company=${slug}&feature=badge`} className="mt-3 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Get Verified for unlimited
            </Link>
          </div>
        ) : (
          <form action={addCaseStudyAction} className="mt-5 space-y-3 rounded-xl border border-slate-200 p-5">
            <input type="hidden" name="companyId" value={company.id} />
            <p className="text-sm font-semibold text-slate-700">Add a case study</p>
            <input name="title" required placeholder="Project title *" className={inputClass} />
            <textarea name="description" rows={2} placeholder="What you built and the outcome" className={inputClass} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input name="url" type="url" placeholder="Project or client URL" className={inputClass} />
              <input name="imageUrl" type="url" placeholder="Image URL (optional)" className={inputClass} />
            </div>
            <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
              Add case study
            </button>
          </form>
        )}
      </section>
    </Container>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
