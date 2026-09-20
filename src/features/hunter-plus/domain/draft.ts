import type { CompanyProfile } from "@/features/profile/types/profile.types";
import type { Opportunity } from "@/features/scoring/types/scoring.types";

/** The real numbers a draft is built from — nothing here is invented; a missing value stays missing. */
export interface DraftFigures {
  company: string;
  employees: number;
  county: string;
  teaor: string | null;
  /** The company's planned project value, in HUF. */
  total: number;
  /** total × the call's support intensity. */
  grant: number;
  /** What the company puts in itself: total − grant. */
  own: number;
  intensityPct: number;
  goalIds: string[];
  docs: string[];
}

export function draftFigures(profile: CompanyProfile, opp: Pick<Opportunity, "intensity" | "goals" | "docs">): DraftFigures {
  const intensity = opp.intensity || 0;
  const grant = profile.investment_value * intensity;
  return {
    company: profile.company,
    employees: profile.employees,
    county: profile.county,
    teaor: profile.teaor || null,
    total: profile.investment_value,
    grant,
    own: profile.investment_value - grant,
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
