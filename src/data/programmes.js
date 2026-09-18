/**
 * EU programme + action-type rulebook.
 *
 * Every opportunity coming out of the EU Funding & Tenders portal (SEDIA) is
 * described by two codes that together determine almost everything a Hungarian
 * company needs to know before it decides to apply:
 *
 *   frameworkProgramme  e.g. "43108390"   -> Horizon Europe
 *   criterionCode       e.g. "HORIZON-IA" -> Innovation Action
 *
 * The portal itself never states the reimbursement rate, the minimum consortium
 * size or which kinds of organisation may apply — those live in the programme
 * work-programme annexes. They are stable per action type, so they are encoded
 * here once and applied deterministically, the same way the eligibility engine
 * applies its rules.
 */

/** Framework programme code -> display name (from the SEDIA facet API). */
export const FRAMEWORK_PROGRAMMES = {
  43108390: { short: "HORIZON", name: "Horizon Europe" },
  43252405: { short: "LIFE", name: "Programme for the Environment and Climate Action" },
  43152860: { short: "DIGITAL", name: "Digital Europe Programme" },
  44181033: { short: "EDF", name: "European Defence Fund" },
  43251567: { short: "CEF", name: "Connecting Europe Facility" },
  43298916: { short: "EURATOM", name: "Euratom Research and Training Programme" },
  43251589: { short: "CERV", name: "Citizens, Equality, Rights and Values Programme" },
  43353764: { short: "ERASMUS", name: "Erasmus+" },
  43252449: { short: "RFCS", name: "Research Fund for Coal & Steel" },
  43254019: { short: "ESF", name: "European Social Fund+" },
  43251814: { short: "CREA", name: "Creative Europe Programme" },
  44416173: { short: "I3", name: "Interregional Innovation Investments Instrument" },
  44773066: { short: "JTM", name: "Just Transition Mechanism" },
  43252386: { short: "JUST", name: "Justice Programme" },
  43252476: { short: "SMP", name: "Single Market Programme" },
  43252517: { short: "SOCPL", name: "Social Prerogative and Specific Competencies Lines" },
  43637601: { short: "PPPA", name: "Pilot Projects & Preparatory Actions" },
  43252368: { short: "ISF", name: "Internal Security Fund" },
  43252433: { short: "PERICLES", name: "Protection of the Euro against Counterfeiting" },
  43254037: { short: "ESC", name: "European Solidarity Corps" },
  43697167: { short: "EP", name: "European Parliament" },
  45532249: { short: "EUBA", name: "EU Bodies and Agencies" },
  43089234: { short: "INNOVFUND", name: "Innovation Fund" },
  43253967: { short: "RENEWFM", name: "Renewable Energy Financing Mechanism" },
  43392145: { short: "EMFAF", name: "European Maritime, Fisheries and Aquaculture Fund" },
  45876777: { short: "NDICI", name: "Global Europe (NDICI)" },
  43254027: { short: "EaSI", name: "Employment and Social Innovation" },
};

/**
 * Organisation types Hunter models. A Hungarian company profile is normally
 * `sme` or `large`; the rest exist so the engine can say *why* a call is not for
 * them rather than silently hiding it.
 */
export const ORG_TYPES = [
  { id: "sme", label_hu: "KKV (max. 249 fő)", label_en: "SME (max 249 employees)" },
  { id: "large", label_hu: "Nagyvállalat (250+ fő)", label_en: "Large enterprise (250+)" },
  { id: "research", label_hu: "Kutatóintézet", label_en: "Research organisation" },
  { id: "university", label_hu: "Egyetem / felsőoktatás", label_en: "University" },
  { id: "ngo", label_hu: "Civil szervezet / NGO", label_en: "NGO / non-profit" },
  { id: "public", label_hu: "Közintézmény / önkormányzat", label_en: "Public body" },
];

const ALL_ORGS = ["sme", "large", "research", "university", "ngo", "public"];

/**
 * Action-type rulebook.
 *
 *   rate          reimbursement rate for a for-profit applicant (0..1)
 *   rateNonProfit rate for non-profit applicants where it differs
 *   minPartners   minimum number of independent legal entities in the proposal
 *   minCountries  minimum number of different Member States / Associated Countries
 *   orgs          organisation types that can lead or take part
 *   smeFit        how well the instrument suits a commercial SME (0..1)
 *   admin         administrative burden (0..1, 1 = heaviest)
 *   funding       false when the action awards no money (prizes, quality labels)
 */
