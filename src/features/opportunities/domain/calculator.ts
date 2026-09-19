import type { Opportunity } from "@/features/scoring/types/scoring.types";

export interface GrantCalculation {
  projectValueHuf: number;
  intensity: number;
  grantHuf: number;
  ownContributionHuf: number;
  cappedByCeiling: boolean;
  ceilingHuf: number | null;
}

/**
 * What this company would receive: project value × the call's intensity,
 * capped by a ceiling. On a consortium call the ceiling that binds the
 * company is its own estimated share of the grant, not the whole-project
 * grant.
 *
 * Mirrors `fundingCalculator` in `server/server.js` — that function lives in
 * the server entry file (which starts a server on import), so unlike the
 * engine it can't be imported. Small, pure, and pinned by tests; if the
 * server's arithmetic changes, change this too.
 */
export function calculateGrant(
  opp: Pick<Opportunity, "intensity" | "fundingMax" | "partnerShare">,
  projectValueHuf: number,
): GrantCalculation {
  const intensity = opp.intensity ?? 0;
  const ceilingHuf = opp.partnerShare ? opp.partnerShare.maxHuf : (opp.fundingMax ?? null);
  const uncapped = projectValueHuf * intensity;
  const grant = ceilingHuf != null ? Math.min(uncapped, ceilingHuf) : uncapped;

  return {
    projectValueHuf,
    intensity,
    grantHuf: Math.round(grant),
    ownContributionHuf: Math.max(0, Math.round(projectValueHuf - grant)),
    cappedByCeiling: ceilingHuf != null && uncapped > ceilingHuf,
    ceilingHuf,
  };
}
