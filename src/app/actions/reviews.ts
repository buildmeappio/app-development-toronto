"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { reviews, companies, reviewInvitations } from "@/db/schema";
import { sendEmail } from "@/lib/email";

const MAX_PER_IP_PER_HOUR = 3;

async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

/** Public review submission — held as "pending" for moderation. */
export async function submitReviewAction(formData: FormData) {
  const companyId = String(formData.get("companyId"));
  const [company] = await db
    .select({ slug: companies.slug, name: companies.name })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) throw new Error("Company not found");

  const done = `/company/${company.slug}/review?submitted=1`;

  // Honeypot — silently accept & drop.
  if (String(formData.get("website") ?? "").trim()) {
    redirect(done);
  }

  const val = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v.length ? v : null;
  };
  const reviewerName = val("reviewerName");
  const body = val("body");
  const rating = Math.min(5, Math.max(1, Number.parseInt(String(formData.get("rating") ?? "0"), 10) || 0));
  if (!reviewerName || !body || rating < 1) {
    throw new Error("Name, rating, and review text are required.");
  }

  const ipHash = await clientIpHash();
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(reviews)
    .where(
      and(
        eq(reviews.ipHash, ipHash),
        gt(reviews.createdAt, sql`now() - interval '1 hour'`),
      ),
    );
  if (c >= MAX_PER_IP_PER_HOUR) {
    redirect(done);
  }

  const [inserted] = await db
    .insert(reviews)
    .values({
      companyId,
      reviewerName,
      reviewerRole: val("reviewerRole"),
      reviewerCompany: val("reviewerCompany"),
      rating,
      title: val("title"),
      body,
      projectType: val("projectType"),
      ipHash,
    })
    .returning({ id: reviews.id });

  // If this came from an invitation, mark it completed and link the review.
  const inviteToken = val("invite");
  if (inviteToken) {
    await db
      .update(reviewInvitations)
      .set({ status: "completed", reviewId: inserted.id })
      .where(
        and(
          eq(reviewInvitations.token, inviteToken),
          eq(reviewInvitations.companyId, companyId),
        ),
      );
  }

  const notifyTo = process.env.LEAD_NOTIFY_EMAIL;
  if (notifyTo) {
    await sendEmail({
      to: notifyTo,
      subject: `New review to moderate: ${company.name} (${rating}★)`,
      html: `<h2>New review pending</h2>
        <p><strong>${company.name}</strong> — ${rating}★ from ${reviewerName}${val("reviewerCompany") ? ` (${val("reviewerCompany")})` : ""}</p>
        <p>${body}</p>
        <p style="color:#666;font-size:13px">Publish with: npm run admin:publish-review -- &lt;id&gt;</p>`,
    });
  }

  redirect(done);
}
