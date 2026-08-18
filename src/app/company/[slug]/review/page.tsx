import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/container";
import { getCompanyBySlug } from "@/lib/queries/locations";
import { submitReviewAction } from "@/app/actions/reviews";

export const metadata = { title: "Write a review", robots: { index: false } };

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { slug } = await params;
  const { submitted } = await searchParams;
  const row = await getCompanyBySlug(slug).catch(() => null);
  if (!row) notFound();
  const { company } = row;

  if (submitted) {
    return (
      <Container className="max-w-xl py-20 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10">
          <div className="text-4xl">★</div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Thanks for your review
          </h1>
          <p className="mt-2 text-slate-600">
            We&apos;ve received your review of {company.name}. It will appear on
            their profile once we&apos;ve checked it.
          </p>
          <Link
            href={`/company/${slug}`}
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to profile
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl py-14">
      <Link href={`/company/${slug}`} className="text-sm text-slate-500 hover:text-blue-600">
        ← Back to {company.name}
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        Review {company.name}
      </h1>
      <p className="mt-2 text-slate-500">
        Share your experience working with {company.name}. Reviews are checked
        before they&apos;re published.
      </p>

      <form
        action={submitReviewAction}
        className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <input type="hidden" name="companyId" value={company.id} />
        <div aria-hidden className="absolute left-[-9999px]" style={{ position: "absolute" }}>
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Overall rating *</legend>
          <div className="mt-2 flex gap-2">
            {[5, 4, 3, 2, 1].map((n) => (
              <label
                key={n}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50"
              >
                <input type="radio" name="rating" value={n} required className="accent-amber-500" />
                {n}★
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Your name *">
            <input name="reviewerName" required className={inputClass} />
          </Field>
          <Field label="Your role">
            <input name="reviewerRole" placeholder="e.g. CTO" className={inputClass} />
          </Field>
          <Field label="Your company">
            <input name="reviewerCompany" className={inputClass} />
          </Field>
          <Field label="Project type">
            <input name="projectType" placeholder="e.g. Mobile App Development" className={inputClass} />
          </Field>
        </div>

        <Field label="Headline">
          <input name="title" placeholder="Sum up your experience" className={inputClass} />
        </Field>

        <Field label="Your review *">
          <textarea
            name="body"
            rows={5}
            required
            placeholder="What was the project? How did they do? Would you recommend them?"
            className={inputClass}
          />
        </Field>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Submit review
        </button>
        <p className="text-center text-xs text-slate-400">
          We may reach out to verify your review before publishing.
        </p>
      </form>
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
