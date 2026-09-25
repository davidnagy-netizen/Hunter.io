import { z } from "zod";

/** Decimal strings avoid binary rounding of financial amounts. */
export const metricsSchema = z.object({
  legal_form: z.enum(["kft", "bt", "zrt", "nyrt", "ev", "kkt", "cooperative"]),
  headcount: z.number().int().min(0).max(2147483647),
  revenue_band: z.number().int().min(1).max(6),
  exact_revenue: z.string().regex(/^(?:0|[1-9][0-9]{0,12})(?:\.[0-9]{1,2})?$/).nullable(),
  teaor_code: z.string().regex(/^[0-9]{4}$/),
  county_code: z.string().regex(/^(?:0[1-9]|1[0-9]|20)$/),
  closed_business_years: z.number().int().min(0).max(255),
});