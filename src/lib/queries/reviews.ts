import { db } from "@/db";
import { reviews } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";

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
