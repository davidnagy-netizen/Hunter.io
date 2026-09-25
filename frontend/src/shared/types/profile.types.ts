/** Mirrors the shape `src/engine/profile.js#normalizeProfile` accepts and fills in. */
export interface CompanyProfile {
  legal_form?: import("@/features/authentication/types/metrics.types").CompanyMetrics["legal_form"];
  headcount?: number;
  revenue_band?: number;
  exact_revenue?: string | null;
  teaor_code?: string;
  county_code?: string;
  metrics_complete?: boolean;
  company: string;
  /** The company's NAV-verified tax number (`xxxxxxxx-y-zz`), set at registration; kept by the server as an extra field. */
  taxNumber?: string;
  initials?: string;
  employees: number;
  region?: string;
  county: string;
  industryId: string;
  teaor?: string;
  revBand?: string;
  closed_business_years: number;
  goals: string[];
  investment_value: number;
  projectName?: string;
  funding_pref: string[];
  de_minimis_ok?: boolean;
  country?: string;
  orgType?: "sme" | "large" | "research" | "university" | "ngo" | "public";
  consortium_ready?: boolean;
  eu_experience?: boolean;
}

export interface ProfileVersionChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface ProfileVersion {
  version: number;
  at: string;
  source: string;
  changed: ProfileVersionChange[];
}

export interface ActivityEntry {
  at: string;
  type: string;
  [key: string]: unknown;
}

export interface ProfileHistoryResponse {
  current: CompanyProfile | null;
  versions: ProfileVersion[];
  activity: ActivityEntry[];
}

export interface GetProfileResponse {
  profile: CompanyProfile | null;
  answers: Record<string, unknown>;
  saved: string[];
  demoProfile: CompanyProfile;
  versions: number;
  lastEuSync?: string;
}

export interface SaveProfileResponse {
  success: true;
  profile: CompanyProfile;
  version?: number;
  changed?: ProfileVersionChange[];
}

export interface RestoreProfileResponse {
  success: true;
  profile: CompanyProfile;
  versions: ProfileVersion[];
}
