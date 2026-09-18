/**
 * HUNTER API server.
 *
 * Dependency-free Node HTTP server. It loads the built catalog once, indexes it
 * for search, and answers every request from memory — the expensive work
 * (scraping, normalization, thematic classification) happens in the build step,
 * not per request.
 *
 * Build the catalog first:  npm run build:catalog
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { DEMO_PROFILE, REGIONS, INDUSTRIES, GOALS, REV_BANDS } from "../src/data/referenceData.js";
import { ORG_TYPES, FRAMEWORK_PROGRAMMES, ACTION_RULES } from "../src/data/programmes.js";
import { evaluateEligibility, daysToDeadline, openQuestions, ruleLabel } from "../src/engine/eligibility.js";
import { hunterScore, scoreBand, explainScore } from "../src/engine/scoring.js";
import { normalizeProfile, OPTIONAL_PROFILE_FIELDS } from "../src/engine/profile.js";
import { buildIndex, runSearch } from "../src/engine/search.js";
import { benchmarksFor } from "../src/pipeline/kohesioBenchmarks.js";
import { fetchLiveEuCalls } from "../src/connectors/euTendersConnector.js";
import { CatalogRefresher, configFromEnv } from "./refresh.js";
import { Store, isSubscriptionActive, subscriptionDaysLeft } from "./store.js";
import { createShutdown } from "./shutdown.js";
import { createRouter } from "./router.js";
import { config } from "./config.js";
import { registerHealthRoutes } from "./routes/healthRoutes.js";
import { registerAuthRoutes } from "./routes/authRoutes.js";
import { registerCatalogRoutes } from "./routes/catalogRoutes.js";
import { registerCrmRoutes } from "./routes/crmRoutes.js";
import { registerAdminRoutes } from "./routes/adminRoutes.js";
import {
  STAGES, STAGE_IDS, LIFECYCLES, LEAD_SOURCES, buildContact, buildLeadContact,
  buildTimeline, portfolioMetrics, signupTrend, filterContacts, contactsToCsv,
  priceList, validateLead, ENGAGEMENT_WINDOW_DAYS,
} from "./crm.js";
import {
  hashPassword, verifyPassword, parseCookies, sessionCookie, clearCookie,
  validateCredentials, entitlementsFor, publicUser, ensureAdmin, planById, PLANS,
  SESSION_TTL_MS, SESSION_COOKIE,
} from "./auth.js";

const ROOT_DIR = config.rootDir;
// Overridable so a test run — or a second instance — gets its own profile,
// answers and catalog instead of writing over the developer's.
const DATA_DIR = config.dataDir;
const DB_FILE = config.dbFile;
const CATALOG_FILE = config.catalogFile;
const STORE_FILE = config.storeFile;

fs.mkdirSync(DATA_DIR, { recursive: true });

// Catalog

/** In-memory catalog plus its search index, rebuilt whenever data changes. */
const catalogState = { meta: null, opportunities: [], benchmarks: null, index: null, byId: new Map() };

function indexCatalog(catalog) {
  catalogState.meta = catalog.meta || {};
  catalogState.opportunities = catalog.opportunities || [];
  catalogState.benchmarks = catalog.benchmarks || null;
  catalogState.index = buildIndex(catalogState.opportunities);
  catalogState.byId = new Map(catalogState.opportunities.map((o) => [o.id, o]));
}

function loadCatalog() {
  if (!fs.existsSync(CATALOG_FILE)) {
    console.warn(
      `No catalog at ${path.relative(ROOT_DIR, CATALOG_FILE)}. ` +
        "Run `npm run build:catalog` to ingest the scraped data — the API will serve an empty catalog until then."
    );
    indexCatalog({ meta: { empty: true }, opportunities: [], benchmarks: null });
    return;
  }
  indexCatalog(JSON.parse(fs.readFileSync(CATALOG_FILE, "utf8")));
}

/** Reference date for deadline arithmetic: today, or a pin for reproducibility. */
function referenceDate() {
  return config.today ? new Date(config.today) : new Date();
}

