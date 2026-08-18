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
  // First-party (our own, verified) reviews — weighted higher than Google's.
  firstPartyRating?: number | null;
  firstPartyCount?: number | null;
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
  reviewQuality: 45, // review rating × volume — the dominant trust signal
  profileCompleteness: 25, // rewards claimed, filled-out profiles
  tenure: 20, // years in business
  claimedBonus: 10, // small nudge; claimed profiles are more trustworthy
} as const;

// First-party reviews count double in volume — they're ours and verified, so
// collecting them is the strongest lever a company has to climb the rankings.
const FIRST_PARTY_WEIGHT = 2;

/**
 * Blended review quality (0..1) combining Google and first-party reviews.
 * First-party reviews are weighted more heavily in both the average and volume.
 */
function reviewQualityScore(
  googleRating: number | null,
  googleCount: number | null,
  fpRating: number | null | undefined,
  fpCount: number | null | undefined,
): number {
  const gR = googleRating ?? 0;
  const gC = googleCount ?? 0;
  const fR = fpRating ?? 0;
  const fC = fpCount ?? 0;
  const weightedCount = gC + fC * FIRST_PARTY_WEIGHT;
  if (weightedCount <= 0) return 0;
  const blendedRating =
    (gR * gC + fR * fC * FIRST_PARTY_WEIGHT) / weightedCount;
  const volumeFactor = Math.min(Math.log10(weightedCount + 1) / 3, 1);
  return (blendedRating / 5) * volumeFactor;
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
      reviewQualityScore(
        input.googleRating,
        input.googleRatingCount,
        input.firstPartyRating,
        input.firstPartyCount,
      ) +
    RANKING_WEIGHTS.profileCompleteness * completenessScore(input) +
    RANKING_WEIGHTS.tenure * tenureScore(input.foundedYear, input.currentYear) +
    RANKING_WEIGHTS.claimedBonus * (input.isClaimed ? 1 : 0);

  // Serves-only relationships are down-weighted so HQ'd firms rank higher.
  return raw * input.locationWeight;
}
