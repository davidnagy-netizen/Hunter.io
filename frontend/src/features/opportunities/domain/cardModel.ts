import type { EligibilityStatus } from "@/features/scoring/types/scoring.types";

/**
 * What `OpportunityCardView` needs, independent of where the call came from.
 * Two sources feed it: the full catalog scored in the browser
 * (`OpportunityCard`) and the server's own scored search results
 * (`SearchResultCard`) — the legacy app had a separate renderer for each.
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
  blocked: boolean;
  verdict: EligibilityStatus | null;
  /** Why the engine ruled it out, already worded (and, where known, with the company's own value). */
  exclusionReason?: string | null;
}
