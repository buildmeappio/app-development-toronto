import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies, companyDailyClicks } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|pinterest|whatsapp|telegram|slackbot|discord|headless|lighthouse|preview|monitor|ahrefs|semrush/i;

/** Append our UTM params so the company attributes the visit to us. */
function withUtm(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const p = url.searchParams;
  if (!p.has("utm_source")) p.set("utm_source", "appdevelopmenttoronto.com");
  if (!p.has("utm_medium")) p.set("utm_medium", "referral");
  if (!p.has("utm_campaign")) p.set("utm_campaign", "directory");
  return url.toString();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const [company] = await db
    .select({ id: companies.id, website: companies.website })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  const target = company?.website ? withUtm(company.website) : null;
  if (!company || !target) {
    // No website on file → send them to the profile instead of a dead end.
    return NextResponse.redirect(new URL(`/company/${slug}`, request.url));
  }

  // Count real clicks only (crawlers hit outbound links too).
  const ua = request.headers.get("user-agent") ?? "";
  if (!BOT_RE.test(ua)) {
    const day = new Date().toISOString().slice(0, 10);
    await db
      .insert(companyDailyClicks)
      .values({ companyId: company.id, day, count: 1 })
      .onConflictDoUpdate({
        target: [companyDailyClicks.companyId, companyDailyClicks.day],
        set: { count: sql`${companyDailyClicks.count} + 1` },
      })
      .catch(() => {});
  }

  return NextResponse.redirect(target, { status: 302 });
}
