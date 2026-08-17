import Link from "next/link";
import type { InferSelectModel } from "drizzle-orm";
import type { companies } from "@/db/schema";
import { CompanyLogo } from "./company-logo";
import { StarRating } from "./star-rating";
import { Badge, RankBadge } from "./badge";

type Company = InferSelectModel<typeof companies>;

export function CompanyCard({
  rank,
  company,
  hqLocationName,
  featured = false,
}: {
  rank: number;
  company: Company;
  hqLocationName?: string | null;
  featured?: boolean;
}) {
  const profileHref = `/company/${company.slug}`;
  const claimed = company.claimStatus === "claimed";

  return (
    <div
      className={`group relative flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:p-5 ${
        featured
          ? "border-amber-300 bg-amber-50/40 shadow-sm ring-1 ring-amber-200"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-4">
        <RankBadge rank={rank} />
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} size={52} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={profileHref}
            className="truncate text-base font-semibold text-slate-900 transition group-hover:text-blue-600"
          >
            {company.name}
          </Link>
          {featured && <Badge variant="sponsored">★ Sponsored</Badge>}
          {claimed && <Badge variant="verified">✓ Verified</Badge>}
        </div>

        <div className="mt-1.5">
          {company.googleRating != null ? (
            <StarRating
              rating={company.googleRating}
              count={company.googleRatingCount}
            />
          ) : (
            <span className="text-sm text-slate-400">No reviews yet</span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {hqLocationName && (
            <span className="inline-flex items-center gap-1">
              <span className="text-slate-400">📍</span> {hqLocationName}
            </span>
          )}
          {company.foundedYear && <span>Founded {company.foundedYear}</span>}
          {company.teamSize && <span>{company.teamSize} employees</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Visit website
          </a>
        )}
        {!claimed && (
          <Link
            href={profileHref}
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
          >
            Claim profile
          </Link>
        )}
      </div>
    </div>
  );
}
