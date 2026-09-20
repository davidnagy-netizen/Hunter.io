import type { CompanyProfile } from "@/features/profile/types/profile.types";

export type RuleOperator = "between" | "in" | "not_in" | ">=" | "<=" | "==" | "includes_any";

export interface QuizOption {
  t_hu?: string;
  t_en?: string;
  t?: string;
  v: boolean | string | number | null;
}

/** An inline question that can resolve an `unknown` rule (e.g. de minimis headroom). */
export interface RuleQuiz {
  q_hu?: string;
  q_en?: string;
  q?: string;
  opts: QuizOption[];
}

/** A declarative `{field, op, value}` rule carried by every opportunity. */
export interface Rule {
  field: string;
  op: RuleOperator;
  value: unknown;
  weight?: number;
  label?: string;
  label_hu?: string;
  label_en?: string;
  quiz?: RuleQuiz;
}

export interface ConsortiumRequirement {
  required: boolean;
  minPartners: number;
  minCountries: number;
}

export interface PartnerShare {
  minHuf: number;
  typicalHuf: number;
  maxHuf: number;
  basis?: string;
}

/**
 * An opportunity as `GET /api/catalog` returns it (after the server's
 * `trim()`): everything the eligibility engine and the score read, plus the
 * display fields the opportunity screens will use. Only the fields a
 * feature actually reads are typed; the server sends more.
 */
export interface Opportunity {
  id: string;
  sourceSystem?: string;
  sourceRef?: string;
  sourceUrl?: string | null;
  submissionUrl?: string | null;
  program: string;
  title: string;
  summary?: string;
  status?: string;
  deadline: string;
  fundingMin?: number | null;
  fundingMax?: number | null;
  intensity: number;
  consortium?: ConsortiumRequirement;
  partnerShare?: PartnerShare;
  smeFit?: number;
  highAdmin?: boolean;
  awardsFunding?: boolean;
  goals: string[];
  goalScores?: Record<string, number>;
  described?: boolean;
  docs?: string[];
  isNew?: boolean;
  curated?: boolean;
  hard: Rule[];
  soft?: Rule[];
}

export type EligibilityStatus = "ELIGIBLE" | "CONDITIONAL" | "INSUFFICIENT_DATA" | "NOT_ELIGIBLE";

export type RuleStatus = "pass" | "fail" | "unknown";

export interface EligibilityCheck {
  rule: Rule;
  status: RuleStatus;
  value: unknown;
}

export interface EligibilityCondition {
  type: "own" | "deadline" | "admin" | "consortium" | "no_funding";
  text_hu: string;
  text_en: string;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  checks: EligibilityCheck[];
  conditions: EligibilityCondition[];
  days: number;
}

export interface ScoreFactors {
  elig: number;
  fit: number;
  size: number;
  timing: number;
  feas: number;
}

export interface FundorScoreResult {
  elig: EligibilityResult;
  blocked: boolean;
  /** `null` when blocked — a NOT_ELIGIBLE call is never given a score. */
  score: number | null;
  factors: ScoreFactors | null;
  /** True when the verdict is INSUFFICIENT_DATA: the score is an estimate. */
  estimated: boolean;
}

export type ScoreBandKey = "strong" | "relevant" | "conditional" | "low";

export interface ScoreBand {
  key: ScoreBandKey;
  lbl_hu: string;
  lbl_en: string;
}

export interface FactorExplanation {
  key: keyof ScoreFactors;
  weight: number;
  /** 0–100. */
  value: number;
  label: string;
  detail: string;
}

export interface RankedOpportunity {
  opp: Opportunity;
  res: FundorScoreResult;
}

/**
 * Ad-hoc eligibility answers. A key is either a bare field (`de_minimis_ok`,
 * applies to every call that asks) or `"<oppId>:<field>"` (one call only).
 */
export type AnswerMap = Record<string, boolean | string | number>;

export type ScoringProfile = CompanyProfile & Record<string, unknown>;
