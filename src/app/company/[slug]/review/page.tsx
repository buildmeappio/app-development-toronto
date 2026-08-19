import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell, Panel, Field, inputCls, textareaCls, btn } from "@/components/ui";
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
      <PageShell width="narrow">
        <Panel className="p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-500">
            ★
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Thanks for your review
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-slate-600">
            We&apos;ve received your review of {company.name}. It will appear on
            their profile once we&apos;ve checked it.
          </p>
          <Link href={`/company/${slug}`} className={btn("primary", "mt-6")}>
            Back to profile
          </Link>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow">
      <Link href={`/company/${slug}`} className="text-sm text-slate-500 hover:text-blue-600">
        ← Back to {company.name}
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        Review {company.name}
      </h1>
      <p className="mt-2 text-slate-500">
        Share your experience. Reviews are checked before they&apos;re published.
      </p>

      <Panel className="mt-8 p-8">
        <form action={submitReviewAction} className="space-y-5">
          <input type="hidden" name="companyId" value={company.id} />
          <div aria-hidden className="absolute left-[-9999px]" style={{ position: "absolute" }}>
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">
              Overall rating <span className="text-blue-600">*</span>
            </legend>
            <div className="flex gap-2">
              {[5, 4, 3, 2, 1].map((n) => (
                <label
                  key={n}
                  className="flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold transition hover:border-amber-300 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-50 has-[:checked]:text-amber-700"
                >
                  <input type="radio" name="rating" value={n} required className="sr-only" />
                  {n}★
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Your name" required>
              <input name="reviewerName" required className={inputCls} />
            </Field>
            <Field label="Your role">
              <input name="reviewerRole" placeholder="e.g. CTO" className={inputCls} />
            </Field>
            <Field label="Your company">
              <input name="reviewerCompany" className={inputCls} />
            </Field>
            <Field label="Project type">
              <input name="projectType" placeholder="e.g. Mobile App Development" className={inputCls} />
            </Field>
          </div>

          <Field label="Headline">
            <input name="title" placeholder="Sum up your experience" className={inputCls} />
          </Field>
          <Field label="Your review" required>
            <textarea
              name="body"
              rows={5}
              required
              placeholder="What was the project? How did they do? Would you recommend them?"
              className={textareaCls}
            />
          </Field>

          <button type="submit" className={btn("primary", "w-full")}>
            Submit review
          </button>
          <p className="text-center text-xs text-slate-400">
            We may reach out to verify your review before publishing.
          </p>
        </form>
      </Panel>
    </PageShell>
  );
}
