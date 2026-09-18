/**
 * Kohesio benchmarks.
 *
 * Kohesio publishes cohesion-policy projects that have *already been funded*,
 * with the beneficiary, the total budget, the EU contribution and the
 * co-financing rate. Those are not opportunities and are never ranked as such.
 *
 * They answer a different question, and one every applicant asks: what does a
 * project like mine actually receive in Hungary? A call states a ceiling; this
 * states what was really awarded. Attaching that to an opportunity turns an
 * abstract funding band into a comparable.
 */

import { classifyGoals } from "../data/taxonomy.js";

/** Kohesio serializes numbers as "+55756920.0". */
function toNumber(value) {
  if (value === undefined || value === null) return null;
  const n = Number(String(value).replace(/^\+/, ""));
  return Number.isFinite(n) ? n : null;
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) return null;
  const idx = Math.min(sortedValues.length - 1, Math.max(0, Math.round((sortedValues.length - 1) * p)));
  return sortedValues[idx];
}

function summarize(values) {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  if (!clean.length) return null;
  return {
    count: clean.length,
    min: clean[0],
    p25: percentile(clean, 0.25),
    median: percentile(clean, 0.5),
    p75: percentile(clean, 0.75),
    max: clean[clean.length - 1],
  };
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** One raw Kohesio project -> the fields a benchmark needs. */
/** @param {object} raw @returns {object|null} */
export function normalizeProject(raw) {
  if (!raw) return null;
  const label = raw.label || (raw.labels || [])[0];
  if (!label) return null;

  const budget = toNumber(raw.budget);
  const euBudget = toNumber(raw.euBudget);
  const description = stripHtml(raw.description_raw || raw.description || "");
  const categories = raw.categoryLabels || [];
  const themes = raw.themeLabels || [];

  const { goals } = classifyGoals({
    title: label,
    description,
    keywords: [...categories, ...themes],
  });

  const programme = (raw.program || [])[0] || null;
  const funds = (raw.funds || []).map((f) => f.id).filter(Boolean);

  return {
    id: raw.item || raw.link || label,
    title: label,
    country: (raw.countryCode || [])[0] || null,
    region: raw.region || null,
    regionText: raw.regionText || null,
    budgetEur: budget,
    euContributionEur: euBudget,
    // Kohesio's own rate is authoritative; deriving it is the fallback.
    cofinancingRate: toNumber(raw.cofinancingRate) ?? (budget && euBudget ? Math.round((euBudget / budget) * 1000) / 10 : null),
    funds,
    programme: programme ? programme.programFullLabel || programme.programLabel : null,
    beneficiary: (raw.beneficiaries || [])[0]?.beneficiaryLabel || null,
    startTime: raw.startTime || null,
    endTime: raw.endTime || null,
    categories,
    goals,
    url: raw.infoRegioUrl || raw.link || null,
  };
}

/**
 * Aggregates a set of raw Kohesio records into benchmark statistics.
 * Only Hungarian projects are kept — a Romanian motorway is not a comparable
 * for a Hungarian applicant.
 */
/** @param {object[]} rawProjects @returns {object} */
export function buildBenchmarks(rawProjects = []) {
  const projects = rawProjects
    .map(normalizeProject)
    .filter((p) => p && p.country === "HU" && p.budgetEur);

  const byGoal = {};
  for (const p of projects) {
    for (const goal of p.goals) {
      byGoal[goal] = byGoal[goal] || [];
      byGoal[goal].push(p);
    }
  }

  const byFund = {};
  for (const p of projects) {
    for (const fund of p.funds) {
      byFund[fund] = byFund[fund] || [];
      byFund[fund].push(p);
    }
  }

  const goalStats = {};
  for (const [goal, list] of Object.entries(byGoal)) {
    goalStats[goal] = {
      projectCount: list.length,
      budgetEur: summarize(list.map((p) => p.budgetEur)),
      euContributionEur: summarize(list.map((p) => p.euContributionEur)),
      medianCofinancingRate: percentile(
        list.map((p) => p.cofinancingRate).filter((r) => Number.isFinite(r)).sort((a, b) => a - b),
        0.5
      ),
    };
  }

  const fundStats = {};
  for (const [fund, list] of Object.entries(byFund)) {
    fundStats[fund] = {
      projectCount: list.length,
      budgetEur: summarize(list.map((p) => p.budgetEur)),
      medianCofinancingRate: percentile(
        list.map((p) => p.cofinancingRate).filter((r) => Number.isFinite(r)).sort((a, b) => a - b),
        0.5
      ),
    };
  }

  return {
    source: "Kohesio (European Commission) — funded cohesion-policy projects in Hungary",
    projectCount: projects.length,
    overall: {
      budgetEur: summarize(projects.map((p) => p.budgetEur)),
      euContributionEur: summarize(projects.map((p) => p.euContributionEur)),
      medianCofinancingRate: percentile(
        projects.map((p) => p.cofinancingRate).filter((r) => Number.isFinite(r)).sort((a, b) => a - b),
        0.5
      ),
    },
    byGoal: goalStats,
    byFund: fundStats,
    // A short, readable sample for the UI to show alongside an opportunity.
    examples: projects
      .slice()
      .sort((a, b) => (b.budgetEur || 0) - (a.budgetEur || 0))
      .slice(0, 40)
      .map((p) => ({
        id: p.id,
        title: p.title,
        beneficiary: p.beneficiary,
        region: p.region,
        budgetEur: p.budgetEur,
        euContributionEur: p.euContributionEur,
        cofinancingRate: p.cofinancingRate,
        goals: p.goals,
        programme: p.programme,
        url: p.url,
      })),
  };
}

/**
 * The benchmarks relevant to one opportunity, matched on shared themes.
 * Returns null when there is nothing comparable rather than a misleading
 * all-sector average.
 */
/** @param {object|null} benchmarks @param {object} opp @returns {object|null} */
export function benchmarksFor(benchmarks, opp) {
  if (!benchmarks || !benchmarks.projectCount) return null;
  const goals = opp?.goals || [];

  const matching = goals
    .map((g) => ({ goal: g, stats: benchmarks.byGoal[g] }))
    .filter((x) => x.stats && x.stats.projectCount >= 3)
    .sort((a, b) => b.stats.projectCount - a.stats.projectCount);

  if (!matching.length) return null;

  const best = matching[0];
  return {
    goal: best.goal,
    projectCount: best.stats.projectCount,
    medianBudgetEur: best.stats.budgetEur?.median ?? null,
    medianEuContributionEur: best.stats.euContributionEur?.median ?? null,
    medianCofinancingRate: best.stats.medianCofinancingRate,
    examples: (benchmarks.examples || []).filter((e) => e.goals.includes(best.goal)).slice(0, 5),
  };
}
