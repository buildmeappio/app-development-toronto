import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getLocationByFullSlug,
  getCompanyRankInLocation,
  getCompanyBestRank,
} from "@/lib/queries/locations";

export const dynamic = "force-dynamic";

const rankColor = (r: number) =>
  r === 1 ? "#F5B301" : r === 2 ? "#AEB6C2" : r === 3 ? "#CD7F32" : "#2563EB";

function badgeSvg({ rank, city, year }: { rank: number; city: string; year: string }) {
  const c = rankColor(rank);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="216" viewBox="0 0 180 216" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <rect x="1" y="1" width="178" height="214" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <text x="90" y="34" text-anchor="middle" fill="#2563EB" font-size="11" font-weight="700" letter-spacing="1.4">TOP APP DEVELOPER</text>
  <circle cx="90" cy="96" r="42" fill="${c}"/>
  <circle cx="90" cy="96" r="42" fill="none" stroke="#ffffff" stroke-width="3" stroke-opacity="0.5"/>
  <text x="90" y="108" text-anchor="middle" fill="#ffffff" font-size="34" font-weight="800">#${rank}</text>
  <text x="90" y="166" text-anchor="middle" fill="#0b1b3a" font-size="17" font-weight="800">${city}</text>
  <text x="90" y="187" text-anchor="middle" fill="#64748b" font-size="14" font-weight="600">${year}</text>
  <text x="90" y="205" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="600">toronto app dev</text>
</svg>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const year =
    url.searchParams.get("year") ?? new Date().getFullYear().toString();
  const locFullSlug = url.searchParams.get("location");

  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  if (!company) return new Response("Not found", { status: 404 });

  let rank: number | null = null;
  let city = "the GTA";
  if (locFullSlug) {
    const loc = await getLocationByFullSlug(locFullSlug);
    if (loc) {
      rank = await getCompanyRankInLocation(company.id, loc.id);
      city = loc.name;
    }
  }
  if (!rank) {
    const best = await getCompanyBestRank(company.id);
    if (best) {
      rank = best.rank;
      city = best.locationName;
    }
  }
  if (!rank) return new Response("No ranking", { status: 404 });

  return new Response(badgeSvg({ rank, city, year }), {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
