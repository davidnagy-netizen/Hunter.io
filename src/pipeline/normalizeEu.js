/**
 * Raw SEDIA record -> Hunter opportunity.
 *
 * The EU Funding & Tenders portal returns a search document whose every
 * metadata value is an array of strings, with several of those strings being
 * JSON documents in their own right (budget tables, submission links). This
 * module unpacks that into the flat, typed shape the eligibility engine and the
 * UI both consume, and attaches the programme rules that the portal itself
 * never states.
 *
 * Nothing here guesses at eligibility: a field that cannot be derived is left
 * undefined so the engine can report INSUFFICIENT_DATA rather than invent a
 * value.
 */

import { FRAMEWORK_PROGRAMMES, resolveActionRules, HU_ACCESS } from "../data/programmes.js";
import { classifyGoals, inferSectors } from "../data/taxonomy.js";

/** EUR -> HUF. Overridable at build time so the catalog can carry a live rate. */
export const DEFAULT_EUR_HUF = 395;

const first = (v) => (Array.isArray(v) ? v[0] : v);
const arr = (v) => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);

function stripHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/﻿/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseJsonish(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** SEDIA dates arrive as "2026-09-15T00:00:00.000+0000". */
function toIsoDate(value) {
  if (!value) return null;
  const s = String(value);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * Pulls this topic's own row out of the call-level budget table.
 * The table is keyed by an internal id, so the topic identifier is matched
 * against the human-readable `action` string instead.
 */
function extractBudget(metadata, identifier) {
  const overview = parseJsonish(first(metadata.budgetOverview));
  if (!overview || !overview.budgetTopicActionMap) return null;

  for (const rows of Object.values(overview.budgetTopicActionMap)) {
    for (const row of arr(rows)) {
      const action = String(row.action || "");
      if (!identifier || !action.startsWith(`${identifier} `)) continue;

      const yearly = Object.values(row.budgetYearMap || {})
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n));
      const total = yearly.reduce((a, b) => a + b, 0);
      // "HORIZON-CL5-2026-09-D4-03 - HORIZON-IA HORIZON Innovation Actions"
      const codeMatch = action.match(/^\S+\s+-\s+(\S+)\s/);

      return {
        actionCode: codeMatch ? codeMatch[1] : null,
        actionLabel: action.replace(/^\S+\s+-\s+\S+\s*/, "").trim() || null,
        minContributionEur: Number.isFinite(Number(row.minContribution)) ? Number(row.minContribution) : null,
        maxContributionEur: Number.isFinite(Number(row.maxContribution)) ? Number(row.maxContribution) : null,
        totalCallBudgetEur: total || null,
        expectedGrants: Number.isFinite(Number(row.expectedGrants)) ? Number(row.expectedGrants) : null,
        deadlineDates: arr(row.deadlineDates).map(toIsoDate).filter(Boolean),
        openingDate: toIsoDate(row.plannedOpeningDate),
        deadlineModel: row.deadlineModel || null,
      };
    }
  }
  return null;
}

/** The submission `links` block carries the authoritative action and grant type. */
function extractSubmission(metadata) {
  const links = parseJsonish(first(metadata.links));
  const entry = arr(links)[0];
  if (!entry) return null;
  return {
    actionCode: entry.criterionCode || null,
    actionLabel: entry.criterionDescription || null,
    grantTypeCode: entry.mgaCode || null,
    grantType: entry.mgaDescription || null,
    submissionUrl: entry.url || null,
  };
}

/**
 * Required annexes. The portal links to them rather than listing them, but the
 * set is fixed per programme family, so it is derived from the action code.
 */
