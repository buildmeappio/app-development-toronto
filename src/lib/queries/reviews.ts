import { db } from "@/db";
import { reviews, reviewInvitations } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";

/** All review invitations a company has sent, newest first. */
export async function getInvitationsForCompany(companyId: string) {
  return db
    .select()
    .from(reviewInvitations)
    .where(eq(reviewInvitations.companyId, companyId))
    .orderBy(desc(reviewInvitations.createdAt));
}

/** Look up an invitation by its token. */
export async function getInvitationByToken(token: string) {
  const [row] = await db
    .select()
    .from(reviewInvitations)
    .where(eq(reviewInvitations.token, token))
    .limit(1);
  return row ?? null;
}

/** Pending + published review counts for a company (for the owner console). */
export async function getReviewCountsByStatus(companyId: string) {
  const rows = await db
    .select({ status: reviews.status, c: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.companyId, companyId))
    .groupBy(reviews.status);
  const map = new Map(rows.map((r) => [r.status, r.c]));
  return {
    pending: map.get("pending") ?? 0,
    published: map.get("published") ?? 0,
  };
}

/** Published reviews for a company, newest first. */
export async function getPublishedReviews(companyId: string) {
  return db
    .select()
    .from(reviews)
    .where(and(eq(reviews.companyId, companyId), eq(reviews.status, "published")))
    .orderBy(desc(reviews.createdAt));
}

/** First-party review aggregate for one company (published only). */
export async function getReviewAggregate(companyId: string) {
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      avg: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
    })
    .from(reviews)
    .where(and(eq(reviews.companyId, companyId), eq(reviews.status, "published")));
  return { count: row?.count ?? 0, avg: row?.avg ?? 0 };
}

/** Aggregates for every company with published reviews — for the ranker. */
export async function getAllReviewAggregates(): Promise<
  Map<string, { count: number; avg: number }>
> {
  const rows = await db
    .select({
      companyId: reviews.companyId,
      count: sql<number>`count(*)::int`,
      avg: sql<number>`avg(${reviews.rating})::float`,
    })
    .from(reviews)
    .where(eq(reviews.status, "published"))
    .groupBy(reviews.companyId);
  return new Map(rows.map((r) => [r.companyId, { count: r.count, avg: r.avg }]));
}
