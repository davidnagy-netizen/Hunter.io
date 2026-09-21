import type { RankedOpportunity } from "@/features/scoring/types/scoring.types";

/**
 * Prizes and quality labels award no money, so they don't belong in a funding
 * shortlist. The server already leaves them out of its own shortlist and
 * search; the engine's `rankedOpps` does not, so the client has to
 * (root README §8).
 */
export function splitShortlist(ranked: RankedOpportunity[]) {
  const fundable = ranked.filter((r) => r.opp.awardsFunding !== false);
  return {
    eligible: fundable.filter((r) => !r.res.blocked),
    blocked: fundable.filter((r) => r.res.blocked),
  };
}

export interface DashboardStats {
  total: number;
  strong: number;
  closingSoon: number;
  needsAttention: number;
}

/** Same tiles and thresholds as the legacy dashboard: strong is 85+, "closing" is 14 days. */
export function dashboardStats(eligible: RankedOpportunity[]): DashboardStats {
  return {
    total: eligible.length,
    strong: eligible.filter((r) => (r.res.score ?? 0) >= 85).length,
    closingSoon: eligible.filter((r) => r.res.elig.days <= 14).length,
    needsAttention: eligible.filter(
      (r) => r.res.elig.status === "CONDITIONAL" || r.res.elig.status === "INSUFFICIENT_DATA",
    ).length,
  };
}

/** The dashboard's default view hides everything below the "relevant" band. */
export const RELEVANT_SCORE = 70;
