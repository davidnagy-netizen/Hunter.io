export type RuleOperator = "between" | "in" | "not_in" | ">=" | "<=" | "==" | "includes_any";

/** A declarative `{field, op, value}` rule carried by every opportunity. The server evaluates it; the browser never does. */
export interface Rule {
  field: string;
  op: RuleOperator;
  value: unknown;
  weight?: number;
}

export interface QuizOption {
  t_hu?: string;
  t_en?: string;
  v: boolean | string | number | null;
}

/** An open eligibility question the server would like answered (`questions[]` on a scored call). */
export interface EligibilityQuestionDef {
  field: string;
  scope: "global" | "call";
  q_hu: string;
  q_en: string;
  opts: QuizOption[];
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
 * An opportunity as `GET /api/catalog` returns it (trimmed): the call itself,
 * with no verdict for any company. Only the fields a feature actually reads
 * are typed; the server sends more.
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

export type ScoreBandKey = "strong" | "relevant" | "conditional" | "low";

/** The server's band for a score, already worded in the requested language. */
export interface ScoreBand {
  key: ScoreBandKey;
  label: string;
}

export interface ScoreCheck {
  field: string;
  /** Already worded in the requested language. */
  label: string;
  status: RuleStatus;
  /** The company's own value that was checked; `null` when unknown. */
  yourValue: unknown;
  required: unknown;
  operator: string;
}

export type FactorKey = "elig" | "fit" | "size" | "timing" | "feas";

export interface FactorExplanation {
  key: FactorKey;
  weight: number;
  /** 0–100. */
  value: number;
  label: string;
  detail: string;
}

/** Grant arithmetic for the company's own project value, worked out by the server. */
export interface GrantCalculation {
  projectValueHuf: number;
  intensity: number;
  grantHuf: number;
  ownContributionHuf: number;
  cappedByCeiling: boolean;
  ceilingHuf: number | null;
  partnerShare?: PartnerShare | null;
  callGrantHuf?: number | null;
  currencyNote?: string | null;
}

/**
 * What the server worked out for this caller's company about one call. The
 * server is the only scorer: the browser shows these values and never
 * recomputes them.
 */
export interface ScoreFields {
  /** Days until the deadline, by the server's clock. */
  daysLeft: number | null;
  /** `null` when blocked — a NOT_ELIGIBLE call is never given a score. */
  score: number | null;
  blocked: boolean;
  /** True when the verdict is INSUFFICIENT_DATA: the score is an estimate. */
  estimated: boolean;
  verdict: EligibilityStatus;
  band: ScoreBand | null;
  blockedReasons: string[];
  checks: ScoreCheck[];
  /** Things to watch out for, already worded. */
  conditions: string[];
  factors: FactorExplanation[];
  questions: EligibilityQuestionDef[];
  calculator: GrantCalculation | null;
}

export type ScoredOpportunity = Opportunity & ScoreFields;

/** Ad-hoc eligibility answers, keyed by field (or `"<oppId>:<field>"`). */
export type AnswerMap = Record<string, boolean | string | number>;
