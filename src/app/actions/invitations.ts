"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviewInvitations, companies, MAX_REVIEW_INVITES } from "@/db/schema";
import { getCurrentUser, hasApprovedClaim } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://appdevelopmenttoronto.com";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Owner sends review invitations to past clients. */
export async function sendReviewInvitesAction(formData: FormData) {
  const user = await getCurrentUser();
  const companyId = String(formData.get("companyId"));
  if (!user) redirect("/login?next=/dashboard");
  if (!(await hasApprovedClaim(user.id, companyId))) {
    throw new Error("You are not authorized to invite reviews for this company.");
  }

  const [company] = await db
    .select({ slug: companies.slug, name: companies.name })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) throw new Error("Company not found");

  const emails = [
    ...new Set(
      String(formData.get("emails") ?? "")
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => EMAIL_RE.test(e)),
    ),
  ];
  const message = String(formData.get("message") ?? "").trim();

  // Respect the per-company cap.
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(reviewInvitations)
    .where(eq(reviewInvitations.companyId, companyId));
  const toSend = emails.slice(0, Math.max(0, MAX_REVIEW_INVITES - c));

  for (const email of toSend) {
    const token = randomBytes(16).toString("hex");
    await db
      .insert(reviewInvitations)
      .values({ companyId, clientEmail: email, token });

    const link = `${SITE}/company/${company.slug}/review?invite=${token}`;
    await sendEmail({
      to: email,
      replyTo: user.email ?? undefined,
      subject: `${company.name} would love your review`,
      html: `
        <div style="font-family:sans-serif;font-size:15px;color:#0f172a">
          <p>Hi,</p>
          <p><strong>${company.name}</strong> has invited you to share your experience working with them on <strong>Toronto App Dev</strong>.</p>
          ${message ? `<p style="color:#475569;border-left:3px solid #e2e8f0;padding-left:12px">${message}</p>` : ""}
          <p style="margin:22px 0">
            <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:11px 20px;border-radius:10px;text-decoration:none;font-weight:600">Write a review</a>
          </p>
          <p style="color:#94a3b8;font-size:13px">It takes about two minutes. Reviews are checked before they're published.</p>
        </div>`,
    });
  }

  redirect(`/company/${company.slug}/reviews?sent=${toSend.length}`);
}
