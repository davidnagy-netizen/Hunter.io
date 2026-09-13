/**
 * Opportunity search.
 *
 * Two different questions get asked of the catalog and they deserve different
 * machinery:
 *
 *   "show me what matches my company"  -> the Hunter Score, in scoring.js
 *   "find me calls about hydrogen"     -> this module
 *
 * Free-text ranking is BM25 over an in-memory inverted index. At catalog sizes
 * in the low thousands that is instant, needs no external service, and unlike a
 * substring scan it ranks a call whose *title* is about hydrogen above one that
 * mentions hydrogen once in its scope section.
 */

const BM25_K1 = 1.5;
const BM25_B = 0.75;

/**
 * Field weights. A term in the title is strong evidence of what a call is
 * about; the same term in the body is weak evidence.
 */
const FIELD_BOOST = {
  title: 6,
  callTitle: 3,
  sourceRef: 5,
  callId: 4,
  keywords: 3,
  program: 2,
  actionLabel: 2,
  goals: 2,
  description: 1,
};

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "in", "is", "it", "its",
  "of", "on", "or", "that", "the", "to", "was", "were", "will", "with", "this", "these", "their",
  "es", "az", "egy", "van", "hogy", "nem", "meg", "ki", "el",
]);

/** Lowercase, strip accents, split on anything that is not a letter or digit. */
export function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function fieldText(opp, field) {
  const v = opp[field];
  if (Array.isArray(v)) return v.join(" ");
  return v == null ? "" : String(v);
}

/**
 * Builds the inverted index once per catalog load.
 *
 * @param {object[]} opportunities
 * @returns {{docs:object[], postings:Map<string,Map<number,number>>, lengths:number[], avgLength:number}}
 */
export function buildIndex(opportunities) {
  const postings = new Map();
  const lengths = [];

  opportunities.forEach((opp, docId) => {
    const termFreq = new Map();
    let length = 0;

    for (const [field, boost] of Object.entries(FIELD_BOOST)) {
      const tokens = tokenize(fieldText(opp, field));
      for (const token of tokens) {
        termFreq.set(token, (termFreq.get(token) || 0) + boost);
        length += boost;
      }
    }

    lengths[docId] = length;
    for (const [term, freq] of termFreq) {
      let list = postings.get(term);
      if (!list) {
        list = new Map();
        postings.set(term, list);
      }
      list.set(docId, freq);
    }
  });

  const avgLength = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  return { docs: opportunities, postings, lengths, avgLength };
}

/**
 * BM25 scores for one query. Returns a Map of docId -> score, so an empty query
 * can skip scoring entirely rather than scoring every document equally.
 */
/**
 * How many of the query's terms a document must contain to be a hit.
 *
 * Without this, pasting a topic identifier such as HORIZON-CL4-2026-TWIN-01
 * returns every call that merely shares the token "2026". One or two terms must
 * all match; beyond that, half the terms is enough to tolerate a stray word.
 */
function requiredTermMatches(termCount) {
  if (termCount <= 2) return termCount;
  return Math.ceil(termCount * 0.5);
}

export function searchIndex(index, query) {
  const terms = tokenize(query);
  const scores = new Map();
  if (!terms.length) return scores;

  const N = index.docs.length;
  const matchedTerms = new Map();

  for (const term of terms) {
    // Prefix matching lets "hydro" find "hydrogen", which is what a user typing
    // into a search box expects; exact hits still score higher through IDF.
    const matches = index.postings.has(term)
      ? [[term, index.postings.get(term)]]
      : [...index.postings.entries()].filter(([t]) => t.startsWith(term)).slice(0, 24);

    for (const [matchedTerm, list] of matches) {
      const df = list.size;
      if (!df) continue;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      const partial = matchedTerm === term ? 1 : 0.6;

      for (const [docId, freq] of list) {
        const norm = freq * (BM25_K1 + 1) / (freq + BM25_K1 * (1 - BM25_B + BM25_B * (index.lengths[docId] / (index.avgLength || 1))));
        scores.set(docId, (scores.get(docId) || 0) + idf * norm * partial);

        let seen = matchedTerms.get(docId);
        if (!seen) {
          seen = new Set();
          matchedTerms.set(docId, seen);
        }
        seen.add(term);
      }
    }
  }

  const needed = requiredTermMatches(terms.length);
  for (const [docId, seen] of matchedTerms) {
    if (seen.size < needed) scores.delete(docId);
  }

  return scores;
}

const asArray = (v) => (v === undefined || v === null || v === "" ? [] : Array.isArray(v) ? v : [v]);

/**
 * Applies structured filters to one opportunity.
 * Every filter is AND-ed; values within a single filter are OR-ed.
 */
