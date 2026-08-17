import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/container";
import { getCompanyBySlug } from "@/lib/queries/locations";
import { getCurrentUser, hasApprovedClaim } from "@/lib/auth";
import { updateProfileAction } from "@/app/actions/claims";

export const metadata = { title: "Edit profile", robots: { index: false } };

export default async function EditCompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; claimed?: string }>;
}) {
  const { slug } = await params;
  const { saved, claimed } = await searchParams;

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

  return (
    <Container className="max-w-2xl py-12">
      <Link
        href="/dashboard"
        className="text-sm text-slate-500 hover:text-blue-600"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        Edit {company.name}
      </h1>

      {claimed && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          🎉 Profile claimed! Fill in the details below to complete your listing
          — a complete profile ranks higher.
        </p>
      )}
      {saved && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Changes saved.
        </p>
      )}

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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Founded (year)">
            <input
              name="foundedYear"
              type="number"
              min={1900}
              max={2100}
              defaultValue={company.foundedYear ?? ""}
              placeholder="2015"
              className={inputClass}
            />
          </Field>
          <Field label="Team size">
            <input
              name="teamSize"
              defaultValue={company.teamSize ?? ""}
              placeholder="10-49"
              className={inputClass}
            />
          </Field>
          <Field label="Hourly rate">
            <input
              name="hourlyRate"
              defaultValue={company.hourlyRate ?? ""}
              placeholder="$50 - $99 / hr"
              className={inputClass}
            />
          </Field>
          <Field label="Min. project size">
            <input
              name="minProjectSize"
              defaultValue={company.minProjectSize ?? ""}
              placeholder="$10,000+"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Logo URL">
          <input
            name="logoUrl"
            type="url"
            defaultValue={company.logoUrl ?? ""}
            placeholder="https://yourcompany.com/logo.png"
            className={inputClass}
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Save changes
          </button>
          <Link
            href={`/company/${slug}`}
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            View public profile
          </Link>
        </div>
      </form>
    </Container>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