function requiredDocuments(programmeShort, actionCode, isLumpSum) {
  const horizonLike = ["HORIZON", "EURATOM"].includes(programmeShort);
  const docs = [];

  if (horizonLike) {
    docs.push("Part A — Administrative forms (submitted in the Funding & Tenders Portal)");
    docs.push("Part B — Technical description (page limit set by the call)");
    docs.push(isLumpSum ? "Detailed budget table for the lump sum (mandatory annex)" : "Estimated budget per work package and partner");
    docs.push("Participant registration (PIC) and legal entity validation");
    if (actionCode && actionCode.startsWith("HORIZON-EIC")) {
      docs.push("Business plan and financial projections");
      docs.push("Company registration and SME self-declaration");
    }
    docs.push("Ethics self-assessment");
  } else if (programmeShort === "LIFE") {
    docs.push("Part A — Administrative forms");
    docs.push("Part B — Technical description of the action");
    docs.push("Part C — Project-specific KPI table");
    docs.push("Detailed budget and financial capacity documents");
    docs.push("Declaration of honour by each beneficiary");
  } else if (programmeShort === "DIGITAL") {
    docs.push("Part A — Administrative forms");
    docs.push("Part B — Technical description");
    docs.push("Detailed budget table");
    docs.push("Participant registration (PIC) and legal entity validation");
  } else if (programmeShort === "CEF") {
    docs.push("Part A — Administrative forms");
    docs.push("Part B — Technical description and implementation plan");
    docs.push("Member State agreement / letter of support");
    docs.push("Cost-benefit analysis and maturity documentation");
  } else {
    docs.push("Part A — Administrative forms");
    docs.push("Part B — Technical description");
    docs.push("Detailed budget table");
    docs.push("Participant registration (PIC) and legal entity validation");
  }

  docs.push("Last closed annual accounts (financial capacity check)");
  return docs;
}

/**
 * Builds the deterministic hard rules the eligibility engine evaluates.
 *
 * These are rules about the *applicant*, not about the project's merit — an
 * applicant either satisfies them or the call is closed to them.
 */
function buildHardRules(opp, rules) {
  const hard = [];

  hard.push({
    field: "orgType",
    op: "in",
    value: rules.orgs,
    label_hu: `Pályázhat: ${rules.orgs.join(", ")}`,
    label_en: `Eligible applicant types: ${rules.orgs.join(", ")}`,
  });

  hard.push({
    field: "country",
    op: "in",
    value: ["HU"],
    label_hu: "Magyarországon bejegyzett jogi személy (EU tagállam)",
    label_en: "Legal entity established in Hungary (EU Member State)",
  });

  if (rules.minPartners > 1) {
    hard.push({
      field: "consortium_ready",
      op: "==",
      value: true,
      label_hu: `Konzorcium szükséges: min. ${rules.minPartners} független szervezet ${rules.minCountries} különböző tagállamból`,
      label_en: `Consortium required: at least ${rules.minPartners} independent entities from ${rules.minCountries} different Member States`,
      quiz: {
        q_hu: `Ez a felhívás legalább ${rules.minPartners} partneres, ${rules.minCountries} országot átfogó konzorciumot kíván. Van vagy építhető ilyen partnerséged?`,
        q_en: `This call requires a consortium of at least ${rules.minPartners} partners across ${rules.minCountries} countries. Do you have — or can you build — such a partnership?`,
        opts: [
          { t_hu: "Igen, van partnerhálózatom", t_en: "Yes, I have partners", v: true },
          { t_hu: "Nem, csak egyedül pályáznék", t_en: "No, I would apply alone", v: false },
          { t_hu: "Nem tudom", t_en: "I don't know", v: null },
        ],
      },
    });
  }

  // Budget gating depends on who is applying.
  //
  // On a single-applicant call the published contribution is what *this*
  // company would receive, so its project has to be able to absorb it — a
  // 30M HUF project cannot carry a 1.8bn HUF grant, and that is a hard bar.
  //
  // On a consortium call the same figure covers the whole partnership. The
  // Hungarian partner delivers one work package and budgets only for that, so
  // gating on the full call amount would wrongly exclude nearly every Horizon
  // topic from every SME. There the share is an estimate, and estimates belong
  // in the soft rules, not the hard ones.
  if (!rules.minPartners || rules.minPartners <= 1) {
    if (opp.budget && opp.budget.minContributionHuf) {
      const floor = opp.budget.minContributionHuf;
      hard.push({
        field: "investment_value",
        op: ">=",
        value: floor,
        label_hu: `A projekt mérete legalább ${Math.round(floor / 1e6)} M Ft (a felhívás alsó támogatási határa, egyedüli pályázó)`,
        label_en: `Project size of at least ${Math.round(floor / 1e6)}M HUF (the call's lower funding threshold for a single applicant)`,
      });
    }
  }

  if (rules.sector === "defence") {
    hard.push({
      field: "sector",
      op: "in",
      value: ["manufacturing", "it", "services"],
      label_hu: "Védelmi ipari képesség szükséges (EDF)",
      label_en: "Defence-sector capability required (EDF)",
    });
  }

  return hard;
}