export function matchesFilters(opp, f = {}) {
  const programs = asArray(f.program);
  if (programs.length && !programs.includes(opp.programShort)) return false;

  const actions = asArray(f.actionCode);
  if (actions.length && !actions.includes(opp.actionCode)) return false;

  const goals = asArray(f.goals);
  if (goals.length && !goals.some((g) => (opp.goals || []).includes(g))) return false;

  const sectors = asArray(f.sectors);
  if (sectors.length && !sectors.some((s) => (opp.sectors || []).includes(s))) return false;

  const orgTypes = asArray(f.orgType);
  if (orgTypes.length && !orgTypes.some((o) => (opp.applicantTypes || []).includes(o))) return false;

  if (f.consortium === "required" && !opp.consortium?.required) return false;
  if (f.consortium === "solo" && opp.consortium?.required) return false;

  if (f.awardsFunding === true && opp.awardsFunding === false) return false;

  if (f.deadlineFrom && opp.deadline < f.deadlineFrom) return false;
  if (f.deadlineTo && opp.deadline > f.deadlineTo) return false;

  // Budget filters are expressed in HUF, matching what the UI shows. A call
  // passes when its published range overlaps the requested range at all.
  if (f.budgetMin != null) {
    const top = opp.fundingMax ?? opp.fundingMin;
    if (top != null && top < Number(f.budgetMin)) return false;
  }
  if (f.budgetMax != null) {
    const bottom = opp.fundingMin ?? opp.fundingMax;
    if (bottom != null && bottom > Number(f.budgetMax)) return false;
  }

  if (f.minIntensity != null && (opp.intensity ?? 0) < Number(f.minIntensity)) return false;

  return true;
}

/** Counts for each facet value, computed over the filtered result set. */
export function computeFacets(opportunities) {
  const tally = (key, pick) => {
    const counts = new Map();
    for (const opp of opportunities) {
      for (const v of asArray(pick(opp))) {
        if (v === undefined || v === null) continue;
        counts.set(v, (counts.get(v) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || String(a.value).localeCompare(String(b.value)));
  };

  return {
    program: tally("program", (o) => o.programShort),
    actionCode: tally("actionCode", (o) => o.actionCode),
    goals: tally("goals", (o) => o.goals),
    sectors: tally("sectors", (o) => o.sectors),
    consortium: tally("consortium", (o) => (o.consortium?.required ? "required" : "solo")),
    applicantTypes: tally("applicantTypes", (o) => o.applicantTypes),
  };
}

const SORTERS = {
  deadline: (a, b) => String(a.opp.deadline).localeCompare(String(b.opp.deadline)),
  "-deadline": (a, b) => String(b.opp.deadline).localeCompare(String(a.opp.deadline)),
  budget: (a, b) => (a.opp.fundingMax || 0) - (b.opp.fundingMax || 0),
  "-budget": (a, b) => (b.opp.fundingMax || 0) - (a.opp.fundingMax || 0),
  score: (a, b) => (a.score || 0) - (b.score || 0),
  "-score": (a, b) => (b.score || 0) - (a.score || 0),
  relevance: (a, b) => (b.relevance || 0) - (a.relevance || 0),
};

/**
 * Runs a full query: text + filters + optional per-company scoring.
 *
 * @param {object} index         from buildIndex
 * @param {object} query
 * @param {string} [query.q]     free text
 * @param {object} [query.filters]
 * @param {string} [query.sort]  one of SORTERS; defaults to relevance when a
 *                               text query is present, otherwise deadline
 * @param {number} [query.page]  1-based
 * @param {number} [query.pageSize]
 * @param {(opp:object)=>({score:number|null, blocked:boolean, elig:object})} [query.scorer]
 *                               supplied by the caller so search stays
 *                               independent of the scoring engine
 * @returns {{total:number, page:number, pageSize:number, results:object[], facets:object}}
 */
export function runSearch(index, query = {}) {
  const { q = "", filters = {}, page = 1, pageSize = 20, scorer = null } = query;

  const relevance = searchIndex(index, q);
  const hasText = Boolean(tokenize(q).length);

  let rows = [];
  index.docs.forEach((opp, docId) => {
    if (hasText && !relevance.has(docId)) return;
    if (!matchesFilters(opp, filters)) return;

    const row = { opp, relevance: relevance.get(docId) || 0 };
    if (scorer) {
      const res = scorer(opp);
      row.res = res;
      row.score = res?.score ?? null;
      row.blocked = Boolean(res?.blocked);
    }
    rows.push(row);
  });

  // Eligibility filters need the scorer's verdict, so they run after scoring.
  if (filters.eligibleOnly && scorer) rows = rows.filter((r) => !r.blocked);
  if (filters.minScore != null && scorer) rows = rows.filter((r) => (r.score ?? 0) >= Number(filters.minScore));

  const sortKey = query.sort || (hasText ? "relevance" : scorer ? "-score" : "deadline");
  const sorter = SORTERS[sortKey] || SORTERS.deadline;
  rows.sort((a, b) => {
    // Whatever the sort, a call the company cannot enter never outranks one it can.
    if (scorer && a.blocked !== b.blocked) return a.blocked ? 1 : -1;
    const primary = sorter(a, b);
    if (primary !== 0) return primary;
    return String(a.opp.deadline).localeCompare(String(b.opp.deadline));
  });

  const facets = computeFacets(rows.map((r) => r.opp));
  const total = rows.length;
  const start = Math.max(0, (Number(page) - 1) * Number(pageSize));
  const results = rows.slice(start, start + Number(pageSize));

  return { total, page: Number(page), pageSize: Number(pageSize), sort: sortKey, results, facets };
}