// User state
//
// There are no accounts, by design. That makes server-side storage of a company
// profile actively wrong once the app is hosted: a single db.json is shared by
// every visitor, so the second person to open the site would be shown the first
// person's company and scores.
//
// So the browser owns the profile — it already keeps one in localStorage — and
// sends it with each request. The server scores against what it is given and
// stores nothing. Setting HUNTER_PERSIST=1 restores the old single-user file,
// which is convenient when developing locally and unsafe anywhere else.

const PERSIST = config.persistProfile;

const EMPTY_DB = { profile: null, answers: {}, saved: [], lastEuSync: null };

function loadDb() {
  if (!PERSIST || !fs.existsSync(DB_FILE)) return { ...EMPTY_DB };
  try {
    return { ...EMPTY_DB, ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) };
  } catch {
    return { ...EMPTY_DB };
  }
}

function saveDb(db) {
  if (!PERSIST) return;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

/** Kept for the endpoints that still take a profile override directly. */
function activeProfile(db, override) {
  return normalizeProfile(override || db.profile || DEMO_PROFILE);
}

// Accounts

const store = new Store(STORE_FILE);
const adminSeed = ensureAdmin(store);

/** Resolves the signed-in user from the session cookie, or null. */
function currentUser(req) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  const session = store.getSession(token);
  if (!session) return null;
  const user = store.getUser(session.userId);
  if (!user || user.disabled) return null;
  // Sliding expiry: an account in daily use is not logged out mid-week.
  store.touchSession(token, SESSION_TTL_MS);
  return user;
}

/**
 * What an operator can file a note as. A phone call and a decision are
 * different things six weeks later, so the kind is recorded rather than left
 * to the prose.
 */
const NOTE_KINDS = ["note", "call", "email", "meeting", "decision"];

/** A CRM subject is either an account or a captured lead. */
function subjectExists(id) {
  return Boolean(id && (store.getUser(id) || store.getLead(id)));
}

/**
 * Every contact the console knows about, accounts and leads together, each one
 * assembled from what is actually recorded — the subscription, the activity log
 * and the operator's own record. Computed per request rather than cached: these
 * numbers are only useful if they are the current ones.
 */
function allContacts(now = referenceDate()) {
  const accounts = store.listUsers().map((user) =>
    buildContact(
      {
        user,
        crm: store.crmFor(user.id),
        activity: store.activity(user.id, 200),
        subLog: store.subscriptionLog(user.id),
        profileVersions: store.profileHistory(user.id).length,
      },
      now
    )
  );
  const leads = store.listLeads().map((lead) => buildLeadContact(lead, now));
  return [...accounts, ...leads];
}

const COOKIE_SECURE = config.secureCookie;

/**
 * The state to reason with, now that an account can own it.
 *
 * A signed-in user's profile lives on the server so it follows them between
 * devices; an anonymous visitor still supplies their own, exactly as before.
 * The request body can override either, which is what the onboarding wizard
 * does before the profile has been saved.
 */
function resolveState(req, db, body) {
  const user = currentUser(req);
  const base = user?.profile || db.profile || DEMO_PROFILE;
  const profile = normalizeProfile(body?.profile || base);
  const answers = { ...(user?.answers || {}), ...(db.answers || {}), ...(body?.answers || {}) };
  const saved = Array.isArray(body?.saved) ? body.saved : user?.saved || db.saved || [];
  return { user, profile, answers, saved, supplied: Boolean(body?.profile), entitlements: entitlementsFor(user) };
}

/**
 * The only shape a gated visitor ever sees.
 *
 * It answers "how good is this for me, and how much money is in it" and
 * nothing else. Everything that would let someone find the call without
 * paying is dropped rather than blanked: the title, the programme, the call
 * identifiers, the exact deadline and every link.
 *
 * The real id is withheld too — `eu-life-2026-cet-enerpov` names both the
 * programme and the topic, so censoring the programme field while shipping
 * the id would be theatre. `ref` is positional and carries no information.
 *
 * The deadline is reduced to a flag. A date is a fingerprint when combined
 * with a grant figure; "closing soon" still creates the urgency without
 * narrowing 600 calls down to one.
 */