export const ACTION_RULES = {
  // Horizon Europe
  "HORIZON-RIA": { label: "Research and Innovation Action", rate: 1.0, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.55, admin: 0.9 },
  "HORIZON-IA": { label: "Innovation Action", rate: 0.7, rateNonProfit: 1.0, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.85, admin: 0.9 },
  "HORIZON-CSA": { label: "Coordination and Support Action", rate: 1.0, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.4, admin: 0.75 },
  "HORIZON-JU-RIA": { label: "Joint Undertaking Research and Innovation Action", rate: 1.0, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.55, admin: 0.9 },
  "HORIZON-JU-IA": { label: "Joint Undertaking Innovation Action", rate: 0.7, rateNonProfit: 1.0, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.85, admin: 0.9 },
  "HORIZON-JU-CSA": { label: "Joint Undertaking Coordination and Support Action", rate: 1.0, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.4, admin: 0.75 },
  "HORIZON-COFUND": { label: "Programme Co-fund Action", rate: 0.5, minPartners: 3, minCountries: 3, orgs: ["research", "university", "public"], smeFit: 0.15, admin: 0.95 },
  "HORIZON-EIC-ACC": { label: "EIC Accelerator", rate: 0.7, minPartners: 1, minCountries: 1, orgs: ["sme"], smeFit: 1.0, admin: 0.85 },
  "HORIZON-EIC-EQU": { label: "EIC Equity Only", rate: 0, minPartners: 1, minCountries: 1, orgs: ["sme"], smeFit: 0.7, admin: 0.85 },
  "HORIZON-EIC": { label: "EIC Pathfinder / Transition", rate: 1.0, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.6, admin: 0.9 },
  "HORIZON-RPr": { label: "Horizon Prize", rate: 1.0, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.5, admin: 0.5, funding: false },
  "HORIZON-PCP": { label: "Pre-Commercial Procurement", rate: 0.9, minPartners: 3, minCountries: 3, orgs: ["public", "research", "university"], smeFit: 0.25, admin: 0.95 },
  "HORIZON-PPI": { label: "Public Procurement of Innovative Solutions", rate: 0.5, minPartners: 3, minCountries: 3, orgs: ["public", "research", "university"], smeFit: 0.25, admin: 0.95 },
  "HORIZON-TMA-MSCA-DN": { label: "MSCA Doctoral Network", rate: 1.0, minPartners: 3, minCountries: 3, orgs: ["university", "research", "large", "sme"], smeFit: 0.3, admin: 0.9 },
  "HORIZON-TMA-MSCA-PF": { label: "MSCA Postdoctoral Fellowship", rate: 1.0, minPartners: 1, minCountries: 1, orgs: ["university", "research"], smeFit: 0.15, admin: 0.8 },
  "HORIZON-TMA-MSCA-SE": { label: "MSCA Staff Exchanges", rate: 1.0, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.4, admin: 0.85 },
  "HORIZON-ERC": { label: "ERC Grant", rate: 1.0, minPartners: 1, minCountries: 1, orgs: ["university", "research"], smeFit: 0.05, admin: 0.9 },
  "HORIZON-AG": { label: "Horizon Action Grant", rate: 0.7, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.6, admin: 0.9 },

  // Euratom
  "EURATOM-RIA": { label: "Euratom Research and Innovation Action", rate: 1.0, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.4, admin: 0.9 },
  "EURATOM-IA": { label: "Euratom Innovation Action", rate: 0.7, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.5, admin: 0.9 },
  "EURATOM-CSA": { label: "Euratom Coordination and Support Action", rate: 1.0, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.3, admin: 0.8 },
  "EURATOM-COFUND": { label: "Euratom Co-fund Action", rate: 0.5, minPartners: 3, minCountries: 3, orgs: ["research", "university", "public"], smeFit: 0.1, admin: 0.95 },

  // LIFE
  "LIFE-PJG": { label: "LIFE Project Grant", rate: 0.6, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.65, admin: 0.7 },
  "LIFE-FPA-OG": { label: "LIFE Operating Grant", rate: 0.7, minPartners: 1, minCountries: 1, orgs: ["ngo"], smeFit: 0.05, admin: 0.7 },
  "LIFE-SAP": { label: "LIFE Standard Action Project", rate: 0.6, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.65, admin: 0.7 },

  // Digital Europe
  "DIGITAL-SIMPLE": { label: "Digital Europe Simple Grant", rate: 0.5, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.9, admin: 0.6 },
  "DIGITAL-JU-SIMPLE": { label: "Digital Europe JU Simple Grant", rate: 0.5, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.9, admin: 0.65 },
  "DIGITAL-LS": { label: "Digital Europe Lump Sum Grant", rate: 0.5, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.9, admin: 0.55 },
  "DIGITAL-CSA": { label: "Digital Europe Coordination and Support Action", rate: 1.0, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.45, admin: 0.6 },
  "DIGITAL-GFS": { label: "Digital Europe Grant for Financial Support (cascade)", rate: 1.0, minPartners: 1, minCountries: 1, orgs: ["sme", "large"], smeFit: 0.95, admin: 0.35 },
  "DIGITAL-JU-GFS": { label: "Digital Europe JU Grant for Financial Support", rate: 1.0, minPartners: 1, minCountries: 1, orgs: ["sme", "large"], smeFit: 0.95, admin: 0.35 },
  "DIGITAL-SME": { label: "Digital Europe SME Support Action", rate: 0.5, minPartners: 1, minCountries: 1, orgs: ["sme"], smeFit: 1.0, admin: 0.5 },
  "DIGITAL-JU-SME": { label: "Digital Europe JU SME Support Action", rate: 0.5, minPartners: 1, minCountries: 1, orgs: ["sme"], smeFit: 1.0, admin: 0.5 },

  // Connecting Europe Facility
  "CEF-INFRA": { label: "CEF Infrastructure Project", rate: 0.5, minPartners: 1, minCountries: 1, orgs: ["large", "public", "sme"], smeFit: 0.3, admin: 0.95 },
  "CEF-PJG": { label: "CEF Project Grant", rate: 0.5, minPartners: 1, minCountries: 1, orgs: ["large", "public", "sme"], smeFit: 0.35, admin: 0.9 },

  // Research Fund for Coal & Steel
  "RFCS-PJG": { label: "RFCS Project Grant", rate: 0.6, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.7, admin: 0.7 },

  // European Defence Fund
  "EDF-RA": { label: "EDF Research Action", rate: 1.0, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.5, admin: 0.95, sector: "defence" },
  "EDF-DA": { label: "EDF Development Action", rate: 0.65, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.5, admin: 0.95, sector: "defence" },
  "EDF-LS": { label: "EDF Lump Sum Grant", rate: 1.0, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.5, admin: 0.95, sector: "defence" },
  "EDF-SME": { label: "EDF SME Action", rate: 0.8, minPartners: 3, minCountries: 3, orgs: ["sme"], smeFit: 0.8, admin: 0.9, sector: "defence" },

  // Interregional Innovation Investments
  "I3-PJG": { label: "I3 Project Grant", rate: 0.7, minPartners: 3, minCountries: 2, orgs: ALL_ORGS, smeFit: 0.9, admin: 0.8 },

  // Social / civic / cultural programmes
  "ESF-PJG": { label: "ESF+ Project Grant", rate: 0.8, minPartners: 1, minCountries: 1, orgs: ["ngo", "public", "research", "university", "sme"], smeFit: 0.35, admin: 0.7 },
  "CERV-LS": { label: "CERV Lump Sum Grant", rate: 0.9, minPartners: 1, minCountries: 1, orgs: ["ngo", "public", "university", "research"], smeFit: 0.1, admin: 0.6 },
  "CERV-PJG": { label: "CERV Project Grant", rate: 0.9, minPartners: 1, minCountries: 1, orgs: ["ngo", "public", "university", "research"], smeFit: 0.1, admin: 0.6 },
  "JUST-LS": { label: "Justice Programme Lump Sum Grant", rate: 0.9, minPartners: 1, minCountries: 1, orgs: ["ngo", "public", "university", "research"], smeFit: 0.1, admin: 0.6 },
  "ISF-PJG": { label: "Internal Security Fund Project Grant", rate: 0.9, minPartners: 1, minCountries: 1, orgs: ["public", "ngo", "research", "large"], smeFit: 0.2, admin: 0.75 },
  "CREA-LS": { label: "Creative Europe Lump Sum Grant", rate: 0.8, minPartners: 1, minCountries: 1, orgs: ["ngo", "sme", "public", "university"], smeFit: 0.4, admin: 0.55 },
  "ERASMUS-LS": { label: "Erasmus+ Lump Sum Grant", rate: 0.8, minPartners: 3, minCountries: 3, orgs: ["university", "ngo", "public", "sme"], smeFit: 0.3, admin: 0.65 },
  "ERASMUS-PRIZE": { label: "Erasmus+ Prize", rate: 1.0, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.1, admin: 0.3, funding: false },
  "ESC-CERT": { label: "European Solidarity Corps Quality Label", rate: 0, minPartners: 1, minCountries: 1, orgs: ["ngo", "public"], smeFit: 0.05, admin: 0.3, funding: false },
  "PERI-PJG": { label: "Pericles IV Project Grant", rate: 0.8, minPartners: 1, minCountries: 1, orgs: ["public", "ngo"], smeFit: 0.05, admin: 0.6 },
  "PPPA-PJG": { label: "Pilot Project / Preparatory Action Grant", rate: 0.8, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.5, admin: 0.7 },
  "JTM-LS": { label: "Just Transition Mechanism Lump Sum Grant", rate: 0.6, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.7, admin: 0.75 },
  "SMP-PJG": { label: "Single Market Programme Project Grant", rate: 0.7, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.8, admin: 0.6 },
  "SOCPL-PJG": { label: "Social Prerogative Project Grant", rate: 0.8, minPartners: 1, minCountries: 1, orgs: ["ngo", "public", "university"], smeFit: 0.1, admin: 0.6 },
  "EMFAF-PJG": { label: "EMFAF Project Grant", rate: 0.7, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.6, admin: 0.7 },
  "INNOVFUND-PJG": { label: "Innovation Fund Project Grant", rate: 0.6, minPartners: 1, minCountries: 1, orgs: ["large", "sme"], smeFit: 0.65, admin: 0.9 },
  EUBA: { label: "EU Agency Grant", rate: 0.8, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.3, admin: 0.6 },
};