function buildSoftRules(opp, rules) {
  const soft = [];
  if (opp.goals.length) {
    soft.push({ field: "goals", op: "includes_any", value: opp.goals, weight: 0.5 });
  }
  if (opp.sectors.length) {
    soft.push({ field: "sector", op: "in", value: opp.sectors, weight: 0.3 });
  }
  soft.push({ field: "funding_pref", op: "includes_any", value: ["EU"], weight: 0.2 });

  if (opp.partnerShare?.typicalHuf) {
    soft.push({
      field: "investment_value",
      op: ">=",
      value: Math.round(opp.partnerShare.minHuf),
      weight: 0.3,
    });
  }
  return soft;
}

/**
 * What one partner would realistically budget for on a consortium call.
 *
 * The portal publishes the grant per *project*, never per partner. Horizon
 * consortia routinely run well past their three-partner minimum — eight to
 * fifteen is normal — so a partner's slice is far smaller than an even split
 * would suggest. These shares are an openly-stated planning estimate, which is
 * why they drive soft rules and the calculator rather than any hard verdict.
 */
const PARTNER_SHARE = { min: 0.06, typical: 0.12, max: 0.25 };

function estimatePartnerShare(opp, rules) {
  if (!rules.minPartners || rules.minPartners <= 1) return null;
  const grant = opp.budget?.maxContributionHuf || opp.budget?.minContributionHuf;
  if (!grant) return null;

  // An even split is the ceiling on any one partner's realistic share.
  const evenSplit = 1 / rules.minPartners;
  return {
    minHuf: Math.round(grant * PARTNER_SHARE.min),
    typicalHuf: Math.round(grant * Math.min(PARTNER_SHARE.typical, evenSplit)),
    maxHuf: Math.round(grant * Math.min(PARTNER_SHARE.max, evenSplit)),
    basis: `Estimated share of the ${Math.round(grant / 1e6)}M HUF project grant for one partner in a consortium of at least ${rules.minPartners}.`,
  };
}

/**
 * Normalizes one raw SEDIA search result.
 *
 * @param {object} raw   a parsed line from the scraper's .jsonl output
 * @param {{eurHuf?:number}} [opts]
 * @returns {object|null} null when the record carries no usable identifier
 */
