import Link from "next/link";
import { Container } from "@/components/container";
import { getCompanyBySlug } from "@/lib/queries/locations";
import { submitInquiryAction } from "@/app/actions/inquiries";

export const metadata = {
  title: "Boost your visibility",
  description:
    "Get featured and verified on Toronto App Developers. Request a call to get started.",
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
      <Container className="max-w-xl py-20 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10">
          <div className="text-4xl">✓</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Thanks — we&apos;ll be in touch
          </h1>
          <p className="mt-2 text-slate-600">
            We&apos;ve received your request and will reach out shortly to set up
            your features and arrange payment.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to home
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl py-14">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Grow your visibility
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Request a call
        </h1>
        <p className="mt-3 text-slate-500">
          Featured placement and verified badges are set up personally by our
          team. Tell us what you&apos;re after and we&apos;ll get you live —
          {company ? ` for ${company.name}.` : " no online payment needed."}
        </p>
      </div>

      <form
        action={submitInquiryAction}
        className="mx-auto mt-8 max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        {company && <input type="hidden" name="companyId" value={company.id} />}

        {/* Honeypot — hidden from real users; bots fill it and get dropped. */}
        <div aria-hidden className="absolute left-[-9999px] top-[-9999px]" style={{ position: "absolute" }}>
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {company && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            Requesting for <strong>{company.name}</strong>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Your name" htmlFor="contactName">
            <input id="contactName" name="contactName" required className={inputClass} />
          </Field>
          <Field label="Email" htmlFor="email">
            <input id="email" name="email" type="email" required className={inputClass} />
          </Field>
        </div>

        <Field label="Phone (optional)" htmlFor="phone">
          <input id="phone" name="phone" type="tel" className={inputClass} />
        </Field>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">
            I&apos;m interested in
          </legend>
          <div className="mt-2 space-y-2">
            <Check
              name="interestedIn"
              value="featured"
              label="Featured listing — pinned to the top of your city's rankings"
              defaultChecked={feature === "featured"}
            />
            <Check
              name="interestedIn"
              value="badge"
              label="Verified badge — a trust mark on your profile and listings"
              defaultChecked={feature === "badge"}
            />
          </div>
        </fieldset>

        <Field label="Anything else? (optional)" htmlFor="message">
          <textarea id="message" name="message" rows={3} className={inputClass} />
        </Field>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Request a call
        </button>
        <p className="text-center text-xs text-slate-400">
          No payment now. We&apos;ll arrange everything on the call.
        </p>
      </form>
    </Container>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
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
    <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 transition hover:border-blue-300">
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
