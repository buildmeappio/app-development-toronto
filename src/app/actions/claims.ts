"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { companies, claims } from "@/db/schema";
import { getCurrentUser, ensureProfile, hasApprovedClaim } from "@/lib/auth";

function emailDomain(email?: string | null): string | null {
  return email?.split("@")[1]?.toLowerCase() ?? null;
}

/**
 * Submit a claim for a company. Auto-approves when the signed-in user's email
 * domain matches the company's website domain; otherwise the claim is left
 * pending for manual review.
 */
export async function submitClaimAction(formData: FormData) {
  const user = await getCurrentUser();
  const companyId = String(formData.get("companyId"));

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) throw new Error("Company not found");

  if (!user) redirect(`/login?next=/company/${company.slug}/claim`);

  await ensureProfile(user);

  const domainMatched =
    !!company.domain && emailDomain(user.email) === company.domain;
  const status = domainMatched ? "approved" : "pending";

  const [existing] = await db
    .select({ id: claims.id })
    .from(claims)
    .where(and(eq(claims.companyId, companyId), eq(claims.userId, user.id)))
    .limit(1);

  if (existing) {
    await db
      .update(claims)
      .set({ status, domainMatched })
      .where(eq(claims.id, existing.id));
  } else {
    await db.insert(claims).values({
      companyId,
      userId: user.id,
      status,
      domainMatched,
    });
  }

  await db
    .update(companies)
    .set({ claimStatus: domainMatched ? "claimed" : "pending" })
    .where(eq(companies.id, companyId));

  revalidatePath(`/company/${company.slug}`);
  redirect(
    domainMatched
      ? `/company/${company.slug}/edit?claimed=1`
      : `/dashboard?pending=1`,
  );
}

/** Update a claimed company's profile fields. */
export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  const companyId = String(formData.get("companyId"));
  if (!user) redirect("/login?next=/dashboard");

  if (!(await hasApprovedClaim(user.id, companyId))) {
    throw new Error("You are not authorized to edit this company.");
  }

  const [company] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) throw new Error("Company not found");

  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v.length ? v : null;
  };
  const yearRaw = str("foundedYear");
  const parsedYear = yearRaw ? Number.parseInt(yearRaw, 10) : null;
  const foundedYear =
    parsedYear && Number.isFinite(parsedYear) ? parsedYear : null;

  await db
    .update(companies)
    .set({
      description: str("description"),
      teamSize: str("teamSize"),
      hourlyRate: str("hourlyRate"),
      minProjectSize: str("minProjectSize"),
      logoUrl: str("logoUrl"),
      foundedYear,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId));

  revalidatePath(`/company/${company.slug}`);
  redirect(`/company/${company.slug}/edit?saved=1`);
}