export function normalizeEuRecord(raw, opts = {}) {
  const eurHuf = opts.eurHuf || DEFAULT_EUR_HUF;
  const m = raw?.metadata;
  if (!m) return null;

  const identifier = first(m.identifier);
  if (!identifier) return null;

  const fwCode = first(m.frameworkProgramme);
  const fw = FRAMEWORK_PROGRAMMES[fwCode] || { short: "EU", name: "European Union funding" };

  const budget = extractBudget(m, identifier);
  const submission = extractSubmission(m);
  const actionCode = submission?.actionCode || budget?.actionCode || null;
  const rules = resolveActionRules(actionCode, fw.short);

  const descriptionHtml = first(m.descriptionByte) || first(m.description) || "";
  const description = stripHtml(descriptionHtml);
  const title = first(m.title) || raw.summary || identifier;
  const keywords = arr(m.keywords).filter((k) => k && k !== "[]" && k !== identifier);
  const crossCutting = arr(m.crossCuttingPriorities);

  const classification = classifyGoals({
    title,
    summary: first(m.callTitle) || "",
    description,
    keywords,
    crossCutting,
  });
  const goals = classification.goals;
  const sectors = inferSectors(goals);

  // A topic can carry several cut-off dates; the next one that has not passed
  // is the deadline that matters, and the last one bounds the call's life.
  const deadlines = [...new Set([...arr(m.deadlineDate).map(toIsoDate), ...(budget?.deadlineDates || [])].filter(Boolean))].sort();
  const deadline = deadlines[deadlines.length - 1] || null;
  if (!deadline) return null;

  const opening = toIsoDate(first(m.startDate)) || budget?.openingDate || null;
  const isLumpSum = Boolean(submission?.grantTypeCode && submission.grantTypeCode.includes("-LS"));

  const minEur = budget?.minContributionEur ?? null;
  const maxEur = budget?.maxContributionEur ?? null;

  const opp = {
    id: `eu-${String(identifier).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    sourceSystem: "EU_FUNDING_TENDERS",
    sourceRef: identifier,
    sourceUrl: m.url ? first(m.url) : raw.url || null,
    submissionUrl: submission?.submissionUrl || null,

    program: `EU – ${fw.name}`,
    programShort: fw.short,
    callId: first(m.callIdentifier) || null,
    callTitle: first(m.callTitle) || null,
    title,
    summary: description ? description.slice(0, 400) : "",
    description,

    actionCode,
    actionLabel: submission?.actionLabel || budget?.actionLabel || first(m.typesOfAction) || rules.label,
    grantType: submission?.grantType || (isLumpSum ? "Lump sum grant" : "Actual cost grant"),
    lumpSum: isLumpSum,

    status: "open",
    opening,
    deadline,
    deadlines,
    deadlineModel: first(m.deadlineModel) || budget?.deadlineModel || null,

    // Funding, expressed in both currencies: EUR is what the call states, HUF is
    // what a Hungarian applicant plans in.
    currency: "EUR",
    eurHuf,
    budget: {
      minContributionEur: minEur,
      maxContributionEur: maxEur,
      totalCallBudgetEur: budget?.totalCallBudgetEur ?? null,
      expectedGrants: budget?.expectedGrants ?? null,
      minContributionHuf: minEur ? Math.round(minEur * eurHuf) : null,
      maxContributionHuf: maxEur ? Math.round(maxEur * eurHuf) : null,
      totalCallBudgetHuf: budget?.totalCallBudgetEur ? Math.round(budget.totalCallBudgetEur * eurHuf) : null,
    },

    // Kept for the existing engine, which reasons in HUF project size.
    fundingMin: minEur ? Math.round(minEur * eurHuf) : null,
    fundingMax: maxEur ? Math.round(maxEur * eurHuf) : null,
    intensity: rules.rate,

    consortium: {
      required: rules.minPartners > 1,
      minPartners: rules.minPartners,
      minCountries: rules.minCountries,
    },
    applicantTypes: rules.orgs,
    smeFit: rules.smeFit,
    highAdmin: rules.admin >= 0.8,
    adminBurden: rules.admin,
    awardsFunding: rules.funding !== false,

    goals,
    // Distinguishes "the portal published no description" from "we read the
    // description and it matches none of the company's goals". The first is a
    // gap in the data; the second is a real answer.
    described: description.length >= 200,
    goalScores: classification.scores,
    goalEvidence: classification.evidence,
    sectors,
    keywords,
    crossCuttingPriorities: crossCutting,

    hungary: {
      eligible: true,
      basis: HU_ACCESS.basis,
      note: HU_ACCESS.notes[fw.short] || null,
    },

    docs: requiredDocuments(fw.short, actionCode, isLumpSum),
    conditionsHtml: first(m.topicConditions) || null,
    isNew: false,
  };

  opp.partnerShare = estimatePartnerShare(opp, rules);
  opp.hard = buildHardRules(opp, rules);
  opp.soft = buildSoftRules(opp, rules);
  return opp;
}

/**
 * Normalizes a batch, dropping records that are unusable or already expired.
 *
 * The portal keeps a long tail of topics flagged "open" whose deadline passed
 * years ago; showing those to a user would be worse than showing nothing, so
 * they are filtered out here and counted in the report.
 */
export function normalizeEuBatch(rawRecords, opts = {}) {
  const today = opts.today ? new Date(opts.today) : new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const kept = [];
  const seen = new Set();
  const report = { input: rawRecords.length, expired: 0, unusable: 0, duplicate: 0, noFunding: 0, kept: 0 };

  for (const raw of rawRecords) {
    let opp;
    try {
      opp = normalizeEuRecord(raw, opts);
    } catch {
      opp = null;
    }
    if (!opp) {
      report.unusable += 1;
      continue;
    }
    if (opp.deadline < todayIso) {
      report.expired += 1;
      continue;
    }
    if (!opp.awardsFunding) report.noFunding += 1;
    if (seen.has(opp.id)) {
      report.duplicate += 1;
      continue;
    }
    seen.add(opp.id);
    kept.push(opp);
  }

  report.kept = kept.length;
  return { opportunities: kept, report };
}
