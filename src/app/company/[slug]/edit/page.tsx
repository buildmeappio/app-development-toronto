import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  PageShell,
  PageHeading,
  Section,
  Panel,
  Field,
  inputCls,
  textareaCls,
  btn,
} from "@/components/ui";
import { getCompanyBySlug, getCaseStudies, getTeamMembers } from "@/lib/queries/locations";
import { isCompanyVerified } from "@/lib/queries/placements";
import { getCurrentUser, hasApprovedClaim } from "@/lib/auth";
import { FOCUS_AREAS, FREE_CASE_STUDY_LIMIT, FREE_TEAM_LIMIT } from "@/db/schema";
import { computeCompleteness } from "@/lib/completeness";
import { CompanyLogo } from "@/components/company-logo";
import {
  updateProfileAction,
  addCaseStudyAction,
  deleteCaseStudyAction,
  addTeamMemberAction,
  deleteTeamMemberAction,
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
      <PageShell width="narrow">
        <Panel className="p-10 text-center">
          <h1 className="text-xl font-bold text-slate-900">Not authorized</h1>
          <p className="mt-2 text-slate-500">
            You don&apos;t have an approved claim for {company.name}.
          </p>
          <Link href={`/company/${slug}/claim`} className={btn("primary", "mt-5")}>
            Claim this profile
          </Link>
        </Panel>
      </PageShell>
    );
  }

  const [studies, verified, team] = await Promise.all([
    getCaseStudies(company.id),
    isCompanyVerified(company.id),
    getTeamMembers(company.id),
  ]);
  const atTeamLimit = team.length >= FREE_TEAM_LIMIT;
  const atLimit = studies.length >= FREE_CASE_STUDY_LIMIT && !verified;
  const selectedFocus = new Set(company.focusAreas ?? []);
  const socials = [company.linkedinUrl, company.twitterUrl, company.facebookUrl, company.instagramUrl].filter(Boolean).length;
  const comp = computeCompleteness(company, { caseStudies: studies.length, socials });

  return (
    <PageShell>
      <PageHeading eyebrow="Edit profile" title={company.name}>
        <Link href={`/company/${slug}`} className={btn("secondary")}>
          View public profile
        </Link>
      </PageHeading>

      {claimed && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          🎉 Profile claimed! Fill in the details below — a complete profile ranks
          higher and wins more trust.
        </div>
      )}
      {saved && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Changes saved.
        </div>
      )}

      {/* Completeness */}
      <Panel className="mb-6 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-900">
            Profile {comp.percent}% complete
          </span>
          <span className="text-slate-400">
            {comp.done}/{comp.total} done
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${comp.percent === 100 ? "bg-emerald-500" : "bg-blue-600"}`}
            style={{ width: `${comp.percent}%` }}
          />
        </div>
        {comp.percent < 100 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {comp.items
              .filter((i) => !i.done)
              .map((i) => (
                <span
                  key={i.label}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500"
                >
                  {i.label}
                </span>
              ))}
          </div>
        )}
      </Panel>

      {/* Main profile form */}
      <form action={updateProfileAction} className="space-y-6">
        <input type="hidden" name="companyId" value={company.id} />

        <Section title="Basics" desc="The essentials buyers read first.">
          <div className="space-y-5">
            <Field label="Description">
              <textarea
                name="description"
                rows={4}
                defaultValue={company.description ?? ""}
                placeholder="What does your company do? Services, specialties, notable clients…"
                className={textareaCls}
              />
            </Field>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Focus areas
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FOCUS_AREAS.map((area) => (
                  <label
                    key={area}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 transition hover:border-blue-300 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50"
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
            </div>
            <Field label="Tech stack" hint="Comma-separated — e.g. Swift, Kotlin, Flutter, React Native, Node.js">
              <input
                name="techStack"
                defaultValue={(company.techStack ?? []).join(", ")}
                placeholder="Swift, Kotlin, Flutter, Node.js"
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        <Section title="Company details">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Founded (year)">
              <input name="foundedYear" type="number" min={1900} max={2100} defaultValue={company.foundedYear ?? ""} placeholder="2015" className={inputCls} />
            </Field>
            <Field label="Team size">
              <input name="teamSize" defaultValue={company.teamSize ?? ""} placeholder="10-49" className={inputCls} />
            </Field>
            <Field label="Hourly rate">
              <input name="hourlyRate" defaultValue={company.hourlyRate ?? ""} placeholder="$50 - $99 / hr" className={inputCls} />
            </Field>
            <Field label="Min. project size">
              <input name="minProjectSize" defaultValue={company.minProjectSize ?? ""} placeholder="$10,000+" className={inputCls} />
            </Field>
          </div>
        </Section>

        <Section title="Branding & links">
          <div className="space-y-5">
            <Field label="Logo URL" hint="A square PNG or SVG works best.">
              <input name="logoUrl" type="url" defaultValue={company.logoUrl ?? ""} placeholder="https://yourcompany.com/logo.png" className={inputCls} />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input name="linkedinUrl" type="url" defaultValue={company.linkedinUrl ?? ""} placeholder="LinkedIn URL" className={inputCls} />
              <input name="twitterUrl" type="url" defaultValue={company.twitterUrl ?? ""} placeholder="X / Twitter URL" className={inputCls} />
              <input name="facebookUrl" type="url" defaultValue={company.facebookUrl ?? ""} placeholder="Facebook URL" className={inputCls} />
              <input name="instagramUrl" type="url" defaultValue={company.instagramUrl ?? ""} placeholder="Instagram URL" className={inputCls} />
            </div>
          </div>
        </Section>

        <div className="sticky bottom-4 z-10">
          <Panel className="flex items-center justify-between gap-3 p-3 pl-5">
            <span className="text-sm text-slate-500">Unsaved changes?</span>
            <button type="submit" className={btn("primary")}>
              Save changes
            </button>
          </Panel>
        </div>
      </form>

      {/* Portfolio */}
      <div id="portfolio" className="mt-6 scroll-mt-24">
        <Section
          title="Portfolio"
          desc="Show your best work — case studies build trust."
          aside={
            <span className="text-sm text-slate-400">
              {verified ? "Verified · unlimited" : `${studies.length} / ${FREE_CASE_STUDY_LIMIT} free`}
            </span>
          }
        >
          {limit && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              You&apos;ve reached the free limit of {FREE_CASE_STUDY_LIMIT} case
              studies.{" "}
              <Link href={`/upgrade?company=${slug}&feature=badge`} className="font-semibold underline">
                Upgrade to Verified
              </Link>{" "}
              for unlimited.
            </div>
          )}

          {studies.length > 0 && (
            <ul className="mb-5 space-y-3">
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
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-6 text-center">
              <p className="text-sm text-slate-600">
                You&apos;ve added the {FREE_CASE_STUDY_LIMIT} free case studies.
              </p>
              <Link href={`/upgrade?company=${slug}&feature=badge`} className={btn("primary", "mt-3")}>
                Get Verified for unlimited
              </Link>
            </div>
          ) : (
            <form action={addCaseStudyAction} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
              <input type="hidden" name="companyId" value={company.id} />
              <p className="text-sm font-semibold text-slate-700">Add a case study</p>
              <input name="title" required placeholder="Project title *" className={inputCls} />
              <textarea name="description" rows={2} placeholder="What you built and the outcome" className={textareaCls} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input name="url" type="url" placeholder="Project or client URL" className={inputCls} />
                <input name="imageUrl" type="url" placeholder="Image URL (optional)" className={inputCls} />
              </div>
              <button type="submit" className={btn("dark")}>
                Add case study
              </button>
            </form>
          )}
        </Section>
      </div>

      {/* Team */}
      <div id="team" className="mt-6 scroll-mt-24">
        <Section
          title="Team"
          desc="Put faces to your company — buyers trust teams they can see."
          aside={<span className="text-sm text-slate-400">{team.length} / {FREE_TEAM_LIMIT}</span>}
        >
          {team.length > 0 && (
            <ul className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {team.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                  <CompanyLogo name={m.name} logoUrl={m.photoUrl} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{m.name}</p>
                    {m.role && <p className="truncate text-xs text-slate-500">{m.role}</p>}
                  </div>
                  <form action={deleteTeamMemberAction}>
                    <input type="hidden" name="memberId" value={m.id} />
                    <button type="submit" className="text-xs font-medium text-slate-400 transition hover:text-rose-600">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {atTeamLimit ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              You&apos;ve added the maximum of {FREE_TEAM_LIMIT} team members.
            </p>
          ) : (
            <form action={addTeamMemberAction} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-5 sm:grid-cols-3">
              <input type="hidden" name="companyId" value={company.id} />
              <input name="name" required placeholder="Name *" className={inputCls} />
              <input name="role" placeholder="Role (e.g. CTO)" className={inputCls} />
              <input name="photoUrl" type="url" placeholder="Photo URL" className={inputCls} />
              <div className="sm:col-span-3">
                <button type="submit" className={btn("dark")}>Add team member</button>
              </div>
            </form>
          )}
        </Section>
      </div>
    </PageShell>
  );
}
