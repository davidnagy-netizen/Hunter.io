import type { Industry, Region } from "@/shared/types/reference.types";
import type { CompanyProfile } from "@/features/profile/types/profile.types";

export interface ChoiceOption {
  /** i18n key under `assessment:options.<question>.<key>`. */
  key: string;
  value: number;
}

export type AssessmentQuestion =
  | { id: "employees" | "closed_business_years" | "investment_value"; kind: "single"; options: ChoiceOption[] }
  | { id: "county"; kind: "county" }
  | { id: "industryId"; kind: "industry" }
  | { id: "goals"; kind: "goals" };

/**
 * The six questions, in order. The numeric values are band *representatives*
 * ("5–15 employees" is stored as 10), which is all the funnel can know; the
 * onboarding wizard lets the visitor replace them with exact figures.
 *
 * "2 or more closed years" is `4`, matching the onboarding wizard's own chip —
 * the legacy funnel used `3`, which highlighted no chip once carried over.
 */
export const QUESTIONS: AssessmentQuestion[] = [
  {
    id: "employees",
    kind: "single",
    options: [
      { key: "tiny", value: 3 },
      { key: "small", value: 10 },
      { key: "mid", value: 30 },
      { key: "large", value: 120 },
    ],
  },
  { id: "county", kind: "county" },
  { id: "industryId", kind: "industry" },
  {
    id: "closed_business_years",
    kind: "single",
    options: [
      { key: "none", value: 0 },
      { key: "one", value: 1 },
      { key: "twoPlus", value: 4 },
    ],
  },
  { id: "goals", kind: "goals" },
  {
    id: "investment_value",
    kind: "single",
    options: [
      { key: "xs", value: 6e6 },
      { key: "s", value: 25e6 },
      { key: "m", value: 60e6 },
      { key: "l", value: 180e6 },
    ],
  },
];

export interface AssessmentAnswers {
  employees?: number;
  county?: string;
  industryId?: string;
  closed_business_years?: number;
  goals?: string[];
  investment_value?: number;
}

export function isAnswered(question: AssessmentQuestion, answers: AssessmentAnswers): boolean {
  if (question.id === "goals") return (answers.goals ?? []).length > 0;
  if (question.id === "county") return Boolean(answers.county);
  if (question.id === "industryId") return Boolean(answers.industryId);
  return answers[question.id] !== undefined;
}

interface Reference {
  regions: Region[];
  industries: Industry[];
}

const SME_CEILING = 249;

function derived(answers: AssessmentAnswers, ref: Reference) {
  const region = ref.regions.find((r) => answers.county && r.counties.includes(answers.county))?.code;
  const teaor = ref.industries.find((i) => i.id === answers.industryId)?.teaor;
  const orgType = answers.employees === undefined ? undefined : answers.employees <= SME_CEILING ? "sme" : "large";
  return { region, teaor, orgType } as const;
}

/**
 * What the visitor has actually said, as onboarding fields — and nothing they
 * haven't. (The legacy funnel also invented a company name, revenue band and
 * project name, and the placeholder company name ended up pre-filled in the
 * wizard's name box.)
 */
export function buildDraft(answers: AssessmentAnswers, ref: Reference): Partial<CompanyProfile> {
  const { region, teaor, orgType } = derived(answers, ref);
  const draft: Partial<CompanyProfile> = { country: "HU" };
  if (answers.employees !== undefined) draft.employees = answers.employees;
  if (answers.county) draft.county = answers.county;
  if (region) draft.region = region;
  if (answers.industryId) draft.industryId = answers.industryId;
  if (teaor) draft.teaor = teaor;
  if (answers.closed_business_years !== undefined) draft.closed_business_years = answers.closed_business_years;
  if (answers.goals?.length) draft.goals = answers.goals;
  if (answers.investment_value !== undefined) draft.investment_value = answers.investment_value;
  if (orgType) draft.orgType = orgType;
  return draft;
}

/**
 * A complete profile for scoring the teaser matches. Unlike the draft this
 * fills gaps with neutral defaults (the legacy's), because the server needs a
 * whole profile to score against — it is never saved or shown.
 */
export function buildScoringProfile(answers: AssessmentAnswers, ref: Reference): CompanyProfile {
  const { region, teaor, orgType } = derived(answers, ref);
  const employees = answers.employees ?? 10;
  return {
    company: "Assessment",
    initials: "C",
    employees,
    region: region ?? "HU12",
    county: answers.county ?? "Pest",
    industryId: answers.industryId ?? "services",
    teaor: teaor ?? "70",
    revBand: "100–500 M Ft",
    closed_business_years: answers.closed_business_years ?? 0,
    goals: answers.goals ?? [],
    investment_value: answers.investment_value ?? 25e6,
    projectName: "",
    funding_pref: ["non_refundable", "HU", "EU"],
    country: "HU",
    orgType: orgType ?? "sme",
  };
}
