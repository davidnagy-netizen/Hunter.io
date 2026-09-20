/**
 * Type declarations for the server's pure-ESM engine, which the frontend
 * imports directly (`@server-src` → `../src`) instead of maintaining a second
 * copy. The `.js` files are the single source of truth for behavior; this
 * file only describes their shapes for TypeScript, and is the one place
 * those shapes are asserted — a signature change on the server means
 * updating it here, and `domain/engine.test.ts` will fail if behavior drifts.
 *
 * Not `allowJs`: the server's JSDoc types are partly wrong (e.g. `scoreBand`
 * is annotated `@returns {string}` but returns an object), so trusting them
 * would type-check bugs in rather than out.
 */
declare module "@server-src/engine/eligibility.js" {
  import type { AnswerMap, EligibilityResult, Opportunity, Rule, RuleStatus } from "@/features/scoring/types/scoring.types";
  import type { CompanyProfile } from "@/features/profile/types/profile.types";

  export const DEFAULT_REFERENCE_DATE: Date;
  export function daysToDeadline(opp: Pick<Opportunity, "deadline">, referenceDate?: Date): number;
  export function checkRule(val: unknown, op: Rule["op"], target: unknown): RuleStatus;
  export function evaluateEligibility(
    opp: Opportunity,
    profile: CompanyProfile | null,
    adHocAnswers?: AnswerMap,
    referenceDate?: Date,
  ): EligibilityResult;
  export function ruleLabel(rule: Rule, lang?: "hu" | "en"): string;
}

declare module "@server-src/engine/scoring.js" {
  import type {
    AnswerMap,
    FactorExplanation,
    FundorScoreResult,
    Opportunity,
    RankedOpportunity,
    ScoreBand,
  } from "@/features/scoring/types/scoring.types";
  import type { CompanyProfile } from "@/features/profile/types/profile.types";

  export function hunterScore(
    opp: Opportunity,
    profile: CompanyProfile | null,
    adHocAnswers?: AnswerMap,
    referenceDate?: Date,
  ): FundorScoreResult;
  export function scoreBand(score: number | null): ScoreBand & { color: string };
  export function rankedOpps(
    profile: CompanyProfile | null,
    grantList: Opportunity[],
    adHocAnswers?: AnswerMap,
    referenceDate?: Date,
  ): RankedOpportunity[];
  export function explainScore(
    opp: Opportunity,
    profile: CompanyProfile | null,
    res: FundorScoreResult,
    lang?: "hu" | "en",
  ): FactorExplanation[];
}

declare module "@server-src/engine/profile.js" {
  import type { CompanyProfile } from "@/features/profile/types/profile.types";

  export function normalizeProfile<T extends Partial<CompanyProfile> | null>(raw: T): T;
}
