"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  inquiries,
  claims,
  companies,
  profiles,
  reviews,
  placements,
  reviewImports,
  locations,
} from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { runImport } from "@/lib/imports";

const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/* ---- Leads ------------------------------------------------------------- */

export async function updateInquiryStatusAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  const status = s(fd, "status") as "new" | "contacted" | "won" | "closed";
  await db.update(inquiries).set({ status }).where(eq(inquiries.id, id));
  revalidatePath("/admin/leads");
}

/* ---- Claims ------------------------------------------------------------ */

export async function decideClaimAction(fd: FormData) {
  await requireAdmin();
  const claimId = s(fd, "claimId");
  const approve = s(fd, "decision") === "approve";

  const [claim] = await db
    .select({
      companyId: claims.companyId,
      email: profiles.email,
      slug: companies.slug,
      name: companies.name,
    })
    .from(claims)
    .innerJoin(companies, eq(claims.companyId, companies.id))
    .leftJoin(profiles, eq(claims.userId, profiles.id))
    .where(eq(claims.id, claimId))
    .limit(1);
  if (!claim) return;

  if (approve) {
    await db.update(claims).set({ status: "approved" }).where(eq(claims.id, claimId));
    await db.update(companies).set({ claimStatus: "claimed" }).where(eq(companies.id, claim.companyId));
    if (claim.email) {
      await sendEmail({
        to: claim.email,
        subject: `Your claim for ${claim.name} is approved`,
        html: `<div style="font-family:sans-serif;font-size:15px"><p>Your claim for <strong>${claim.name}</strong> is approved. <a href="https://appdevelopmenttoronto.com/company/${claim.slug}/edit">Manage your profile →</a></p></div>`,
      });
    }
  } else {
    await db.update(claims).set({ status: "rejected" }).where(eq(claims.id, claimId));
    const [other] = await db
      .select({ id: claims.id })
      .from(claims)
      .where(and(eq(claims.companyId, claim.companyId), eq(claims.status, "approved")))
      .limit(1);
    if (!other) {
      await db.update(companies).set({ claimStatus: "unclaimed" }).where(eq(companies.id, claim.companyId));
    }
  }
  revalidatePath("/admin/claims");
  revalidatePath(`/company/${claim.slug}`);
}

/* ---- Reviews ----------------------------------------------------------- */

export async function decideReviewAction(fd: FormData) {
  await requireAdmin();
  const reviewId = s(fd, "reviewId");
  const publish = s(fd, "decision") === "publish";
  const [r] = await db
    .select({ slug: companies.slug })
    .from(reviews)
    .innerJoin(companies, eq(reviews.companyId, companies.id))
    .where(eq(reviews.id, reviewId))
    .limit(1);
  await db
    .update(reviews)
    .set({ status: publish ? "published" : "rejected", verified: publish })
    .where(eq(reviews.id, reviewId));
  revalidatePath("/admin/reviews");
  if (r) revalidatePath(`/company/${r.slug}`);
}

/* ---- Placements -------------------------------------------------------- */

export async function activatePlacementAction(fd: FormData) {
  await requireAdmin();
  const type = s(fd, "type") as "featured" | "badge";
  const days = Number.parseInt(s(fd, "days"), 10) || 30;
  const citySlug = s(fd, "citySlug");

  const [company] = await db
    .select({ id: companies.id, slug: companies.slug })
    .from(companies)
    .where(eq(companies.slug, s(fd, "companySlug")))
    .limit(1);
  if (!company) throw new Error("Company not found — check the slug.");
  const companyId = company.id;

  let locationId: string | null = null;
  let locationFullSlug: string | null = null;
  if (type === "featured" && citySlug) {
    const [loc] = await db.select().from(locations).where(eq(locations.slug, citySlug)).limit(1);
    if (!loc) throw new Error(`City not found: ${citySlug}`);
    locationId = loc.id;
    locationFullSlug = loc.fullSlug;
  }
  await db.insert(placements).values({
    companyId,
    locationId,
    type,
    status: "active",
    endsAt: new Date(Date.now() + days * 86_400_000),
  });
  revalidatePath("/admin/placements");
  revalidatePath(`/company/${company.slug}`);
  if (locationFullSlug) revalidatePath(`/app-development-companies/${locationFullSlug}`);
}

export async function cancelPlacementAction(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "placementId");
  await db.update(placements).set({ status: "cancelled" }).where(eq(placements.id, id));
  revalidatePath("/admin/placements");
}

/* ---- Imports ----------------------------------------------------------- */

export async function setupImportAction(fd: FormData) {
  await requireAdmin();
  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, s(fd, "companySlug")))
    .limit(1);
  if (!company) throw new Error("Company not found — check the slug.");
  const source = s(fd, "source") as "google" | "clutch" | "goodfirms" | "designrush";
  const url = s(fd, "sourceUrl");
  await db
    .insert(reviewImports)
    .values({ companyId: company.id, source, sourceUrl: url, status: "active" })
    .onConflictDoUpdate({
      target: reviewImports.companyId,
      set: { source, sourceUrl: url, status: "active" },
    });
  revalidatePath("/admin/imports");
}

export async function runImportAction(fd: FormData) {
  await requireAdmin();
  const companyId = s(fd, "companyId");
  await runImport(companyId);
  const [company] = await db.select({ slug: companies.slug }).from(companies).where(eq(companies.id, companyId)).limit(1);
  revalidatePath("/admin/imports");
  if (company) revalidatePath(`/company/${company.slug}`);
}
