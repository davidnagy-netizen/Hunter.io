/**
 * Live connector to the EU Funding & Tenders Opportunities Portal.
 *
 * The portal's front end is a single-page app over the Commission's SEDIA
 * search service, so this talks to that service directly rather than scraping
 * markup. The request is multipart/form-data — a JSON body is rejected with a
 * 400 — and the filter itself is an Elasticsearch boolean query.
 *
 * The catalog is normally built offline by src/pipeline/buildCatalog.js from
 * the Python scrapers' output. This connector is what keeps it fresh at
 * runtime: same normalization, same shape, straight into the running index.
 */

import { normalizeEuBatch } from "../pipeline/normalizeEu.js";

const SEARCH_URL = "https://api.tech.ec.europa.eu/search-api/prod/rest/search";
const API_KEY = "SEDIA";

/** SEDIA internal codes. */
export const SEDIA = {
  TYPE_GRANTS: "1",
  TYPE_TENDERS: "0",
  STATUS_FORTHCOMING: "31094501",
  STATUS_OPEN: "31094502",
  STATUS_CLOSED: "31094503",
};

function buildQuery({ type = SEDIA.TYPE_GRANTS, status = SEDIA.STATUS_OPEN, keywords = null, period = null } = {}) {
  const must = [{ terms: { type: [type] } }];
  if (status) must.push({ terms: { status: [status] } });
  if (period) must.push({ terms: { programmePeriod: [period] } });
  if (keywords) {
    must.push({
      multi_match: {
        query: keywords,
        fields: ["title^2", "summary^2", "description", "keywords", "identifier"],
      },
    });
  }
  return { bool: { must } };
}

/**
 * Fetches one page of raw SEDIA records.
 * @returns {Promise<{records:object[], totalResults:number}>}
 */
export async function fetchRawPage({ pageNumber = 1, pageSize = 100, timeoutMs = 45000, ...filters } = {}) {
  const form = new FormData();
  form.append("query", new Blob([JSON.stringify(buildQuery(filters))], { type: "application/json" }));
  form.append("languages", new Blob([JSON.stringify(["en"])], { type: "application/json" }));
  form.append("sort", new Blob([JSON.stringify({ field: "sortStatus", order: "ASC" })], { type: "application/json" }));

  const url = new URL(SEARCH_URL);
  url.searchParams.set("apiKey", API_KEY);
  url.searchParams.set("text", filters.keywords || "***");
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("pageNumber", String(pageNumber));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "POST", body: form, signal: controller.signal });
    if (!res.ok) throw new Error(`SEDIA search returned HTTP ${res.status}`);
    const data = await res.json();
    return { records: data.results || [], totalResults: data.totalResults || 0 };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches and normalizes open calls, paging until `maxRecords` is reached.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.maxRecords=600]
 * @param {string}  [opts.status]      one of SEDIA.STATUS_*
 * @param {string}  [opts.keywords]
 * @param {string}  [opts.today]       reference date for expiry filtering
 * @param {number}  [opts.eurHuf]
 * @returns {Promise<{opportunities:object[], report:object, totalResults:number}>}
 */
export async function fetchLiveEuCalls(opts = {}) {
  const { maxRecords = 600, pageSize = 100, delayMs = 300, ...filters } = opts;

  const raw = [];
  let totalResults = 0;
  let page = 1;

  while (raw.length < maxRecords) {
    const { records, totalResults: total } = await fetchRawPage({ ...filters, pageNumber: page, pageSize });
    totalResults = total;
    if (!records.length) break;
    raw.push(...records);
    if (raw.length >= total) break;
    page += 1;
    // The service rate-limits aggressive paging; a short pause avoids 429s.
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  }

  const { opportunities, report } = normalizeEuBatch(raw.slice(0, maxRecords), {
    today: opts.today,
    eurHuf: opts.eurHuf,
  });

  return { opportunities, report, totalResults };
}
