import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  PageShell,
  PageHeading,
  Section,
  Panel,
  StatCard,
  Field,
  textareaCls,
  inputCls,
  btn,
} from "@/components/ui";
import { Badge } from "@/components/badge";
import { getCompanyBySlug } from "@/lib/queries/locations";
import {
  getInvitationsForCompany,
  getReviewCountsByStatus,
} from "@/lib/queries/reviews";
import { getCurrentUser, hasApprovedClaim } from "@/lib/auth";
import { MAX_REVIEW_INVITES } from "@/db/schema";
import { sendReviewInvitesAction } from "@/app/actions/invitations";

export const metadata = { title: "Collect reviews", robots: { index: false } };

export default async function CollectReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { slug } = await params;
  const { sent } = await searchParams;

  const row = await getCompanyBySlug(slug).catch(() => null);
  if (!row) notFound();
  const { company } = row;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/company/${slug}/reviews`);
  if (!(await hasApprovedClaim(user.id, company.id))) {
    return (
      <PageShell width="narrow">
        <Panel className="p-10 text-center">
          <h1 className="text-xl font-bold text-slate-900">Not authorized</h1>
          <p className="mt-2 text-slate-500">
            You don&apos;t manage {company.name}.
          </p>
        </Panel>
      </PageShell>
    );
  }

  const [invitations, counts] = await Promise.all([
    getInvitationsForCompany(company.id),
    getReviewCountsByStatus(company.id),
  ]);
  const completed = invitations.filter((i) => i.status === "completed").length;

  return (
    <PageShell>
      <PageHeading
        eyebrow="Reviews"
        title="Collect reviews"
        desc={`Invite past clients of ${company.name} to share their experience.`}
      >
        <Link href={`/company/${slug}#reviews`} className={btn("secondary")}>
          View on profile
        </Link>
      </PageHeading>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Published" value={counts.published} />
        <StatCard label="Pending" value={counts.pending} hint="in review" />
        <StatCard label="Invites sent" value={invitations.length} />
        <StatCard label="Completed" value={completed} />
      </div>

      {sent && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Sent {sent} invitation{Number(sent) === 1 ? "" : "s"}. We&apos;ll let
          you know as reviews come in.
        </div>
      )}

      <div className="space-y-6">
        <Section
          title="Invite past clients"
          desc="Add client emails (comma or line separated). Each gets a private link to review you."
        >
          <form action={sendReviewInvitesAction} className="space-y-4">
            <input type="hidden" name="companyId" value={company.id} />
            <Field label="Client emails">
              <textarea
                name="emails"
                rows={4}
                required
                placeholder={"jane@acme.com\nsam@retailco.ca"}
                className={textareaCls}
              />
            </Field>
            <Field label="Personal message (optional)" hint="Included in the email.">
              <input
                name="message"
                placeholder="It was a pleasure building with you — would you share a quick review?"
                className={inputCls}
              />
            </Field>
            <button type="submit" className={btn("primary")}>
              Send invitations
            </button>
            <p className="text-xs text-slate-400">
              Up to {MAX_REVIEW_INVITES} invitations per company.
            </p>
          </form>
        </Section>

        {invitations.length > 0 && (
          <Section title="Sent invitations">
            <ul className="divide-y divide-slate-100">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="truncate text-slate-700">
                    {inv.clientEmail}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {inv.createdAt.toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {inv.status === "completed" ? (
                      <Badge variant="success">Reviewed</Badge>
                    ) : (
                      <Badge variant="neutral">Invited</Badge>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </PageShell>
  );
}
