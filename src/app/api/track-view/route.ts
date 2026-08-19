import { sql } from "drizzle-orm";
import { db } from "@/db";
import { companyDailyViews } from "@/db/schema";

export const runtime = "nodejs";

const UUID = /^[0-9a-f-]{36}$/i;

/** Increment today's view count for a company (upsert). */
export async function POST(request: Request) {
  try {
    const { companyId } = (await request.json()) as { companyId?: string };
    if (typeof companyId !== "string" || !UUID.test(companyId)) {
      return new Response(null, { status: 204 });
    }
    const day = new Date().toISOString().slice(0, 10);
    await db
      .insert(companyDailyViews)
      .values({ companyId, day, count: 1 })
      .onConflictDoUpdate({
        target: [companyDailyViews.companyId, companyDailyViews.day],
        set: { count: sql`${companyDailyViews.count} + 1` },
      });
  } catch {
    /* swallow — analytics must never error a page */
  }
  return new Response(null, { status: 204 });
}
