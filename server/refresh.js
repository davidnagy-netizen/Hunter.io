/**
 * Catalog refresh.
 *
 * A hosted instance cannot depend on someone running the Python scrapers by
 * hand — calls open and close every week, and a stale catalog is worse than an
 * empty one because it looks authoritative. So the server refreshes itself.
 *
 * Three properties matter, and each is deliberate:
 *
 *   Never serve a half-built catalog. The new one is assembled completely, then
 *   swapped in with a single assignment. Requests in flight finish against the
 *   old one; the next request sees the new one.
 *
 *   Never lose the working catalog to a bad refresh. The portal times out, rate
 *   limits, and occasionally returns nothing at all. A refresh that fails or
 *   comes back suspiciously empty is discarded and the previous catalog keeps
 *   serving, with the error recorded.
 *
 *   Never leave a truncated file on disk. The catalog is written to a temporary
 *   file and renamed, which is atomic on every platform we target, so a crash
 *   mid-write cannot corrupt what the next boot loads.
 *
 * This uses the HTTP connector rather than the Python scrapers, so a deployment
 * needs only Node. The scrapers remain the way to seed and to pull the deep
 * Kohesio benchmark data, which changes far too slowly to be worth refetching
 * on a schedule.
 */

import fs from "node:fs";
import path from "node:path";

import { fetchLiveEuCalls, SEDIA } from "../src/connectors/euTendersConnector.js";
import { fetchEurHuf } from "../src/pipeline/buildCatalog.js";
import { OPPS as HU_NATIONAL_CALLS } from "../src/data/mockGrants.js";
import { adaptNationalCall } from "../src/pipeline/adaptNational.js";

/** A refresh returning fewer than this many calls is treated as a bad fetch. */
const SANITY_MINIMUM = 25;

const HOURS = 3600 * 1000;

export const DEFAULTS = {
  intervalMs: 6 * HOURS,
  maxRecords: 900,
  // The first retry after a failure; doubles up to `maxBackoffMs`.
  backoffMs: 5 * 60 * 1000,
  maxBackoffMs: 2 * HOURS,
  includeForthcoming: true,
  includeCurated: false,
};

function envInt(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function envBool(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

/** Reads the refresh configuration from the environment. */
export function configFromEnv() {
  return {
    enabled: envBool("HUNTER_AUTO_REFRESH", true),
    intervalMs: envInt("HUNTER_REFRESH_HOURS", 6) * HOURS,
    maxRecords: envInt("HUNTER_REFRESH_MAX_RECORDS", DEFAULTS.maxRecords),
    refreshOnBoot: envBool("HUNTER_REFRESH_ON_BOOT", false),
    includeForthcoming: envBool("HUNTER_INCLUDE_FORTHCOMING", DEFAULTS.includeForthcoming),
    // The nine hand-authored Hungarian entries are demonstration data. A hosted
    // instance shows real calls only unless it explicitly opts in.
    includeCurated: envBool("HUNTER_INCLUDE_CURATED", DEFAULTS.includeCurated),
    backoffMs: DEFAULTS.backoffMs,
    maxBackoffMs: DEFAULTS.maxBackoffMs,
  };
}

/**
 * Builds a fresh catalog from the live portal.
 *
 * @param {object} options
 * @param {string} options.today          reference date for expiry filtering
 * @param {object} [options.benchmarks]   carried over; not refetched
 * @param {object} [options.previousMeta] so build provenance survives a refresh
 * @returns {Promise<{catalog:object, report:object}>}
 */
export async function buildLiveCatalog(options = {}) {
  const cfg = { ...DEFAULTS, ...options };
  const today = options.today || new Date().toISOString().slice(0, 10);

  const fx = await fetchEurHuf(options.previousMeta?.eurHuf);

  const open = await fetchLiveEuCalls({
    status: SEDIA.STATUS_OPEN,
    maxRecords: cfg.maxRecords,
    today,
    eurHuf: fx.rate,
  });

  let forthcoming = { opportunities: [], report: { input: 0, kept: 0 }, totalResults: 0 };
  if (cfg.includeForthcoming) {
    forthcoming = await fetchLiveEuCalls({
      status: SEDIA.STATUS_FORTHCOMING,
      maxRecords: cfg.maxRecords,
      today,
      eurHuf: fx.rate,
    });
    forthcoming.opportunities.forEach((o) => {
      o.status = "forthcoming";
    });
  }

  const byId = new Map();
  for (const opp of open.opportunities) byId.set(opp.id, opp);
  for (const opp of forthcoming.opportunities) if (!byId.has(opp.id)) byId.set(opp.id, opp);

  if (cfg.includeCurated) {
    for (const call of HU_NATIONAL_CALLS) {
      const adapted = adaptNationalCall(call);
      if (adapted.deadline >= today) byId.set(adapted.id, adapted);
    }
  }

  const opportunities = [...byId.values()].sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)));

  const bySource = {};
  const byProgramme = {};
  for (const o of opportunities) {
    bySource[o.sourceSystem] = (bySource[o.sourceSystem] || 0) + 1;
    byProgramme[o.programShort] = (byProgramme[o.programShort] || 0) + 1;
  }

  const report = {
    open: open.report,
    forthcoming: forthcoming.report,
    portalTotalOpen: open.totalResults,
    portalTotalForthcoming: forthcoming.totalResults,
    curatedIncluded: cfg.includeCurated,
  };

  const catalog = {
    meta: {
      ...(options.previousMeta || {}),
      builtAt: new Date().toISOString(),
      builtBy: "live-refresh",
      referenceDate: today,
      eurHuf: fx.rate,
      eurHufSource: fx.source,
      eurHufFetchedAt: fx.fetchedAt,
      counts: {
        total: opportunities.length,
        open: opportunities.filter((o) => o.status === "open").length,
        forthcoming: opportunities.filter((o) => o.status === "forthcoming").length,
        bySource,
        byProgramme,
      },
      ingestion: report,
    },
    opportunities,
    benchmarks: options.benchmarks || null,
  };

  return { catalog, report };
}

