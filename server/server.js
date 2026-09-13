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
import { fileURLToPath } from "node:url";
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
// Overridable so a test run — or a second instance — gets its own profile,
// answers and catalog instead of writing over the developer's.
const DATA_DIR = process.env.HUNTER_DATA_DIR
  ? path.resolve(process.env.HUNTER_DATA_DIR)
  : path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const CATALOG_FILE = path.join(DATA_DIR, "catalog.json");
const STORE_FILE = path.join(DATA_DIR, "users.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

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
  return process.env.HUNTER_TODAY ? new Date(process.env.HUNTER_TODAY) : new Date();
}

// ---------------------------------------------------------------------------
// User state
// ---------------------------------------------------------------------------
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

const PERSIST = process.env.HUNTER_PERSIST === "1" || process.env.HUNTER_PERSIST === "true";

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

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

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

const COOKIE_SECURE = process.env.HUNTER_SECURE_COOKIE === "1" || process.env.HUNTER_SECURE_COOKIE === "true";

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

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Request plumbing
// ---------------------------------------------------------------------------

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
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
  if (req.method !== "POST" && req.method !== "PUT") return null;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return null;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
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

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

async function handleApi(req, res, url) {
  const { pathname, searchParams } = url;
  const method = req.method;
  const lang = searchParams.get("lang") === "en" ? "en" : "hu";
  const db = loadDb();
  const body = await readBody(req);

  // -- authentication ------------------------------------------------------

  // -- lead capture (public) -----------------------------------------------
  //
  // The free assessment is the top of the funnel and until now it produced
  // nothing anybody could follow up: a visitor answered six questions, saw a
  // score and left without a trace. This records the ones who ask to be
  // contacted — with their consent, and with the answers they actually gave, so
  // the first sales call starts from their real situation rather than a blank.

  if (pathname === "/api/leads" && method === "POST") {
    const checked = validateLead(body);
    if (checked.error) return send(req, res, 400, { error: checked.error, code: checked.code });

    // The assessment screen no longer knows which calls matched — it is shown
    // censored rows — so it cannot send the ids any more. They are worth
    // keeping for the sales call, so the server works them out from the
    // profile the visitor just filled in instead of losing them.
    if (!checked.lead.matchIds.length && checked.lead.profile) {
      const ref = referenceDate();
      checked.lead.matchIds = catalogState.opportunities
        .filter((o) => o.status === "open" && daysToDeadline(o, ref) > 0 && o.awardsFunding !== false)
        .map((opp) => ({ opp, res: hunterScore(opp, checked.lead.profile, {}, ref) }))
        .filter((x) => !x.res.blocked)
        .sort((a, b) => (b.res.score || 0) - (a.res.score || 0))
        .slice(0, 5)
        .map((x) => x.opp.id);
    }

    // A second submission from the same address updates the first rather than
    // creating a duplicate to call twice.
    const existing = store.findLeadByEmail(checked.lead.email);
    if (existing) {
      store.updateLead(existing.id, {
        company: checked.lead.company || existing.company,
        contactName: checked.lead.contactName || existing.contactName,
        phone: checked.lead.phone || existing.phone,
        note: checked.lead.note || existing.note,
        readiness: checked.lead.readiness ?? existing.readiness,
        answers: checked.lead.answers || existing.answers,
        profile: checked.lead.profile || existing.profile,
        matchIds: checked.lead.matchIds.length ? checked.lead.matchIds : existing.matchIds,
      });
      return send(req, res, 200, { success: true, id: existing.id, updated: true });
    }

    const lead = store.createLead({ ...checked.lead, userAgent: req.headers["user-agent"] || null });
    return send(req, res, 201, { success: true, id: lead.id, updated: false });
  }

  if (pathname === "/api/auth/register" && method === "POST") {
    const { username, password, email, company } = body || {};
    const problem = validateCredentials(username, password);
    if (problem) return send(req, res, 400, { error: problem.message, code: problem.code });
    if (store.findByUsername(username)) {
      return send(req, res, 409, { error: "Ez a felhasználónév már foglalt.", code: "USERNAME_TAKEN" });
    }
    const { salt, passwordHash } = hashPassword(String(password));
    const user = store.createUser({ username: String(username).trim(), email, company, passwordHash, salt });
    store.recordActivity(user.id, "account.created", { username: user.username });

    // If this address already left a lead behind, the conversation that was
    // recorded against it belongs to the account now — notes and follow-ups
    // move across rather than being stranded on a record nobody looks at again.
    const priorLead = email ? store.findLeadByEmail(email) : null;
    if (priorLead) {
      store.convertLead(priorLead.id, user.id);
      store.updateCrm(user.id, { source: priorLead.source || "assessment" });
      store.recordActivity(user.id, "crm.lead_converted", { leadId: priorLead.id });
    } else {
      store.updateCrm(user.id, { source: "signup" });
    }

    const token = store.createSession(user.id, SESSION_TTL_MS, { userAgent: req.headers["user-agent"] });
    store.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    res.setHeader("Set-Cookie", sessionCookie(token, { secure: COOKIE_SECURE }));
    return send(req, res, 201, { success: true, user: publicUser(store.getUser(user.id)) });
  }

  if (pathname === "/api/auth/login" && method === "POST") {
    const { username, password } = body || {};
    const user = store.findByUsername(username);
    // The same message either way, so the response cannot be used to discover
    // which usernames exist.
    const failure = { error: "Hibás felhasználónév vagy jelszó.", code: "BAD_CREDENTIALS" };
    if (!user || !verifyPassword(String(password || ""), user.salt, user.passwordHash)) {
      return send(req, res, 401, failure);
    }
    if (user.disabled) return send(req, res, 403, { error: "Ezt a fiókot letiltották.", code: "ACCOUNT_DISABLED" });

    const token = store.createSession(user.id, SESSION_TTL_MS, { userAgent: req.headers["user-agent"] });
    store.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    store.recordActivity(user.id, "account.login", {});
    res.setHeader("Set-Cookie", sessionCookie(token, { secure: COOKIE_SECURE }));
    return send(req, res, 200, { success: true, user: publicUser(store.getUser(user.id)) });
  }

  if (pathname === "/api/auth/logout" && method === "POST") {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) store.destroySession(token);
    res.setHeader("Set-Cookie", clearCookie());
    return send(req, res, 200, { success: true });
  }

  if (pathname === "/api/auth/me" && method === "GET") {
    const user = currentUser(req);
    return send(req, res, 200, {
      user: publicUser(user),
      entitlements: entitlementsFor(user),
      plans: PLANS,
      adminSeed: { usingDefaultPassword: adminSeed.usingDefaultPassword, username: adminSeed.username },
    });
  }

  if (pathname === "/api/auth/password" && method === "POST") {
    const user = currentUser(req);
    if (!user) return send(req, res, 401, { error: "Bejelentkezés szükséges.", code: "LOGIN_REQUIRED" });
    const { current, next } = body || {};
    if (!verifyPassword(String(current || ""), user.salt, user.passwordHash)) {
      return send(req, res, 403, { error: "A jelenlegi jelszó nem megfelelő.", code: "WRONG_PASSWORD" });
    }
    const problem = validateCredentials(user.username, next);
    if (problem) return send(req, res, 400, { error: problem.message, code: problem.code });
    const { salt, passwordHash } = hashPassword(String(next));
    store.updateUser(user.id, { salt, passwordHash });
    store.recordActivity(user.id, "account.password_changed", {});
    return send(req, res, 200, { success: true });
  }

  // -- profile history -----------------------------------------------------

  if (pathname === "/api/profile/history" && method === "GET") {
    const user = currentUser(req);
    if (!user) return send(req, res, 401, { error: "Bejelentkezés szükséges.", code: "LOGIN_REQUIRED" });
    return send(req, res, 200, {
      current: user.profile || null,
      versions: store.profileHistory(user.id),
      activity: store.activity(user.id, 40),
    });
  }

  if (pathname === "/api/profile/restore" && method === "POST") {
    const user = currentUser(req);
    if (!user) return send(req, res, 401, { error: "Bejelentkezés szükséges.", code: "LOGIN_REQUIRED" });
    const version = Number(body?.version);
    const entry = store.profileHistory(user.id).find((v) => v.version === version);
    if (!entry) return send(req, res, 404, { error: `Nincs ilyen mentett verzió: ${version}`, code: "NO_SUCH_VERSION" });

    const profile = normalizeProfile(entry.profile);
    store.updateUser(user.id, { profile });
    store.recordProfile(user.id, profile, `restored from v${version}`);
    store.recordActivity(user.id, "profile.restored", { version });
    return send(req, res, 200, { success: true, profile, versions: store.profileHistory(user.id) });
  }

  // -- administration ------------------------------------------------------

  if (pathname.startsWith("/api/admin/")) {
    const admin = currentUser(req);
    if (!admin) return send(req, res, 401, { error: "Bejelentkezés szükséges.", code: "LOGIN_REQUIRED" });
    if (admin.role !== "admin") return send(req, res, 403, { error: "Adminisztrátori jogosultság szükséges.", code: "ADMIN_REQUIRED" });

    // The operations view: what needs attention today, not just a list of rows.
    if (pathname === "/api/admin/overview" && method === "GET") {
      const now = Date.now();
      const users = store.listUsers();
      const day = 86400000;

      const withSub = users.map((u) => ({
        user: publicUser(u),
        active: isSubscriptionActive(u.subscription),
        daysLeft: subscriptionDaysLeft(u.subscription),
      }));

      const byPlan = {};
      for (const row of withSub) {
        if (!row.active) continue;
        const plan = row.user.subscription.plan || "—";
        byPlan[plan] = (byPlan[plan] || 0) + 1;
      }

      return send(req, res, 200, {
        stats: {
          users: users.length,
          admins: users.filter((u) => u.role === "admin").length,
          disabled: users.filter((u) => u.disabled).length,
          activeSubscriptions: withSub.filter((r) => r.active).length,
          withoutSubscription: withSub.filter((r) => !r.active && r.user.role !== "admin").length,
          newThisWeek: users.filter((u) => now - new Date(u.createdAt).getTime() < 7 * day).length,
          sessions: store.stats().sessions,
          profilesSaved: users.filter((u) => u.profile).length,
        },
        byPlan,
        // Sorted by urgency: these are the accounts an admin has to act on.
        expiringSoon: withSub
          .filter((r) => r.active && r.daysLeft !== null && r.daysLeft <= 14)
          .sort((a, b) => a.daysLeft - b.daysLeft)
          .map((r) => ({ ...r.user, daysLeft: r.daysLeft })),
        awaitingAccess: withSub
          .filter((r) => !r.active && r.user.role !== "admin")
          .sort((a, b) => String(b.user.createdAt).localeCompare(String(a.user.createdAt)))
          .slice(0, 8)
          .map((r) => r.user),
        recentSignups: users
          .slice()
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
          .slice(0, 6)
          .map(publicUser),
        activity: store.recentActivity(20),
        plans: PLANS,
        system: {
          catalogTotal: catalogState.opportunities.length,
          catalogOpen: catalogState.opportunities.filter((o) => o.status === "open").length,
          builtAt: catalogState.meta?.builtAt || null,
          builtBy: catalogState.meta?.builtBy || "build step",
          eurHuf: catalogState.meta?.eurHuf || null,
          refresh: refresher ? refresher.status : { enabled: false },
        },
      });
    }

    if (pathname === "/api/admin/users" && method === "GET") {
      return send(req, res, 200, {
        stats: store.stats(),
        plans: PLANS,
        users: store.listUsers().map((u) => ({
          ...publicUser(u),
          profileVersions: store.profileHistory(u.id).length,
          lastActivity: store.activity(u.id, 1)[0] || null,
        })),
      });
    }

    // Access is granted by hand until the Hungarian payment gateway is wired up.
    if (pathname === "/api/admin/subscription" && method === "POST") {
      const { userId, planId, days, note, revoke } = body || {};
      const target = store.getUser(userId);
      if (!target) return send(req, res, 404, { error: "Nincs ilyen felhasználó.", code: "NO_SUCH_USER" });

      if (revoke) {
        const subscription = { status: "none", plan: null, validUntil: null, grantedBy: admin.username, grantedAt: new Date().toISOString(), note: note || null };
        store.updateUser(target.id, { subscription });
        store.recordSubscription(target.id, { action: "revoked", by: admin.username, note: note || null });
        store.recordActivity(target.id, "subscription.revoked", { by: admin.username });
        return send(req, res, 200, { success: true, user: publicUser(store.getUser(target.id)) });
      }

      const plan = planById(planId);
      if (!plan) return send(req, res, 400, { error: `Ismeretlen csomag: ${planId}`, code: "UNKNOWN_PLAN" });
      const grantDays = Number.isFinite(Number(days)) && Number(days) > 0 ? Number(days) : plan.days;

      // Extending an active subscription adds to what is left rather than
      // throwing away the remainder.
      const existing = target.subscription;
      const from = isSubscriptionActive(existing) && existing.validUntil ? new Date(existing.validUntil) : new Date();
      const validUntil = new Date(from.getTime() + grantDays * 86400000).toISOString();

      const subscription = {
        status: plan.status,
        plan: plan.id,
        validUntil,
        grantedBy: admin.username,
        grantedAt: new Date().toISOString(),
        note: note || null,
      };
      store.updateUser(target.id, { subscription });
      store.recordSubscription(target.id, { action: "granted", by: admin.username, plan: plan.id, days: grantDays, validUntil, note: note || null });
      store.recordActivity(target.id, "subscription.granted", { plan: plan.id, days: grantDays, by: admin.username });
      return send(req, res, 200, { success: true, user: publicUser(store.getUser(target.id)) });
    }

    if (pathname === "/api/admin/user" && method === "POST") {
      const { userId, disabled, role } = body || {};
      const target = store.getUser(userId);
      if (!target) return send(req, res, 404, { error: "Nincs ilyen felhasználó.", code: "NO_SUCH_USER" });
      if (target.id === admin.id && (disabled === true || role === "user")) {
        return send(req, res, 400, { error: "Saját adminisztrátori hozzáférésedet nem vonhatod vissza.", code: "CANNOT_DEMOTE_SELF" });
      }
      const patch = {};
      if (disabled !== undefined) patch.disabled = Boolean(disabled);
      if (role === "admin" || role === "user") patch.role = role;
      store.updateUser(target.id, patch);
      if (patch.disabled) store.destroyUserSessions(target.id);
      store.recordActivity(target.id, "account.updated", { by: admin.username, ...patch });
      return send(req, res, 200, { success: true, user: publicUser(store.getUser(target.id)) });
    }

    if (pathname === "/api/admin/history" && method === "GET") {
      const userId = searchParams.get("userId");
      const target = store.getUser(userId);
      if (!target) return send(req, res, 404, { error: "Nincs ilyen felhasználó.", code: "NO_SUCH_USER" });
      return send(req, res, 200, {
        user: publicUser(target),
        versions: store.profileHistory(target.id),
        subscriptions: store.subscriptionLog(target.id),
        activity: store.activity(target.id, 60),
      });
    }

    // -- CRM ---------------------------------------------------------------
    //
    // The console's first three screens answer "who is waiting". These answer
    // the rest of the job: who to call, what they are worth, what was said.
    // Every figure below is computed from the account, its activity log and its
    // subscription log at request time — nothing is stored pre-computed, so the
    // console cannot show a number that has drifted away from the truth.

    if (pathname === "/api/admin/crm" && method === "GET") {
      const now = referenceDate();
      const contacts = allContacts(now);
      const subscriptionLogs = {};
      for (const c of contacts) if (c.kind === "account") subscriptionLogs[c.id] = store.subscriptionLog(c.id);

      const metrics = portfolioMetrics(contacts, { subscriptionLogs, now });
      const board = {};
      for (const id of STAGE_IDS) board[id] = [];
      for (const c of contacts) {
        if (c.role === "admin") continue;
        (board[c.stage] = board[c.stage] || []).push(c);
      }
      // Inside a column the record that has waited longest comes first — a board
      // sorted by arrival hides exactly what is going stale.
      for (const id of Object.keys(board)) board[id].sort((a, b) => (b.daysInStage ?? 0) - (a.daysInStage ?? 0));

      return send(req, res, 200, {
        vocabulary: { stages: STAGES, lifecycles: LIFECYCLES, sources: LEAD_SOURCES, plans: priceList() },
        metrics,
        trend: signupTrend(contacts.filter((c) => c.role !== "admin"), 6, now),
        board,
        tasks: store.allOpenTasks().slice(0, 40),
        engagementWindowDays: ENGAGEMENT_WINDOW_DAYS,
        generatedAt: new Date().toISOString(),
      });
    }

    if (pathname === "/api/admin/crm/contacts" && method === "GET") {
      const now = referenceDate();
      const contacts = allContacts(now).filter((c) => c.role !== "admin");
      const query = {
        q: searchParams.get("q") || "",
        stage: searchParams.get("stage") || undefined,
        lifecycle: searchParams.get("lifecycle") || undefined,
        source: searchParams.get("source") || undefined,
        owner: searchParams.get("owner") || undefined,
        tag: searchParams.get("tag") || undefined,
        kind: searchParams.get("kind") || undefined,
        minEngagement: numParam(searchParams, "minEngagement"),
        hasOpenTask: searchParams.get("hasOpenTask") === "true",
        overdue: searchParams.get("overdue") === "true",
        sort: searchParams.get("sort") || "recent",
      };
      const matched = filterContacts(contacts, query);

      if (searchParams.get("format") === "csv") {
        res.setHeader("Content-Disposition", 'attachment; filename="hunter-crm-contacts.csv"');
        return sendBuffer(req, res, 200, contactsToCsv(matched), "text/csv; charset=utf-8");
      }

      const page = Math.max(1, numParam(searchParams, "page") || 1);
      const pageSize = Math.min(200, Math.max(1, numParam(searchParams, "pageSize") || 25));
      const start = (page - 1) * pageSize;

      // Facets are counted over the filtered set, so no combination of filters
      // can lead to an option that returns nothing.
      const facet = (get) => {
        const counts = {};
        for (const c of matched) {
          const v = get(c);
          if (v == null || v === "") continue;
          counts[v] = (counts[v] || 0) + 1;
        }
        return counts;
      };

      return send(req, res, 200, {
        total: matched.length,
        page,
        pageSize,
        contacts: matched.slice(start, start + pageSize),
        facets: {
          stage: facet((c) => c.stage),
          lifecycle: facet((c) => c.lifecycle),
          source: facet((c) => c.source),
          owner: facet((c) => c.owner),
        },
        owners: [...new Set(contacts.map((c) => c.owner).filter(Boolean))].sort(),
        tags: [...new Set(contacts.flatMap((c) => c.tags || []))].sort(),
        vocabulary: { stages: STAGES, lifecycles: LIFECYCLES, sources: LEAD_SOURCES, plans: priceList() },
      });
    }

    // One contact, everything known about it, in one response — an operator on a
    // call should not have to click twice to find the last thing that was said.
    if (pathname === "/api/admin/crm/contact" && method === "GET") {
      const id = searchParams.get("id");
      const now = referenceDate();
      const record = store.crmFor(id);
      const user = store.getUser(id);

      if (user) {
        const activity = store.activity(user.id, 200);
        const subscriptions = store.subscriptionLog(user.id);
        const versions = store.profileHistory(user.id);
        const contact = buildContact(
          { user, crm: record, activity, subLog: subscriptions, profileVersions: versions.length },
          now
        );
        return send(req, res, 200, {
          contact,
          profile: user.profile || null,
          notes: record?.notes || [],
          tasks: record?.tasks || [],
          versions,
          subscriptions,
          timeline: buildTimeline({ activity, subscriptions, versions, notes: record?.notes || [], tasks: record?.tasks || [] }).slice(0, 120),
          savedCalls: (user.saved || []).map((sid) => {
            const opp = catalogState.byId.get(sid);
            return opp
              ? { id: opp.id, title: opp.title, program: opp.program, deadline: opp.deadline }
              : { id: sid, title: null, program: null, deadline: null };
          }),
          plans: PLANS,
          vocabulary: { stages: STAGES, lifecycles: LIFECYCLES, sources: LEAD_SOURCES, plans: priceList() },
        });
      }

      const lead = store.getLead(id);
      if (!lead) return send(req, res, 404, { error: "Nincs ilyen kapcsolat.", code: "NO_SUCH_CONTACT" });
      const contact = buildLeadContact({ ...lead, crm: record }, now);
      return send(req, res, 200, {
        contact,
        profile: lead.profile || null,
        notes: record?.notes || [],
        tasks: record?.tasks || [],
        versions: [],
        subscriptions: [],
        timeline: buildTimeline({ notes: record?.notes || [], tasks: record?.tasks || [] }).slice(0, 120),
        savedCalls: [],
        lead,
        plans: PLANS,
        vocabulary: { stages: STAGES, lifecycles: LIFECYCLES, sources: LEAD_SOURCES, plans: priceList() },
      });
    }

    if (pathname === "/api/admin/crm/contact" && method === "POST") {
      const { id, stage, owner, tags, lostReason, source } = body || {};
      if (!subjectExists(id)) return send(req, res, 404, { error: "Nincs ilyen kapcsolat.", code: "NO_SUCH_CONTACT" });

      if (stage !== undefined) {
        if (!STAGE_IDS.includes(stage)) return send(req, res, 400, { error: `Ismeretlen szakasz: ${stage}`, code: "UNKNOWN_STAGE" });
        store.setStage(id, stage, admin.username, lostReason ? String(lostReason).slice(0, 300) : null);
        if (store.getUser(id)) store.recordActivity(id, "crm.stage", { stage, by: admin.username });
      }

      const patch = {};
      if (owner !== undefined) patch.owner = owner ? String(owner).trim().slice(0, 60) : null;
      if (source !== undefined) patch.source = source ? String(source).trim().slice(0, 40) : null;
      if (Array.isArray(tags)) {
        patch.tags = [...new Set(tags.map((t) => String(t).trim().slice(0, 30)).filter(Boolean))].slice(0, 12);
      }
      if (Object.keys(patch).length) store.updateCrm(id, patch);

      return send(req, res, 200, { success: true, crm: store.crmFor(id) });
    }

    if (pathname === "/api/admin/crm/note" && method === "POST") {
      const { id, text, kind, noteId, remove } = body || {};
      if (!subjectExists(id)) return send(req, res, 404, { error: "Nincs ilyen kapcsolat.", code: "NO_SUCH_CONTACT" });

      if (remove) {
        const ok = store.deleteNote(id, noteId);
        return send(req, res, ok ? 200 : 404, ok ? { success: true, notes: store.crmFor(id)?.notes || [] } : { error: "Nincs ilyen bejegyzes.", code: "NO_SUCH_NOTE" });
      }
      const trimmed = String(text || "").trim();
      if (!trimmed) return send(req, res, 400, { error: "A bejegyzés nem lehet üres.", code: "EMPTY_NOTE" });
      const note = store.addNote(id, {
        body: trimmed.slice(0, 4000),
        kind: NOTE_KINDS.includes(kind) ? kind : "note",
        by: admin.username,
      });
      return send(req, res, 201, { success: true, note, notes: store.crmFor(id)?.notes || [] });
    }

    if (pathname === "/api/admin/crm/task" && method === "POST") {
      const { id, title, dueAt, taskId, done, remove } = body || {};
      if (!subjectExists(id)) return send(req, res, 404, { error: "Nincs ilyen kapcsolat.", code: "NO_SUCH_CONTACT" });

      if (remove) {
        const ok = store.deleteTask(id, taskId);
        return send(req, res, ok ? 200 : 404, ok ? { success: true, tasks: store.crmFor(id)?.tasks || [] } : { error: "Nincs ilyen teendő.", code: "NO_SUCH_TASK" });
      }
      if (taskId) {
        const task = store.setTaskDone(id, taskId, done !== false, admin.username);
        if (!task) return send(req, res, 404, { error: "Nincs ilyen teendő.", code: "NO_SUCH_TASK" });
        return send(req, res, 200, { success: true, task, tasks: store.crmFor(id)?.tasks || [] });
      }
      const trimmed = String(title || "").trim();
      if (!trimmed) return send(req, res, 400, { error: "A teendőhöz megnevezés kell.", code: "EMPTY_TASK" });
      const due = dueAt ? new Date(dueAt) : null;
      if (due && Number.isNaN(due.getTime())) return send(req, res, 400, { error: "Érvénytelen határidő.", code: "INVALID_DUE_DATE" });
      const task = store.addTask(id, { title: trimmed.slice(0, 200), dueAt: due ? due.toISOString() : null, by: admin.username });
      return send(req, res, 201, { success: true, task, tasks: store.crmFor(id)?.tasks || [] });
    }

    if (pathname === "/api/admin/crm/leads" && method === "GET") {
      const now = referenceDate();
      return send(req, res, 200, {
        leads: store.listLeads().map((lead) => buildLeadContact(lead, now)),
        vocabulary: { stages: STAGES, sources: LEAD_SOURCES },
      });
    }

    if (pathname === "/api/admin/crm/lead" && method === "POST") {
      const { id, remove, company, contactName, phone, email, note } = body || {};
      const lead = store.getLead(id);
      if (!lead) return send(req, res, 404, { error: "Nincs ilyen érdeklődő.", code: "NO_SUCH_LEAD" });
      if (remove) {
        store.deleteLead(id);
        return send(req, res, 200, { success: true });
      }
      const patch = {};
      const set = (key, value, max) => {
        if (value !== undefined) patch[key] = value === null || value === "" ? null : String(value).trim().slice(0, max);
      };
      set("company", company, 120);
      set("contactName", contactName, 120);
      set("phone", phone, 40);
      set("email", email, 200);
      set("note", note, 500);
      store.updateLead(id, patch);
      return send(req, res, 200, { success: true, lead: store.getLead(id) });
    }

    if (pathname === "/api/admin/user/delete" && method === "POST") {
      const { userId } = body || {};
      if (userId === admin.id) return send(req, res, 400, { error: "Saját fiókodat nem törölheted.", code: "CANNOT_DELETE_SELF" });
      const ok = store.deleteUser(userId);
      return send(req, res, ok ? 200 : 404, ok ? { success: true } : { error: "Nincs ilyen felhasználó.", code: "NO_SUCH_USER" });
    }

    return send(req, res, 404, { error: `No admin route for ${method} ${pathname}` });
  }

  if (pathname === "/api/health" && method === "GET") {
    return send(req, res, 200, {
      status: "healthy",
      service: "HUNTER API",
      version: "2.1.0",
      catalog: {
        opportunities: catalogState.opportunities.length,
        open: catalogState.opportunities.filter((o) => o.status === "open").length,
        builtAt: catalogState.meta?.builtAt || null,
        builtBy: catalogState.meta?.builtBy || "build step",
        referenceDate: catalogState.meta?.referenceDate || null,
        eurHuf: catalogState.meta?.eurHuf || null,
      },
      refresh: refresher ? refresher.status : { enabled: false },
      storage: { persistProfile: PERSIST },
      timestamp: new Date().toISOString(),
    });
  }

  // Refresh status, and a way to trigger one without waiting for the schedule.
  if (pathname === "/api/refresh" && method === "GET") {
    return send(req, res, 200, refresher ? refresher.status : { enabled: false });
  }

  if (pathname === "/api/refresh" && method === "POST") {
    if (!refresher) return send(req, res, 503, { error: "the refresher is not running" });
    const result = await refresher.runOnce("api");
    return send(req, res, result.ok ? 200 : 502, {
      ...result,
      catalog: { total: catalogState.opportunities.length, builtAt: catalogState.meta?.builtAt || null },
      status: refresher.status,
    });
  }

  // Vocabularies and catalog metadata — everything the UI needs to render
  // filter controls without hard-coding option lists.
  if (pathname === "/api/meta" && method === "GET") {
    const actionLabels = {};
    for (const [code, rule] of Object.entries(ACTION_RULES)) actionLabels[code] = rule.label;
    const programmeLabels = {};
    for (const p of Object.values(FRAMEWORK_PROGRAMMES)) programmeLabels[p.short] = p.name;
    programmeLabels.HU = "Hungarian national programmes";

    return send(req, res, 200, {
      catalog: catalogState.meta,
      reference: { regions: REGIONS, industries: INDUSTRIES, goals: GOALS, revBands: REV_BANDS, orgTypes: ORG_TYPES },
      labels: { programmes: programmeLabels, actions: actionLabels },
      optionalProfileFields: OPTIONAL_PROFILE_FIELDS,
      today: referenceDate().toISOString().slice(0, 10),
    });
  }

  if (pathname === "/api/profile" && method === "GET") {
    const user = currentUser(req);
    return send(req, res, 200, {
      profile: user?.profile ? normalizeProfile(user.profile) : db.profile ? normalizeProfile(db.profile) : null,
      answers: user?.answers || db.answers,
      saved: user?.saved || db.saved,
      demoProfile: normalizeProfile(DEMO_PROFILE),
      versions: user ? store.profileHistory(user.id).length : 0,
      lastEuSync: db.lastEuSync,
    });
  }

  if (pathname === "/api/profile" && method === "POST") {
    const profile = normalizeProfile(body?.profile || body);
    const user = currentUser(req);
    if (user) {
      // Each save is a version, so a company can see how its profile — and the
      // matches that follow from it — changed over time.
      store.updateUser(user.id, { profile, company: profile.company || user.company });
      const entry = store.recordProfile(user.id, profile, body?.source || "profile form");
      store.recordActivity(user.id, "profile.saved", { version: entry.version, changed: entry.changed.length });
      return send(req, res, 200, { success: true, profile, version: entry.version, changed: entry.changed });
    }
    db.profile = profile;
    saveDb(db);
    return send(req, res, 200, { success: true, profile });
  }

  if (pathname === "/api/profile/load-demo" && method === "POST") {
    db.profile = normalizeProfile({ ...DEMO_PROFILE });
    saveDb(db);
    return send(req, res, 200, { success: true, profile: db.profile });
  }

  if (pathname === "/api/profile/reset" && method === "POST") {
    saveDb({ ...EMPTY_DB });
    return send(req, res, 200, { success: true });
  }

  // The main search endpoint: free text + structured filters + facets, scored
  // against the company profile unless ?personalized=false.
  // GET scores against the demo company (or the local file); POST carries the
  // visitor's own profile and answers in the body.
  if (pathname === "/api/search" && (method === "GET" || method === "POST")) {
    const personalized = searchParams.get("personalized") !== "false";
    const st = resolveState(req, db, body);
    const profile = personalized ? st.profile : null;
    const ref = referenceDate();
    const scorer = profile ? (opp) => hunterScore(opp, profile, st.answers, ref) : null;

    if (st.user && (searchParams.get("q") || "").trim()) {
      store.recordActivity(st.user.id, "search", { q: searchParams.get("q") });
    }

    const result = runSearch(catalogState.index, {
      q: searchParams.get("q") || "",
      filters: parseFilters(searchParams),
      sort: searchParams.get("sort") || undefined,
      page: numParam(searchParams, "page") || 1,
      pageSize: Math.min(numParam(searchParams, "pageSize") || 20, 100),
      scorer,
    });

    return send(req, res, 200, {
      query: searchParams.get("q") || "",
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      sort: result.sort,
      personalized,
      profileUsed: profile ? { company: profile.company, orgType: profile.orgType, goals: profile.goals, fromRequest: st.supplied } : null,
      account: st.user ? { username: st.user.username, tier: st.entitlements.tier } : null,
      entitlements: st.entitlements,
      facets: result.facets,
      ...gateResults(
        result.results.map((r) => ({ ...toCard(r.opp, r.res, lang), relevance: r.relevance })),
        st.entitlements,
        st.profile
      ),
    });
  }

  // Dashboard: the ranked shortlist, what was excluded and why, and the
  // deadlines worth acting on.
  if (pathname === "/api/dashboard" && (method === "GET" || method === "POST")) {
    const st = resolveState(req, db, body);
    const profile = st.profile;
    const ref = referenceDate();

    // Prizes and quality labels are real portal entries but award no money, so
    // they do not belong in a funding shortlist. `?includeNonFunding=true`
    // brings them back.
    const includeNonFunding = searchParams.get("includeNonFunding") === "true";
    const scored = catalogState.opportunities
      .filter((o) => o.status === "open" && daysToDeadline(o, ref) > 0)
      .filter((o) => includeNonFunding || o.awardsFunding !== false)
      .map((opp) => ({ opp, res: hunterScore(opp, profile, st.answers, ref) }));

    const eligible = scored.filter((x) => !x.res.blocked).sort((a, b) => (b.res.score || 0) - (a.res.score || 0));
    const blocked = scored.filter((x) => x.res.blocked);

    const threshold = numParam(searchParams, "minScore") ?? 70;
    const shortlist = eligible.filter((x) => (x.res.score || 0) >= threshold);

    const gatedMatches = gateResults(
      (shortlist.length ? shortlist : eligible.slice(0, 10)).slice(0, 12).map((x) => toCard(x.opp, x.res, lang)),
      st.entitlements,
      profile
    );

    return send(req, res, 200, {
      profile,
      stats: {
        catalogTotal: catalogState.opportunities.length,
        openTotal: scored.length,
        eligible: eligible.length,
        blocked: blocked.length,
        shortlist: shortlist.length,
        needsAnswer: eligible.filter((x) => x.res.estimated).length,
        potentialGrantHuf: shortlist.reduce((sum, x) => sum + fundingCalculator(x.opp, profile).grantHuf, 0),
      },
      // The statistics above stay whole: the value of the product has to be
      // visible before anyone pays for it. The ranked list is what the
      // subscription buys, so that is what the gate applies to.
      matches: gatedMatches.results,
      lockedCount: gatedMatches.lockedCount,
      excluded: st.entitlements.explanations ? blocked.slice(0, 12).map((x) => toCard(x.opp, x.res, lang)) : [],
      // The calendar is a paid view, but an empty calendar reads as "you have
      // no deadlines" rather than "your deadlines are behind the paywall", so
      // a gated visitor gets the same rows censored instead of nothing.
      deadlines: (() => {
        const soon = eligible
          .filter((x) => x.res.elig.days > 0 && x.res.elig.days <= 90)
          .sort((a, b) => a.res.elig.days - b.res.elig.days);
        if (st.entitlements.maxResults === Infinity) {
          return soon.slice(0, 15).map((x) => toCard(x.opp, x.res, lang));
        }
        return soon
          .slice(0, st.entitlements.teasers ?? 0)
          .map((x, i) => teaserCard(toCard(x.opp, x.res, lang), i, profile));
      })(),
      saved: st.saved,
      account: st.user ? { username: st.user.username, tier: st.entitlements.tier } : null,
      entitlements: st.entitlements,
    });
  }

  // The whole catalog in one response, carrying the declarative rules so the
  // browser can re-rank instantly when the user answers a question or edits
  // their profile. The description and the raw conditions HTML are stripped —
  // together they are most of the payload and neither is needed to rank.
  if (pathname === "/api/catalog" && (method === "GET" || method === "POST")) {
    const ref = referenceDate();
    const includeForthcoming = searchParams.get("forthcoming") === "true";
    const st = resolveState(req, db, body);

    const live = catalogState.opportunities.filter(
      (o) => (includeForthcoming || o.status === "open") && daysToDeadline(o, ref) > 0
    );
    const trim = ({ description, conditionsHtml, goalEvidence, deadlines, ...rest }) => ({
      ...rest,
      summary: (rest.summary || description || "").slice(0, 240),
    });

    const base = {
      builtAt: catalogState.meta?.builtAt || null,
      referenceDate: catalogState.meta?.referenceDate || null,
      eurHuf: catalogState.meta?.eurHuf || null,
      entitlements: st.entitlements,
    };

    // A subscriber gets the whole catalog, which is what lets the browser
    // re-rank instantly when they answer a question or edit their profile.
    if (st.entitlements.maxResults === Infinity) {
      return send(req, res, 200, { ...base, gated: false, total: live.length, opportunities: live.map(trim) });
    }

    // Everyone else gets only what they are entitled to see. This matters:
    // the browser ranks locally, so handing it the full catalog would make the
    // paywall decorative — the data would already be in the page.
    const scored = live
      .filter((o) => o.awardsFunding !== false)
      .map((opp) => ({ opp, res: hunterScore(opp, st.profile, st.answers, ref) }));
    const eligible = scored.filter((x) => !x.res.blocked).sort((a, b) => (b.res.score || 0) - (a.res.score || 0));

    const allowed = eligible.slice(0, st.entitlements.maxResults).map((x) => trim(x.opp));

    // `opportunities` is empty for a gated visitor, and that is the point: the
    // browser's local ranker has nothing to rank, so there is no copy of the
    // catalog sitting in the page for anyone to read out of devtools. What the
    // UI renders instead is `teasers` — already ranked here, already censored.
    const teasers = eligible
      .slice(0, st.entitlements.teasers ?? 0)
      .map((x, i) => teaserCard(toCard(x.opp, x.res, lang), i, st.profile));

    return send(req, res, 200, {
      ...base,
      gated: true,
      total: allowed.length,
      lockedTotal: Math.max(0, eligible.length - allowed.length),
      opportunities: allowed,
      teasers,
      // The real figures still travel, because the count of what a company
      // could apply for is the argument for subscribing — only the calls
      // themselves are withheld.
      stats: {
        catalogTotal: catalogState.opportunities.length,
        openTotal: scored.length,
        eligible: eligible.length,
        blocked: scored.length - eligible.length,
        strong: eligible.filter((x) => (x.res.score || 0) >= 85).length,
        closingSoon: eligible.filter((x) => x.res.elig.days > 0 && x.res.elig.days <= 14).length,
        needsAnswer: eligible.filter((x) => x.res.estimated).length,
      },
    });
  }

  if (pathname === "/api/benchmarks" && method === "GET") {
    return send(req, res, 200, catalogState.benchmarks || { projectCount: 0 });
  }

  const oppMatch = pathname.match(/^\/api\/opportunities\/([^/]+)(?:\/(answer|save))?$/);
  if (oppMatch) {
    const id = decodeURIComponent(oppMatch[1]);
    const action = oppMatch[2];
    const opp = catalogState.byId.get(id);
    if (!opp) return send(req, res, 404, { error: `No opportunity with id '${id}'` });

    if (!action && (method === "GET" || method === "POST")) {
      const st = resolveState(req, db, body);
      if (st.user) store.recordActivity(st.user.id, "opportunity.viewed", { id, title: opp.title });
      return send(req, res, 200, {
        opportunity: gateDetail(toDetail(opp, st.profile, st.answers, lang), st.entitlements),
        saved: st.saved.includes(id),
        entitlements: st.entitlements,
      });
    }

    // Answering an open question: stored globally so the same question is not
    // asked again on the next call that depends on it.
    if (action === "answer" && method === "POST") {
      const { field, value, scope = "global" } = body || {};
      if (!field) return send(req, res, 400, { error: "field is required" });
      const key = scope === "call" ? `${id}:${field}` : field;
      const st = resolveState(req, db, body);

      const answers = { ...st.answers };
      if (value === null) delete answers[key];
      else answers[key] = value;

      // A signed-in company's answers belong to the account, so the same
      // question is not asked again on another device.
      if (st.user) {
        store.updateUser(st.user.id, { answers });
        store.recordActivity(st.user.id, "profile.answered", { field: key, value });
      } else {
        if (value === null) delete db.answers[key];
        else db.answers[key] = value;
        saveDb(db);
      }

      return send(req, res, 200, {
        success: true,
        key,
        value,
        opportunity: gateDetail(toDetail(opp, st.profile, answers, lang), st.entitlements),
      });
    }

    // Favourites belong to the visitor, so the client sends the list it holds
    // and gets the toggled list back. The server persists it only in the
    // single-user local mode; it never invents one visitor's list for another.
    if (action === "save" && method === "POST") {
      const st = resolveState(req, db, body);
      const next = st.saved.includes(id) ? st.saved.filter((x) => x !== id) : [...st.saved, id];
      if (st.user) {
        store.updateUser(st.user.id, { saved: next });
        store.recordActivity(st.user.id, next.includes(id) ? "opportunity.saved" : "opportunity.unsaved", { id });
      } else {
        db.saved = next;
        saveDb(db);
      }
      return send(req, res, 200, {
        success: true,
        saved: next,
        isSaved: next.includes(id),
        persisted: Boolean(st.user) || PERSIST,
      });
    }
  }

  // Scores a list of saved ids. POST carries the visitor's own list and profile.
  if (pathname === "/api/saved" && (method === "GET" || method === "POST")) {
    const st = resolveState(req, db, body);
    const ref = referenceDate();
    // The saved list travels in the request body for a visitor with no
    // account, so it is attacker-controlled: without the gate below, posting a
    // handful of guessed ids here would hand back the whole card for each one
    // and walk straight around the paywall.
    const items = st.saved
      .map((id) => catalogState.byId.get(id))
      .filter(Boolean)
      .map((opp) => toCard(opp, hunterScore(opp, st.profile, st.answers, ref), lang));
    const gated = gateResults(items, st.entitlements, st.profile);
    return send(req, res, 200, { total: items.length, results: gated.results, lockedCount: gated.lockedCount });
  }

  // Refreshes the catalog from the live portal without a rebuild.
  if (pathname === "/api/sync" && method === "POST") {
    try {
      const { opportunities, report, totalResults } = await fetchLiveEuCalls({
        maxRecords: Math.min(Number(body?.maxRecords) || 300, 1000),
        today: referenceDate().toISOString().slice(0, 10),
        eurHuf: catalogState.meta?.eurHuf,
      });

      const merged = new Map(catalogState.opportunities.map((o) => [o.id, o]));
      let added = 0;
      for (const opp of opportunities) {
        if (!merged.has(opp.id)) added += 1;
        merged.set(opp.id, opp);
      }

      const catalog = {
        meta: { ...catalogState.meta, lastSyncAt: new Date().toISOString(), lastSyncReport: report },
        opportunities: [...merged.values()].sort((a, b) => String(a.deadline).localeCompare(String(b.deadline))),
        benchmarks: catalogState.benchmarks,
      };
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog), "utf8");
      indexCatalog(catalog);

      db.lastEuSync = catalog.meta.lastSyncAt;
      saveDb(db);

      return send(req, res, 200, {
        success: true,
        portalTotal: totalResults,
        fetched: report.input,
        normalized: report.kept,
        added,
        catalogTotal: catalogState.opportunities.length,
        report,
        lastSyncAt: catalog.meta.lastSyncAt,
      });
    } catch (err) {
      return send(req, res, 502, { error: `Live sync failed: ${err.message}` });
    }
  }

  return send(req, res, 404, { error: `No route for ${method} ${pathname}` });
}

// ---------------------------------------------------------------------------
// Static files
// ---------------------------------------------------------------------------

const INDEX_FILE = path.join(ROOT_DIR, "index.html");
/** Optional folder for future web assets; nothing else on disk is public. */
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

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

// ---------------------------------------------------------------------------

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
    try {
      return await handleApi(req, res, url);
    } catch (err) {
      console.error(`${req.method} ${url.pathname} failed:`, err);
      return send(req, res, 500, { error: err.message });
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

const PORT = process.env.PORT || 3000;
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
  const sweeper = setInterval(() => store.purgeExpiredSessions(), 3600 * 1000);
  if (typeof sweeper.unref === "function") sweeper.unref();
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    refresher.stop();
    // Let any queued write land before the process goes away.
    store.flush().finally(() => server.close(() => process.exit(0)));
  });
}

export { server, catalogState, refresher, store };
