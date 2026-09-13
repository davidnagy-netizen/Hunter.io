/**
 * Company profile normalization.
 *
 * The onboarding wizard collects what a company owner knows off the top of
 * their head — headcount, county, industry, goals, planned investment. The
 * rules attached to EU calls ask slightly different questions: what kind of
 * legal entity is this, which country is it established in, which NACE sector
 * does it sit in. Those are derivable, so they are derived here once rather
 * than asked again.
 *
 * Anything genuinely not derivable is left undefined on purpose — that is what
 * drives the INSUFFICIENT_DATA verdict and the follow-up question, instead of
 * the engine assuming an answer.
 */

import { REGIONS } from "../data/referenceData.js";
import { sectorOfNace } from "../data/taxonomy.js";

/** EU recommendation 2003/361: an SME has fewer than 250 staff. */
export const SME_HEADCOUNT_CEILING = 249;

/** Size class by headcount, following the same recommendation. */
export function sizeClass(employees) {
  if (employees === undefined || employees === null) return undefined;
  if (employees < 10) return "micro";
  if (employees < 50) return "small";
  if (employees <= SME_HEADCOUNT_CEILING) return "medium";
  return "large";
}

/**
 * Fills in the fields the rule engine needs from the ones the user supplied.
 * Never overwrites a value the user set explicitly.
 *
 * @param {object} raw the profile as captured by onboarding
 * @returns {object} a new profile object; the input is not mutated
 */
export function normalizeProfile(raw) {
  if (!raw) return raw;
  const p = { ...raw };

  // Hunter is built for Hungarian companies, but the field stays explicit so
  // the country rule on every EU call has something real to evaluate.
  if (!p.country) p.country = "HU";

  // A company that has not told us otherwise is an SME or a large enterprise,
  // decided by the headcount it already gave us.
  if (!p.orgType && p.employees !== undefined && p.employees !== null) {
    p.orgType = p.employees <= SME_HEADCOUNT_CEILING ? "sme" : "large";
  }

  if (!p.sizeClass) p.sizeClass = sizeClass(p.employees);

  // NACE division -> Hunter sector, used by the soft thematic rules.
  if (!p.sector && p.teaor) p.sector = sectorOfNace(p.teaor);

  // County -> NUTS-2 region, so regional exclusions can be evaluated.
  if (!p.region && p.county) {
    const hit = REGIONS.find((r) => r.counties.includes(p.county));
    if (hit) p.region = hit.code;
  }

  if (!Array.isArray(p.goals)) p.goals = p.goals ? [p.goals] : [];
  if (!Array.isArray(p.funding_pref)) p.funding_pref = p.funding_pref ? [p.funding_pref] : [];

  return p;
}

/**
 * Fields a profile may leave blank that materially change which calls match.
 * The UI uses this to nudge for the highest-value missing answer first.
 */
export const OPTIONAL_PROFILE_FIELDS = [
  {
    field: "consortium_ready",
    weight: 1.0,
    q_hu: "Tudsz vagy szeretnél nemzetközi konzorciumban pályázni (min. 3 partner, 3 országból)?",
    q_en: "Can you apply — or would you like to — as part of an international consortium (min. 3 partners from 3 countries)?",
    opts: [
      { t_hu: "Igen", t_en: "Yes", v: true },
      { t_hu: "Nem, csak önállóan", t_en: "No, only on my own", v: false },
    ],
  },
  {
    field: "de_minimis_ok",
    weight: 0.8,
    q_hu: "Van szabad de minimis kereted (kb. 300 000 EUR / 3 év)?",
    q_en: "Do you have de minimis headroom left (about EUR 300,000 over 3 years)?",
    opts: [
      { t_hu: "Igen", t_en: "Yes", v: true },
      { t_hu: "Nem", t_en: "No", v: false },
    ],
  },
  {
    field: "eu_experience",
    weight: 0.5,
    q_hu: "Pályáztatok már korábban közvetlen EU-s (brüsszeli) forrásra?",
    q_en: "Have you applied for directly managed EU funding before?",
    opts: [
      { t_hu: "Igen", t_en: "Yes", v: true },
      { t_hu: "Még nem", t_en: "Not yet", v: false },
    ],
  },
];