/** Sensible defaults per programme when the action code is unknown to us. */
const PROGRAMME_FALLBACK = {
  HORIZON: { rate: 0.7, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.6, admin: 0.9 },
  EURATOM: { rate: 0.8, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.35, admin: 0.9 },
  LIFE: { rate: 0.6, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.6, admin: 0.7 },
  DIGITAL: { rate: 0.5, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.85, admin: 0.6 },
  CEF: { rate: 0.5, minPartners: 1, minCountries: 1, orgs: ["large", "public", "sme"], smeFit: 0.3, admin: 0.9 },
  EDF: { rate: 0.8, minPartners: 3, minCountries: 3, orgs: ALL_ORGS, smeFit: 0.5, admin: 0.95, sector: "defence" },
  RFCS: { rate: 0.6, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.7, admin: 0.7 },
  I3: { rate: 0.7, minPartners: 3, minCountries: 2, orgs: ALL_ORGS, smeFit: 0.9, admin: 0.8 },
  CERV: { rate: 0.9, minPartners: 1, minCountries: 1, orgs: ["ngo", "public", "university", "research"], smeFit: 0.1, admin: 0.6 },
  ERASMUS: { rate: 0.8, minPartners: 3, minCountries: 3, orgs: ["university", "ngo", "public", "sme"], smeFit: 0.3, admin: 0.65 },
  ESF: { rate: 0.8, minPartners: 1, minCountries: 1, orgs: ["ngo", "public", "research", "university", "sme"], smeFit: 0.35, admin: 0.7 },
  CREA: { rate: 0.8, minPartners: 1, minCountries: 1, orgs: ["ngo", "sme", "public", "university"], smeFit: 0.4, admin: 0.55 },
  JTM: { rate: 0.6, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.7, admin: 0.75 },
  DEFAULT: { rate: 0.7, minPartners: 1, minCountries: 1, orgs: ALL_ORGS, smeFit: 0.5, admin: 0.75 },
};

