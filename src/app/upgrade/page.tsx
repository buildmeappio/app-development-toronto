import Link from "next/link";
import { PageShell, Panel, Field, inputCls, textareaCls, btn } from "@/components/ui";
import { getCompanyBySlug } from "@/lib/queries/locations";
import { submitInquiryAction } from "@/app/actions/inquiries";

export const metadata = {
  title: "Boost your visibility",
  description:
    "Get featured and verified on Toronto App Dev. Request a call to get started.",
};

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; sent?: string; feature?: string }>;
}) {
  const { company: companySlug, sent, feature } = await searchParams;
  const row = companySlug
    ? await getCompanyBySlug(companySlug).catch(() => null)
    : null;
  const company = row?.company ?? null;

  if (sent) {
    return (
      <PageShell width="narrow">
        <Panel className="p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Thanks — we&apos;ll be in touch
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-slate-600">
            We&apos;ve received your request and will reach out shortly to set up
            your features and arrange payment.
          </p>
          <Link href="/" className={btn("primary", "mt-6")}>
            Back to home
          </Link>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Grow your visibility
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Request a call
        </h1>
        <p className="mt-3 text-slate-500">
          Featured placement and verified badges are set up personally by our
          team.{" "}
          {company ? `Tell us what you're after for ${company.name}.` : "No online payment needed."}
        </p>
      </div>

      <Panel className="mx-auto mt-8 max-w-lg p-8">
        <form action={submitInquiryAction} className="space-y-5">
          {company && <input type="hidden" name="companyId" value={company.id} />}
          <div aria-hidden className="absolute left-[-9999px]" style={{ position: "absolute" }}>
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          {company && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              Requesting for <strong>{company.name}</strong>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Your name" htmlFor="contactName" required>
              <input id="contactName" name="contactName" required className={inputCls} />
            </Field>
            <Field label="Email" htmlFor="email" required>
              <input id="email" name="email" type="email" required className={inputCls} />
            </Field>
          </div>
          <Field label="Phone" htmlFor="phone">
            <input id="phone" name="phone" type="tel" className={inputCls} />
          </Field>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">
              I&apos;m interested in
            </legend>
            <div className="space-y-2">
              <Check name="interestedIn" value="featured" label="Featured listing — pinned to the top of your city's rankings" defaultChecked={feature === "featured"} />
              <Check name="interestedIn" value="badge" label="Verified badge — a trust mark on your profile and listings" defaultChecked={feature === "badge"} />
            </div>
          </fieldset>

          <Field label="Anything else?" htmlFor="message">
            <textarea id="message" name="message" rows={3} className={textareaCls} />
          </Field>

          <button type="submit" className={btn("primary", "w-full")}>
            Request a call
          </button>
          <p className="text-center text-xs text-slate-400">
            No payment now. We&apos;ll arrange everything on the call.
          </p>
        </form>
      </Panel>
    </PageShell>
  );
}

function Check({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 transition hover:border-blue-300 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
      />
      <span>{label}</span>
    </label>
  );
}