function teaserCard(card, index, profile = null) {
  // The money figure that means something to a visitor is not the call's
  // ceiling — which is null on a fifth of the catalog — but what *they* would
  // receive: their own project value times this call's intensity. It is
  // derived from a number they typed in, so publishing it identifies nothing.
  const opp = card.id ? catalogState.byId.get(card.id) : null;
  const grantHuf = opp && profile?.investment_value ? fundingCalculator(opp, profile).grantHuf : null;

  return {
    ref: `t${index}`,
    locked: true,
    score: card.score ?? null,
    band: card.band ?? null,
    estimated: Boolean(card.estimated),
    grantHuf,
    fundingMax: card.fundingMax ?? null,
    intensity: card.intensity ?? null,
    closingSoon: Number.isFinite(card.daysLeft) && card.daysLeft <= 30,
  };
}

/**
 * Applies the subscription gate to a result set.
 *
 * Enforced here rather than in the browser: the count stays honest so the
 * value is visible, but without a subscription every row comes back as a
 * teaser. There is no free allowance of whole cards — a visitor sees how many
 * matches they have and what they are worth, never which ones they are.
 */
function gateResults(cards, entitlements, profile = null) {
  if (entitlements.maxResults === Infinity) return { results: cards, lockedCount: 0 };
  const visible = cards.slice(0, entitlements.maxResults);
  const locked = cards.slice(entitlements.maxResults).map((card, i) => teaserCard(card, i, profile));
  return { results: [...visible, ...locked], lockedCount: locked.length };
}

/**
 * Strips a detail response down to what a gated visitor may see.
 *
 * Same rule as the cards: the score and the money survive, the identity does
 * not. Without this a free account could read a call's name straight off the
 * detail endpoint by guessing an id.
 */
function gateDetail(detail, entitlements) {
  if (entitlements.explanations) return detail;
  return {
    ...detail,
    id: null,
    locked: true,
    title: null,
    program: null,
    programShort: null,
    actionCode: null,
    actionLabel: null,
    callId: null,
    sourceRef: null,
    sourceSystem: null,
    summary: null,
    description: "",
    deadline: null,
    daysLeft: null,
    closingSoon: Number.isFinite(detail.daysLeft) && detail.daysLeft <= 30,
    goals: [],
    sectors: [],
    applicantTypes: [],
    factors: [],
    checks: [],
    conditions: [],
    questions: [],
    benchmark: null,
    calculator: null,
    docs: [],
    submissionUrl: null,
    sourceUrl: entitlements.applyLinks ? detail.sourceUrl : null,
  };
}

// Presentation helpers

/**
 * Trims an opportunity to what a result card needs. The full description is
 * several kilobytes; sending 600 of them would make the list endpoint useless.
 */
function toCard(opp, res, lang) {
  const band = res && res.score != null ? scoreBand(res.score) : null;
  return {
    id: opp.id,
    title: opp.title,
    program: opp.program,
    programShort: opp.programShort,
    actionCode: opp.actionCode,
    actionLabel: opp.actionLabel,
    callId: opp.callId,
    sourceRef: opp.sourceRef,
    sourceUrl: opp.sourceUrl,
    submissionUrl: opp.submissionUrl,
    sourceSystem: opp.sourceSystem,
    curated: opp.curated === true,
    status: opp.status,
    deadline: opp.deadline,
    daysLeft: daysToDeadline(opp, referenceDate()),
    summary: (opp.summary || opp.description || "").slice(0, 260),
    goals: opp.goals || [],
    sectors: opp.sectors || [],
    intensity: opp.intensity,
    fundingMin: opp.fundingMin,
    fundingMax: opp.fundingMax,
    budget: opp.budget,
    consortium: opp.consortium,
    applicantTypes: opp.applicantTypes,
    awardsFunding: opp.awardsFunding,
    highAdmin: opp.highAdmin,
    score: res ? res.score : null,
    blocked: res ? res.blocked : false,
    estimated: res ? res.estimated : false,
    verdict: res ? res.elig.status : null,
    band: band ? { key: band.key, label: lang === "en" ? band.lbl_en : band.lbl_hu } : null,
    blockedReasons: res && res.blocked
      ? res.elig.checks.filter((c) => c.status === "fail").map((c) => ruleLabel(c.rule, lang))
      : [],
  };
}

