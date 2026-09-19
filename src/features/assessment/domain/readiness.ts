export interface ReadinessInput {
  employees: number;
  closed_business_years: number;
  goals: string[];
  investment_value: number;
  region?: string;
}

export type ReadinessBand = "strong" | "good" | "early";

/**
 * The "Hunter Readiness Score" (0–100) the free assessment ends on — the
 * headline output the original spec calls for (HUNTER-PROJECT-OVERVIEW §3.2).
 *
 * **Ported unchanged, and deliberately kept apart from the real Hunter Score.**
 * It is a shallow additive heuristic over five answers: it never looks at the
 * catalog or at eligibility, so a visitor can score high here while qualifying
 * for few calls. Whether to keep, unify or replace it is an open product
 * decision (see frontend/README.md); this file is the only place to change.
 * The server stores whatever number the browser sends as the lead's
 * "assessment result" and does not recompute it.
 */
export function readinessScore(profile: ReadinessInput): number {
  let score = 40;
  if (profile.employees >= 5) score += 12;
  if (profile.employees >= 16) score += 6;
  if (profile.closed_business_years >= 1) score += 10;
  if (profile.closed_business_years >= 2) score += 8;
  if (profile.goals.length > 0) score += 10;
  if (profile.investment_value >= 10e6) score += 8;
  if (profile.region !== "HU11") score += 6;
  return Math.min(97, score);
}

export function readinessBand(score: number): ReadinessBand {
  if (score >= 80) return "strong";
  if (score >= 60) return "good";
  return "early";
}
