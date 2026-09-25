import type { ScoredOpportunity } from "@/features/scoring/types/scoring.types";

/**
 * Orders the server's scored catalog for display: qualifying calls by score
 * (an unscored, blocked call never outranks a scored one), then by deadline;
 * blocked calls last; anything already past its deadline dropped. The server
 * returns the catalog in call-code order and leaves the ordering to the screen.
 */
export function rankScored(rows: ScoredOpportunity[]): ScoredOpportunity[] {
  return rows
    .filter((r) => r.daysLeft === null || r.daysLeft >= 0)
    .sort(
      (a, b) =>
        Number(a.blocked) - Number(b.blocked) ||
        (b.score ?? -1) - (a.score ?? -1) ||
        a.deadline.localeCompare(b.deadline),
    );
}

/**
 * Prizes and quality labels award no money, so they don't belong in a funding
 * shortlist (the server leaves them out of its own totals and search).
 */
export function splitShortlist(ranked: ScoredOpportunity[]) {
  const fundable = ranked.filter((r) => r.awardsFunding !== false);
  return {
    eligible: fundable.filter((r) => !r.blocked),
    blocked: fundable.filter((r) => r.blocked),
  };
}

export interface DashboardStats {
  total: number;
  strong: number;
  closingSoon: number;
  needsAttention: number;
}

/** The dashboard's default view hides everything below the "relevant" band. */
export const RELEVANT_SCORE = 70;

/** A call this close to its deadline is "closing soon" on cards and in the calendar. */
export const URGENT_DAYS = 14;
