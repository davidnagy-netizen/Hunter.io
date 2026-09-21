import { z } from "zod";

const ORG_TYPE_IDS = ["sme", "large", "research", "university", "ngo", "public"] as const;

/**
 * Mirrors `normalizeProfile()` (`src/engine/profile.js`) and the onboarding
 * wizard's `obStepValid()` (legacy `public/js/views/onboarding.js`) — every
 * field required here is a field the legacy wizard also blocked "Next" on.
 * `de_minimis_ok` is deliberately absent: the wizard never collects it, only
 * the eligibility quiz on an opportunity's detail page does (a later slice).
 */
export const companyProfileSchema = z.object({
  company: z.string().min(1, "profile:validation.company"),
  taxNumber: z.string().optional(),
  // Plain z.number(), not z.coerce.number(): coercion makes zod's input type
  // `unknown`, which breaks RHF's resolver typing (input type != output
  // type). Numeric `<input>`s use `register(field, { valueAsNumber: true })`
  // instead so the value is already a number by the time zod sees it —
  // NaN (e.g. an empty field) still correctly fails `.positive()`/`.min()`.
  employees: z.number({ error: "profile:validation.employees" }).int().positive("profile:validation.employees"),
  county: z.string().min(1, "profile:validation.county"),
  region: z.string().optional(),
  closed_business_years: z.number({ error: "profile:validation.closedYears" }).int().min(0, "profile:validation.closedYears"),
  industryId: z.string().min(1, "profile:validation.industry"),
  teaor: z.string().optional(),
  revBand: z.string().optional(),
  goals: z.array(z.string()).min(1, "profile:validation.goals"),
  investment_value: z.number({ error: "profile:validation.investment" }).positive("profile:validation.investment"),
  projectName: z.string().optional(),
  funding_pref: z.array(z.string()),
  orgType: z.enum(ORG_TYPE_IDS, { error: "profile:validation.orgType" }),
  consortium_ready: z.boolean({ error: "profile:validation.consortiumReady" }),
  eu_experience: z.boolean().optional(),
});
export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

/**
 * Which fields each wizard step must pass before "Next" is enabled — used
 * with React Hook Form's `trigger(STEP_FIELDS.company)` per step, so a field
 * on a later step never blocks an earlier one.
 */
export const STEP_FIELDS = {
  company: ["company", "employees", "county", "closed_business_years"],
  activity: ["industryId"],
  goals: ["goals"],
  investment: ["projectName", "investment_value", "funding_pref"],
  setup: ["orgType", "consortium_ready"],
} as const satisfies Record<string, (keyof CompanyProfileFormValues)[]>;
