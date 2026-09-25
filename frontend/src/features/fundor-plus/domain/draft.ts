import type { CompanyProfile } from "@/shared/types/profile.types";
import type { ScoredOpportunity } from "@/shared/types/scoring.types";

/** The real numbers a draft is built from — nothing here is invented; a missing value stays missing. */
export interface DraftFigures {
  company: string;
  employees: number;
  county: string;
  teaor: string | null;
  /** The company's planned project value, in HUF. */
  total: number;
  /** What the server calculates the company would receive: project value × intensity, up to the ceiling. */
  grant: number;
  /** What the company puts in itself: the rest of the project value. */
  own: number;
  intensityPct: number;
  goalIds: string[];
  docs: string[];
}

/**
 * The money comes from the server's own calculation for this company and call
 * (`calculator`), never from arithmetic done here. A workspace call always has
 * one — it is only offered for scored, qualifying calls.
 */
export function draftFigures(profile: CompanyProfile, opp: Pick<ScoredOpportunity, "intensity" | "goals" | "docs" | "calculator">): DraftFigures {
  const intensity = opp.intensity || 0;
  const grant = opp.calculator?.grantHuf ?? 0;
  const own = opp.calculator?.ownContributionHuf ?? 0;
  return {
    company: profile.company,
    employees: profile.employees,
    county: profile.county,
    teaor: profile.teaor || null,
    total: profile.investment_value,
    grant,
    own,
    intensityPct: Math.round(intensity * 100),
    goalIds: opp.goals ?? [],
    docs: opp.docs ?? [],
  };
}

export interface DraftChapter {
  title: string;
  body: string;
}

/** The plain-text form of a draft, for the clipboard: the notice first, then each chapter. */
export function draftToText(notice: string, chapters: DraftChapter[]): string {
  return `${notice}\n\n${chapters.map((c) => `${c.title}\n${c.body}`).join("\n\n")}`;
}
