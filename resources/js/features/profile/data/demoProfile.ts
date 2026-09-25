import type { CompanyProfile } from "../types/profile.types";

/**
 * Mirrors `DEMO_PROFILE` in `src/data/referenceData.js` exactly. Static,
 * versioned-with-the-product demo data (not account-specific), so a small,
 * documented client-side copy is acceptable here — unlike the eligibility
 * engine, this has no logic to drift out of sync, just values. Update both
 * if the demo company's story ever changes.
 */
export const DEMO_PROFILE: CompanyProfile = {
  company: "Alfa Gyártó Kft.",
  initials: "AG",
  employees: 28,
  region: "HU12",
  county: "Pest",
  industryId: "manuf",
  teaor: "28",
  revBand: "500 M–1 Mrd Ft",
  closed_business_years: 4,
  goals: ["digitalization", "it", "machinery"],
  investment_value: 30e6,
  projectName: "ERP és gyártásvezérlő rendszer bevezetése",
  funding_pref: ["non_refundable", "EU", "HU"],
  de_minimis_ok: undefined,
  consortium_ready: undefined,
  eu_experience: undefined,
  country: "HU",
  orgType: "sme",
};
