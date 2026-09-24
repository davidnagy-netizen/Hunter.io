/** CR-03 canonical company facts, separate from per-project goals and investment. */
export interface CompanyMetrics {
  legal_form: "kft" | "bt" | "zrt" | "nyrt" | "ev" | "kkt" | "cooperative";
  headcount: number;
  revenue_band: number;
  exact_revenue: string | null;
  teaor_code: string;
  county_code: string;
  closed_business_years: number;
}