/** Everything the detail view needs, assembled in one response. */
function toDetail(opp, profile, answers, lang) {
  const ref = referenceDate();
  const res = hunterScore(opp, profile, answers, ref);
  const band = res.score != null ? scoreBand(res.score) : null;

  const checks = res.elig.checks.map((c) => ({
    field: c.rule.field,
    label: ruleLabel(c.rule, lang),
    status: c.status,
    yourValue: c.value === undefined ? null : c.value,
    required: c.rule.value,
    operator: c.rule.op,
  }));

  return {
    ...opp,
    daysLeft: res.elig.days,
    score: res.score,
    blocked: res.blocked,
    estimated: res.estimated,
    verdict: res.elig.status,
    band: band ? { key: band.key, label: lang === "en" ? band.lbl_en : band.lbl_hu } : null,
    checks,
    conditions: res.elig.conditions.map((c) => (lang === "en" ? c.text_en : c.text_hu)),
    factors: explainScore(opp, profile, res, lang),
    questions: openQuestions(res.elig, lang).filter((q) => q.question),
    benchmark: benchmarksFor(catalogState.benchmarks, opp),
    calculator: fundingCalculator(opp, profile),
  };
}

/**
 * Grant arithmetic for the detail view: what this company would actually
 * receive and have to put in, capped by the call's own ceiling.
 */
function fundingCalculator(opp, profile) {
  const projectValue = profile?.investment_value || 0;
  const rate = opp.intensity ?? 0;

  // On a consortium call the ceiling that binds this company is its own share
  // of the grant, not the whole project grant.
  const ceiling = opp.partnerShare ? opp.partnerShare.maxHuf : (opp.fundingMax ?? null);
  const uncapped = projectValue * rate;
  const grant = ceiling != null ? Math.min(uncapped, ceiling) : uncapped;

  return {
    projectValueHuf: projectValue,
    intensity: rate,
    grantHuf: Math.round(grant),
    ownContributionHuf: Math.round(projectValue - grant),
    cappedByCeiling: ceiling != null && uncapped > ceiling,
    ceilingHuf: ceiling,
    partnerShare: opp.partnerShare || null,
    callGrantHuf: opp.fundingMax ?? opp.fundingMin ?? null,
    currencyNote: opp.currency === "EUR" ? `Converted at ${opp.eurHuf || catalogState.meta?.eurHuf} HUF/EUR` : null,
  };
}

// Request plumbing

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/** Below this, compressing costs more than it saves. */
const COMPRESS_ABOVE_BYTES = 1024;

/**
 * Writes a response, gzipping when the client accepts it.
 *
 * The catalog endpoint sends well over a megabyte of JSON and compresses to
 * roughly a tenth of that, which is the difference between a snappy first load
 * and a visible wait on a normal connection.
 */
function sendBuffer(req, res, status, body, contentType) {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");
  const headers = { "Content-Type": contentType };

  const acceptsGzip = /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  if (acceptsGzip && buffer.length > COMPRESS_ABOVE_BYTES) {
    zlib.gzip(buffer, (err, gzipped) => {
      if (err) {
        res.writeHead(status, { ...headers, "Content-Length": buffer.length });
        return res.end(buffer);
      }
      res.writeHead(status, { ...headers, "Content-Encoding": "gzip", "Content-Length": gzipped.length, Vary: "Accept-Encoding" });
      res.end(gzipped);
    });
    return;
  }

  res.writeHead(status, { ...headers, "Content-Length": buffer.length });
  res.end(buffer);
}

function send(req, res, status, payload) {
  sendBuffer(req, res, status, JSON.stringify(payload), "application/json; charset=utf-8");
}