/**
 * Resolves the applicable rules for one opportunity.
 * `actionCode` wins; the programme short name is the fallback.
 */
export function resolveActionRules(actionCode, programmeShort) {
  if (actionCode && ACTION_RULES[actionCode]) {
    return { ...ACTION_RULES[actionCode], actionCode, resolvedFrom: "action" };
  }
  // Tolerate unseen variants such as HORIZON-JU-IA-XYZ by matching the longest prefix.
  if (actionCode) {
    const prefixHit = Object.keys(ACTION_RULES)
      .filter((k) => actionCode.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    if (prefixHit) return { ...ACTION_RULES[prefixHit], actionCode, resolvedFrom: "action-prefix" };
  }
  const fb = PROGRAMME_FALLBACK[programmeShort] || PROGRAMME_FALLBACK.DEFAULT;
  return { ...fb, label: programmeShort || "Grant", actionCode: actionCode || null, resolvedFrom: "programme" };
}

/**
 * Hungary's access to each programme. Every instrument listed above is a Union
 * programme open to legal entities established in any Member State, so the
 * question is never *whether* a Hungarian company may apply but under which
 * conditions — that is what `notes` records.
 */
export const HU_ACCESS = {
  basis:
    "EU Member State (Hungary joined in 2004) — legal entities established in Hungary are eligible applicants across the Union programmes listed here.",
  notes: {
    HORIZON: "Hungarian entities are eligible applicants. Companies are unaffected by the measures applied to certain public research institutions.",
    EDF: "Open to Hungarian defence-sector entities that are not subject to third-country control.",
    CEF: "Applications are normally submitted with the agreement of the Hungarian Member State authority.",
    ESF: "Mostly delivered through Hungarian national operational programmes; directly managed EU calls are the exception.",
  },
};
