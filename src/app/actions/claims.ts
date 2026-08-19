"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  companies,
  claims,
  caseStudies,
  teamMembers,
  FREE_CASE_STUDY_LIMIT,
  FREE_TEAM_LIMIT,
} from "@/db/schema";
import { getCurrentUser, ensureProfile, hasApprovedClaim } from "@/lib/auth";
import { isCompanyVerified } from "@/lib/queries/placements";

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

  const focusAreas = formData.getAll("focusAreas").map(String).filter(Boolean);
  const techStack = String(formData.get("techStack") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 40);

  await db
    .update(companies)
    .set({
      description: str("description"),
      teamSize: str("teamSize"),
      hourlyRate: str("hourlyRate"),
      minProjectSize: str("minProjectSize"),
      logoUrl: str("logoUrl"),
      foundedYear,
      focusAreas,
      techStack,
      linkedinUrl: str("linkedinUrl"),
      twitterUrl: str("twitterUrl"),
      facebookUrl: str("facebookUrl"),
      instagramUrl: str("instagramUrl"),
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId));

  revalidatePath(`/company/${company.slug}`);
  redirect(`/company/${company.slug}/edit?saved=1`);
}

/** Add a case study. Free profiles are capped; Verified unlocks unlimited. */
export async function addCaseStudyAction(formData: FormData) {
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

  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("A title is required.");

  // Enforce the free cap unless the company is Verified.
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(caseStudies)
    .where(eq(caseStudies.companyId, companyId));
  if (count >= FREE_CASE_STUDY_LIMIT && !(await isCompanyVerified(companyId))) {
    redirect(`/company/${company.slug}/edit?limit=1`);
  }

  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v.length ? v : null;
  };
  await db.insert(caseStudies).values({
    companyId,
    title,
    description: str("description"),
    url: str("url"),
    imageUrl: str("imageUrl"),
  });

  revalidatePath(`/company/${company.slug}`);
  redirect(`/company/${company.slug}/edit?saved=1#portfolio`);
}

/** Delete a case study the signed-in user owns. */
export async function deleteCaseStudyAction(formData: FormData) {
  const user = await getCurrentUser();
  const caseStudyId = String(formData.get("caseStudyId"));
  if (!user) redirect("/login?next=/dashboard");

  const [cs] = await db
    .select({ companyId: caseStudies.companyId })
    .from(caseStudies)
    .where(eq(caseStudies.id, caseStudyId))
    .limit(1);
  if (!cs) return;
  if (!(await hasApprovedClaim(user.id, cs.companyId))) {
    throw new Error("Not authorized.");
  }

  const [company] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, cs.companyId))
    .limit(1);

  await db.delete(caseStudies).where(eq(caseStudies.id, caseStudyId));

  if (company) {
    revalidatePath(`/company/${company.slug}`);
    redirect(`/company/${company.slug}/edit?saved=1#portfolio`);
  }
  redirect("/dashboard");
}

/** Add a team member (capped at FREE_TEAM_LIMIT). */
export async function addTeamMemberAction(formData: FormData) {
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

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("A name is required.");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(teamMembers)
    .where(eq(teamMembers.companyId, companyId));
  if (count >= FREE_TEAM_LIMIT) {
    redirect(`/company/${company.slug}/edit?teamlimit=1#team`);
  }

  const str = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    return v.length ? v : null;
  };
  await db.insert(teamMembers).values({
    companyId,
    name,
    role: str("role"),
    photoUrl: str("photoUrl"),
  });
  revalidatePath(`/company/${company.slug}`);
  redirect(`/company/${company.slug}/edit?saved=1#team`);
}

/** Remove a team member the signed-in user owns. */
export async function deleteTeamMemberAction(formData: FormData) {
  const user = await getCurrentUser();
  const memberId = String(formData.get("memberId"));
  if (!user) redirect("/login?next=/dashboard");

  const [m] = await db
    .select({ companyId: teamMembers.companyId })
    .from(teamMembers)
    .where(eq(teamMembers.id, memberId))
    .limit(1);
  if (!m) return;
  if (!(await hasApprovedClaim(user.id, m.companyId))) {
    throw new Error("Not authorized.");
  }
  const [company] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, m.companyId))
    .limit(1);
  await db.delete(teamMembers).where(eq(teamMembers.id, memberId));
  if (company) {
    revalidatePath(`/company/${company.slug}`);
    redirect(`/company/${company.slug}/edit?saved=1#team`);
  }
  redirect("/dashboard");
}