async function readBody(req) {
  if (req.body !== undefined) return req.body;
  if (req.method !== "POST" && req.method !== "PUT") return (req.body = null);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return (req.body = null);
  try {
    return (req.body = JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch {
    return (req.body = null);
  }
}

/** Repeated or comma-separated query params both become arrays. */
function listParam(params, name) {
  const all = params.getAll(name).flatMap((v) => String(v).split(",")).map((v) => v.trim()).filter(Boolean);
  return all.length ? all : undefined;
}

function numParam(params, name) {
  const v = params.get(name);
  if (v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseFilters(params) {
  const filters = {
    program: listParam(params, "program"),
    actionCode: listParam(params, "actionCode"),
    goals: listParam(params, "goals"),
    sectors: listParam(params, "sectors"),
    orgType: listParam(params, "orgType"),
    consortium: params.get("consortium") || undefined,
    deadlineFrom: params.get("deadlineFrom") || undefined,
    deadlineTo: params.get("deadlineTo") || undefined,
    budgetMin: numParam(params, "budgetMin"),
    budgetMax: numParam(params, "budgetMax"),
    minIntensity: numParam(params, "minIntensity"),
    minScore: numParam(params, "minScore"),
    eligibleOnly: params.get("eligibleOnly") === "true",
    awardsFunding: params.get("awardsFunding") !== "false",
  };
  for (const k of Object.keys(filters)) if (filters[k] === undefined) delete filters[k];
  return filters;
}

// Static files

const PUBLIC_DIR = config.publicDir;
const INDEX_FILE = path.join(PUBLIC_DIR, "index.html");
const apiRouter = createRouter();

/**
 * Serves the app.
 *
 * The project root is not a web root: it holds the source, the tests, the raw
 * scrapes and server/data/db.json with the user's own profile. So rather than
 * mapping request paths onto the repository, only the app shell and an explicit
 * public/ folder are reachable, and everything else falls through to the shell
 * the way a single-page app expects.
 */
function serveStatic(req, res, pathname) {
  const sendFile = (file) => {
    fs.readFile(file, (err, content) => {
      if (err) {
        res.writeHead(500);
        return res.end("Server error loading file");
      }
      sendBuffer(req, res, 200, content, MIME_TYPES[path.extname(file).toLowerCase()] || "text/plain; charset=utf-8");
    });
  };

  const relative = pathname.replace(/^\/+/, "");
  if (relative && relative !== "index.html") {
    // Percent-encoding is decoded here so an encoded "../" is caught by the
    // containment check below rather than slipping through as a literal name.
    let decoded;
    try {
      decoded = decodeURIComponent(relative);
    } catch {
      decoded = relative;
    }
    const candidate = path.resolve(PUBLIC_DIR, decoded);
    if (
      candidate.startsWith(PUBLIC_DIR + path.sep) &&
      fs.existsSync(candidate) &&
      fs.statSync(candidate).isFile()
    ) {
      return sendFile(candidate);
    }
  }

  return sendFile(INDEX_FILE);
}


const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (url.pathname.startsWith("/api/")) {
    const release = shutdown.enter();
    if (!release) return send(req, res, 503, { error: "Server is shutting down; retry shortly." });
    try {
      if (await apiRouter.dispatch(req, res, url, { store })) return;
      return send(req, res, 404, { error: `No route for ${req.method} ${url.pathname}` });
    } catch (err) {
      console.error(`${req.method} ${url.pathname} failed:`, err);
      return send(req, res, 500, { error: err.message });
    } finally {
      release();
    }
  }

  return serveStatic(req, res, url.pathname);
});

loadCatalog();

// The refresher keeps the catalog current on a hosted instance. It writes the
// same file the build step writes, so the two are interchangeable and a restart
// picks up whichever ran last.
const refreshConfig = configFromEnv();
const refresher = new CatalogRefresher({
  catalogFile: CATALOG_FILE,
  current: () => ({ meta: catalogState.meta, opportunities: catalogState.opportunities, benchmarks: catalogState.benchmarks }),
  apply: (catalog) => indexCatalog(catalog),
  today: () => referenceDate().toISOString().slice(0, 10),
  config: refreshConfig,
});

const PORT = config.port;
server.listen(PORT, () => {
  console.log(`HUNTER API listening on http://localhost:${PORT}`);
  console.log(`  catalog : ${catalogState.opportunities.length} opportunities (built ${catalogState.meta?.builtAt || "—"})`);
  console.log(`  storage : profile ${PERSIST ? "persisted server-side (single user)" : "held by the browser (stateless)"}`);
  console.log(
    refreshConfig.enabled
      ? `  refresh : every ${refreshConfig.intervalMs / 3600000}h${refreshConfig.refreshOnBoot ? ", starting now" : ""}`
      : "  refresh : disabled"
  );
  const s = store.stats();
  console.log(`  accounts: ${s.users} (${s.admins} admin, ${s.activeSubscriptions} with an active subscription)`);
  if (adminSeed.usingDefaultPassword) {
    console.log(`  ⚠  administrator "${adminSeed.username}" still uses the default password — set HUNTER_ADMIN_PASSWORD before going public`);
  }
  refresher.start();
  // Expired sessions accumulate otherwise; hourly is far more often than needed.
  const sweeper = setInterval(() => {
    if (!shutdown.stopping) store.purgeExpiredSessions();
  }, 3600 * 1000);
  if (typeof sweeper.unref === "function") sweeper.unref();
});

const shutdown = createShutdown({
  flush: () => store.flush(),
  close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  exit: () => process.exit(0),
  pause: () => refresher.stop(),
  resume: () => refresher.start(),
  report: (operation, code) => console.error(`[server] ${operation} ${code}`),
});
registerHealthRoutes(apiRouter, {
  catalogState,
  referenceDate,
  send,
  refresher,
  persistProfile: PERSIST,
});
registerAuthRoutes(apiRouter, {
  store,
  send,
  readBody,
  currentUser,
  publicUser,
  entitlementsFor,
  validateCredentials,
  hashPassword,
  verifyPassword,
  parseCookies,
  sessionCookie,
  clearCookie,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  COOKIE_SECURE,
  PLANS,
  adminSeed,
  normalizeProfile,
  DEMO_PROFILE,
  EMPTY_DB,
  loadDb,
  saveDb,
});
registerCatalogRoutes(apiRouter, {
  catalogState,
  referenceDate,
  send,
  readBody,
  resolveState,
  hunterScore,
  daysToDeadline,
  toCard,
  toDetail,
  fundingCalculator,
  gateResults,
  gateDetail,
  teaserCard,
  runSearch,
  parseFilters,
  numParam,
  store,
  loadDb,
  saveDb,
  refresher,
  PERSIST,
  fetchLiveEuCalls,
  indexCatalog,
  CATALOG_FILE,
  ACTION_RULES,
  FRAMEWORK_PROGRAMMES,
  REGIONS,
  INDUSTRIES,
  GOALS,
  REV_BANDS,
  ORG_TYPES,
  OPTIONAL_PROFILE_FIELDS,
  fs,
});
registerCrmRoutes(apiRouter, {
  store,
  catalogState,
  referenceDate,
  send,
  sendBuffer,
  readBody,
  currentUser,
  validateLead,
  hunterScore,
  daysToDeadline,
  allContacts,
  buildContact,
  buildLeadContact,
  buildTimeline,
  portfolioMetrics,
  signupTrend,
  filterContacts,
  contactsToCsv,
  subjectExists,
  numParam,
  STAGES,
  STAGE_IDS,
  LIFECYCLES,
  LEAD_SOURCES,
  PLANS,
  priceList,
  NOTE_KINDS,
  ENGAGEMENT_WINDOW_DAYS,
});
registerAdminRoutes(apiRouter, {
  store,
  catalogState,
  currentUser,
  publicUser,
  send,
  readBody,
  isSubscriptionActive,
  subscriptionDaysLeft,
  planById,
  PLANS,
  refresher,
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => { void shutdown.shutdown(); });
}

export { server, catalogState, refresher, store };
