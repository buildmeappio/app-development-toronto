/**
 * Ranking score for a company at a given location.
 *
 * Phase 1 (no first-party reviews yet) leans on Google Places signals plus
 * profile-completeness and firmographics. Paid placements (featured/badge) do
 * NOT feed this score — they render as labeled sponsored slots so rankings stay
 * trustworthy. Weights are intentionally explicit and documented.
 */

export type RankingInput = {
  googleRating: number | null; // 0..5
  googleRatingCount: number | null;
  foundedYear: number | null;
  teamSize: string | null;
  hasDescription: boolean;
  hasLogo: boolean;
  hasWebsite: boolean;
  isClaimed: boolean;
  // 1.0 for headquartered-in this location, <1 for serves-only.
  locationWeight: number;
  currentYear: number;
};

export const RANKING_WEIGHTS = {
  reviewQuality: 45, // Google rating × volume — the dominant trust signal
  profileCompleteness: 25, // rewards claimed, filled-out profiles
  tenure: 20, // years in business
  claimedBonus: 10, // small nudge; claimed profiles are more trustworthy
} as const;

/** Rating (0..5) scaled by log-volume, normalized to 0..1. */
function reviewQualityScore(rating: number | null, count: number | null): number {
  if (!rating || !count || count <= 0) return 0;
  // log10 volume caps around 1000 reviews (log10(1000)=3 → /3 = 1.0).
  const volumeFactor = Math.min(Math.log10(count + 1) / 3, 1);
  return (rating / 5) * volumeFactor;
}

/** Fraction of key profile fields present, 0..1. */
function completenessScore(input: RankingInput): number {
  const checks = [
    input.hasDescription,
    input.hasLogo,
    input.hasWebsite,
    input.foundedYear != null,
    input.teamSize != null,
  ];
  return checks.filter(Boolean).length / checks.length;
}

/** Years in business, normalized (20+ years → 1.0). */
function tenureScore(foundedYear: number | null, currentYear: number): number {
  if (!foundedYear || foundedYear > currentYear) return 0;
  return Math.min((currentYear - foundedYear) / 20, 1);
}

/** Total weighted score, 0..100 (before location weighting). */
export function computeScore(input: RankingInput): number {
  const raw =
    RANKING_WEIGHTS.reviewQuality *
      reviewQualityScore(input.googleRating, input.googleRatingCount) +
    RANKING_WEIGHTS.profileCompleteness * completenessScore(input) +
    RANKING_WEIGHTS.tenure * tenureScore(input.foundedYear, input.currentYear) +
    RANKING_WEIGHTS.claimedBonus * (input.isClaimed ? 1 : 0);

  // Serves-only relationships are down-weighted so HQ'd firms rank higher.
  return raw * input.locationWeight;
}
