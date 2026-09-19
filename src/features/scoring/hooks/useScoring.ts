import { useMemo } from "react";
import { useMetaQuery } from "@/shared/api/meta.queries";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import { DEFAULT_REFERENCE_DATE, hunterScore, normalizeProfile, rankedOpps } from "../domain/engine";
import { useEligibilityAnswers } from "./useEligibilityAnswers";
import type { HunterScoreResult, Opportunity, RankedOpportunity } from "../types/scoring.types";

/**
 * Everything the engine needs besides the opportunity itself, resolved once:
 * the company's profile (normalized the same way the server does before
 * scoring), their answers, and the catalog's reference date — the server can
 * pin "today" (`HUNTER_TODAY`), so deadline maths must use its date, not the
 * browser's clock, or client and server scores would disagree.
 */
export function useScoringInputs() {
  const { profile: rawProfile, isLoading } = useCompanyProfile();
  const { answers } = useEligibilityAnswers();
  const meta = useMetaQuery();

  const profile = useMemo(() => (rawProfile ? normalizeProfile(rawProfile) : null), [rawProfile]);
  const today = meta.data?.today;
  const referenceDate = useMemo(() => (today ? new Date(today) : DEFAULT_REFERENCE_DATE), [today]);

  return { profile, answers, referenceDate, isLoading: isLoading || meta.isLoading };
}

/**
 * Scores one opportunity locally. This is the client-side path — the
 * fallback the product requires when the server can't score for us, and the
 * only path that recalculates instantly when an answer changes. Features that
 * show server-scored results (e.g. paginated search) use those instead.
 */
export function useHunterScore(opp: Opportunity | undefined): HunterScoreResult | null {
  const { profile, answers, referenceDate } = useScoringInputs();
  return useMemo(
    () => (opp && profile ? hunterScore(opp, profile, answers, referenceDate) : null),
    [opp, profile, answers, referenceDate],
  );
}

/** Ranks a whole catalog for the current company: eligible by score, blocked last, expired dropped. */
export function useRankedOpportunities(opps: Opportunity[] | undefined): RankedOpportunity[] {
  const { profile, answers, referenceDate } = useScoringInputs();
  return useMemo(
    () => (opps && profile ? rankedOpps(profile, opps, answers, referenceDate) : []),
    [opps, profile, answers, referenceDate],
  );
}
