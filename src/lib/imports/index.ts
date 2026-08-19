import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { reviews, reviewImports, companies } from "../../db/schema";
import { getPlaceReviews } from "../places";

export type ImportedReview = {
  externalId: string; // stable id for dedupe
  reviewerName: string;
  rating: number; // 1..5
  title?: string | null;
  body: string;
  reviewedAt?: Date | null;
};

const clamp5 = (n: number) => Math.min(5, Math.max(1, Math.round(n)));
const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 24);

/* ---- Adapters ---------------------------------------------------------- */

/** Google — official Places API (uses the company's known place id). */
async function fromGoogle(company: {
  googlePlaceId: string | null;
}): Promise<ImportedReview[]> {
  if (!company.googlePlaceId) return [];
  const raw = await getPlaceReviews(company.googlePlaceId);
  const out: ImportedReview[] = [];
  for (const r of raw) {
    const body = r.text?.text ?? r.originalText?.text ?? "";
    if (!body || !r.rating) continue;
    out.push({
      externalId: r.name ? hash(r.name) : hash(body),
      reviewerName: r.authorAttribution?.displayName ?? "Google user",
      rating: clamp5(r.rating),
      body,
      reviewedAt: r.publishTime ? new Date(r.publishTime) : null,
    });
  }
  return out;
}

/**
 * Generic — read Review structured data (schema.org JSON-LD) from the page.
 * Robust across sites that publish review markup; degrades to [] when a site
 * blocks server fetches (e.g. Cloudflare) or exposes no markup.
 */
async function fromStructuredData(url: string): Promise<ImportedReview[]> {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; TorontoAppDev/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }

  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const out: ImportedReview[] = [];

  const collect = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    const type = n["@type"];
    const isReview = type === "Review" || (Array.isArray(type) && type.includes("Review"));
    if (isReview) {
      const body = String(n.reviewBody ?? n.description ?? "").trim();
      const ratingNode = n.reviewRating as Record<string, unknown> | undefined;
      const rating = Number(ratingNode?.ratingValue ?? 0);
      const author = n.author as Record<string, unknown> | string | undefined;
      const authorName =
        typeof author === "string" ? author : String(author?.name ?? "Reviewer");
      if (body && rating >= 1) {
        out.push({
          externalId: hash(authorName + body),
          reviewerName: authorName,
          rating: clamp5(rating),
          title: n.name ? String(n.name) : null,
          body,
          reviewedAt: n.datePublished ? new Date(String(n.datePublished)) : null,
        });
      }
    }
    // Recurse into nested arrays/objects (reviews often live under a parent).
    for (const v of Object.values(n)) {
      if (Array.isArray(v)) v.forEach(collect);
      else if (v && typeof v === "object") collect(v);
    }
  };

  for (const b of blocks) {
    try {
      collect(JSON.parse(b[1].trim()));
    } catch {
      /* ignore malformed json-ld */
    }
  }
  // De-dupe within the page.
  const seen = new Set<string>();
  return out.filter((r) => (seen.has(r.externalId) ? false : seen.add(r.externalId)));
}

/* ---- Runner ------------------------------------------------------------ */

/** Run the configured import for one company: fetch, dedupe, upsert. */
export async function runImport(companyId: string) {
  const [cfg] = await db
    .select()
    .from(reviewImports)
    .where(eq(reviewImports.companyId, companyId))
    .limit(1);
  if (!cfg || cfg.status !== "active") {
    return { ok: false, reason: "no active import config" };
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);
  if (!company) return { ok: false, reason: "company not found" };

  let fetched: ImportedReview[] = [];
  let error: string | null = null;
  try {
    fetched =
      cfg.source === "google"
        ? await fromGoogle(company)
        : await fromStructuredData(cfg.sourceUrl);
  } catch (e) {
    error = (e as Error).message;
  }

  let upserted = 0;
  for (const r of fetched) {
    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.companyId, companyId),
          eq(reviews.source, cfg.source),
          eq(reviews.externalId, r.externalId),
        ),
      )
      .limit(1);
    const values = {
      companyId,
      reviewerName: r.reviewerName,
      rating: r.rating,
      title: r.title ?? null,
      body: r.body,
      status: "published" as const,
      verified: true,
      source: cfg.source,
      sourceUrl: cfg.sourceUrl,
      externalId: r.externalId,
      reviewedAt: r.reviewedAt ?? null,
    };
    if (existing) {
      await db.update(reviews).set(values).where(eq(reviews.id, existing.id));
    } else {
      await db.insert(reviews).values(values);
    }
    upserted++;
  }

  await db
    .update(reviewImports)
    .set({ lastRunAt: new Date(), lastCount: upserted, lastError: error })
    .where(eq(reviewImports.id, cfg.id));

  return { ok: !error, source: cfg.source, imported: upserted, error };
}

/** Run every active import (monthly cron). */
export async function runAllImports() {
  const cfgs = await db
    .select({ companyId: reviewImports.companyId })
    .from(reviewImports)
    .where(eq(reviewImports.status, "active"));
  let total = 0;
  for (const c of cfgs) {
    const r = await runImport(c.companyId);
    if (r.ok && r.imported) total += r.imported;
  }
  return { configs: cfgs.length, imported: total };
}
