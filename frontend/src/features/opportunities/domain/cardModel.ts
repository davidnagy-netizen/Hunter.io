import type { EligibilityStatus, ScoreBand } from "@/shared/types/scoring.types";

/**
 * What `OpportunityCardView` needs, independent of where the call came from:
 * the scored catalog (`OpportunityCard`) or a scored search hit
 * (`SearchResultCard`). Both are scored by the server.
 */
export interface CardModel {
  id: string;
  program: string;
  title: string;
  deadline: string;
  daysLeft: number;
  intensity: number | null;
  fundingMin?: number | null;
  fundingMax?: number | null;
  isNew?: boolean;
  sourceUrl?: string | null;
  score: number | null;
  band: ScoreBand | null;
  blocked: boolean;
  verdict: EligibilityStatus | null;
  /** Why the call was ruled out, already worded (and, where known, with the company's own value). */
  exclusionReason?: string | null;
}