/** Writes via a temporary file and renames, so a crash cannot truncate the target. */
export function writeCatalogAtomic(file, catalog) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(catalog), "utf8");
  fs.renameSync(tmp, file);
}

/**
 * Owns the refresh loop and its status.
 *
 * The caller supplies `apply`, which swaps the new catalog into the running
 * server. Everything the loop knows about the server is that one function.
 */
export class CatalogRefresher {
  /**
   * @param {object}   deps
   * @param {string}   deps.catalogFile
   * @param {() => object} deps.current      the catalog currently being served
   * @param {(catalog:object) => void} deps.apply
   * @param {() => string} [deps.today]
   * @param {object}   [deps.config]
   * @param {Console}  [deps.logger]
   */
  constructor({ catalogFile, current, apply, today, config, logger = console }) {
    this.catalogFile = catalogFile;
    this.current = current;
    this.apply = apply;
    this.today = today || (() => new Date().toISOString().slice(0, 10));
    this.config = { ...configFromEnv(), ...config };
    this.logger = logger;

    this.timer = null;
    this.running = false;
    this.consecutiveFailures = 0;
    this.status = {
      enabled: this.config.enabled,
      intervalHours: this.config.intervalMs / HOURS,
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastError: null,
      lastReport: null,
      nextRunAt: null,
      runs: 0,
      failures: 0,
    };
  }

  /**
   * Runs one refresh. Safe to call at any time; overlapping calls are refused
   * rather than queued, because two concurrent portal crawls help nobody.
   *
   * @returns {Promise<{ok:boolean, reason?:string, report?:object, total?:number}>}
   */
  async runOnce(reason = "manual") {
    if (this.running) return { ok: false, reason: "a refresh is already running" };
    this.running = true;
    this.status.lastAttemptAt = new Date().toISOString();
    this.status.runs += 1;

    const previous = this.current();
    try {
      const { catalog, report } = await buildLiveCatalog({
        today: this.today(),
        benchmarks: previous?.benchmarks || null,
        previousMeta: previous?.meta || null,
        maxRecords: this.config.maxRecords,
        includeForthcoming: this.config.includeForthcoming,
        includeCurated: this.config.includeCurated,
      });

      // A refresh that comes back nearly empty means the portal failed in a way
      // that did not raise — keep what we have rather than publishing a gap.
      const total = catalog.opportunities.length;
      const previousTotal = previous?.opportunities?.length || 0;
      if (total < SANITY_MINIMUM && previousTotal > total) {
        throw new Error(`refresh returned only ${total} calls (previous catalog has ${previousTotal}); discarding`);
      }

      catalog.meta.refreshReason = reason;
      writeCatalogAtomic(this.catalogFile, catalog);
      this.apply(catalog);

      this.consecutiveFailures = 0;
      this.status.lastSuccessAt = new Date().toISOString();
      this.status.lastError = null;
      this.status.lastReport = { total, ...report };
      this.logger.log(`[refresh] ${reason}: ${total} opportunities (${catalog.meta.counts.open} open)`);
      return { ok: true, report: this.status.lastReport, total };
    } catch (err) {
      this.consecutiveFailures += 1;
      this.status.failures += 1;
      this.status.lastError = { message: err.message, at: new Date().toISOString() };
      this.logger.error(`[refresh] ${reason} failed: ${err.message} — continuing to serve the existing catalog`);
      return { ok: false, reason: err.message };
    } finally {
      this.running = false;
    }
  }

  /** Delay before the next run: the interval, or a growing backoff after failures. */
  nextDelay() {
    if (!this.consecutiveFailures) return this.config.intervalMs;
    const backoff = this.config.backoffMs * 2 ** (this.consecutiveFailures - 1);
    return Math.min(backoff, this.config.maxBackoffMs);
  }

  start() {
    if (!this.config.enabled) {
      this.logger.log("[refresh] automatic refresh is disabled (HUNTER_AUTO_REFRESH=false)");
      return this;
    }
    if (this.config.refreshOnBoot) {
      this.runOnce("boot").finally(() => this.schedule());
    } else {
      this.schedule();
    }
    return this;
  }

  schedule() {
    if (this.timer) clearTimeout(this.timer);
    const delay = this.nextDelay();
    this.status.nextRunAt = new Date(Date.now() + delay).toISOString();
    this.timer = setTimeout(() => {
      this.runOnce("scheduled").finally(() => this.schedule());
    }, delay);
    // Do not hold the process open just for the next refresh.
    if (typeof this.timer.unref === "function") this.timer.unref();
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.status.nextRunAt = null;
  }
}
