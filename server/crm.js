/**
 * CRM domain logic.
 *
 * The admin console already answered "who is waiting for access". This answers
 * the questions that come after it: who is worth calling, what is this account
 * actually worth per month, which trial is about to lapse unrenewed, and what
 * did we say to them last time.
 *
 * Everything here is DERIVED FROM RECORDED FACT, never invented:
 *
 * - `lifecycle` is read off the subscription and the subscription log. An
 *   administrator cannot set it, because it is not an opinion.
 * - `stage` is the sales pipeline position. That one IS an opinion, so it is
 *   stored as one — with who set it and when — and falls back to a value
 *   derived from the lifecycle until somebody actually takes a view.
 * - `engagement` counts real entries in the activity log. Its breakdown is
 *   returned alongside the number so the console can show what produced it,
 *   the same way the Hunter Score shows its factors. It is an activity
 *   indicator, not a prediction, and the interface says so.
 * - revenue is computed from the real price list in auth.js against
 *   subscriptions that are actually active right now. A trial contributes
 *   nothing, because it is worth nothing until it converts.
 *
 * Nothing in this module fabricates a figure to fill a chart. Where there is no
 * data the answer is zero or null, and the console renders an empty state.
 */

import { PLANS, planById } from "./auth.js";
import { isSubscriptionActive, subscriptionDaysLeft } from "./store.js";

const DAY = 86400000;

// Vocabulary

/**
 * Sales pipeline stages. Ordered — the board renders them left to right and
 * `won`/`lost` are terminal.
 */
export const STAGES = [
  { id: "new", label_hu: "Új", label_en: "New", tone: "slate" },
  { id: "contacted", label_hu: "Megkeresve", label_en: "Contacted", tone: "slate" },
  { id: "qualified", label_hu: "Minősítve", label_en: "Qualified", tone: "gold" },
  { id: "proposal", label_hu: "Ajánlat / próba", label_en: "Proposal / trial", tone: "amber" },
  { id: "won", label_hu: "Megnyert", label_en: "Won", tone: "green" },
  { id: "lost", label_hu: "Elveszett", label_en: "Lost", tone: "red" },
];

export const STAGE_IDS = STAGES.map((s) => s.id);

/** Lifecycle is observed, not chosen. */
export const LIFECYCLES = [
  { id: "lead", label_hu: "Érdeklődő", label_en: "Lead" },
  { id: "registered", label_hu: "Regisztrált", label_en: "Registered" },
  { id: "trial", label_hu: "Próbaidő", label_en: "Trial" },
  { id: "subscriber", label_hu: "Előfizető", label_en: "Subscriber" },
  { id: "expired", label_hu: "Lejárt", label_en: "Lapsed" },
];

/** Where a record entered the funnel. Recorded at creation, never guessed. */
export const LEAD_SOURCES = [
  { id: "assessment", label_hu: "Ingyenes felmérés", label_en: "Free assessment" },
  { id: "signup", label_hu: "Önálló regisztráció", label_en: "Self sign-up" },
  { id: "admin", label_hu: "Kézzel rögzítve", label_en: "Added by hand" },
];

export function stageById(id) {
  return STAGES.find((s) => s.id === id) || null;
}

// Lifecycle — derived from the subscription and its log

/**
 * @param {object} user     the stored account
 * @param {Array}  subLog   that account's subscription log, newest first
 * @returns {"registered"|"trial"|"subscriber"|"expired"}
 */
export function lifecycleOf(user, subLog = [], now = new Date()) {
  const sub = user?.subscription;
  if (isSubscriptionActive(sub, now)) {
    return sub.status === "trial" ? "trial" : "subscriber";
  }
  // Not active now. If access was ever granted, this account has lapsed —
  // which is a different sales conversation from one that never started.
  const everGranted = subLog.some((e) => e.action === "granted") || Boolean(sub?.validUntil);
  return everGranted ? "expired" : "registered";
}

/** The stage to show before anyone has taken a view, read off the lifecycle. */
export function defaultStageFor(lifecycle) {
  switch (lifecycle) {
    case "subscriber": return "won";
    case "trial": return "proposal";
    case "expired": return "contacted";
    default: return "new";
  }
}

// Engagement — counted from the activity log, with its own breakdown

/**
 * Activity types worth counting, and what each is worth.
 *
 * The weights say what a sales conversation cares about: somebody who answered
 * an eligibility question and saved three calls is in the product, whereas
 * somebody who signed in twice and left is not. They are a fixed, documented
 * scale — not a model, and not tuned to make anybody look good.
 */
const ENGAGEMENT_SIGNALS = [
  { type: "account.login", points: 4, cap: 20, label_hu: "Belépés", label_en: "Sign-in" },
  { type: "opportunity.viewed", points: 3, cap: 24, label_hu: "Felhívás megnyitva", label_en: "Call opened" },
  { type: "opportunity.saved", points: 6, cap: 24, label_hu: "Felhívás elmentve", label_en: "Call saved" },
  { type: "search", points: 2, cap: 12, label_hu: "Keresés", label_en: "Search" },
  { type: "profile.answered", points: 8, cap: 24, label_hu: "Kérdés megválaszolva", label_en: "Question answered" },
  { type: "profile.saved", points: 5, cap: 15, label_hu: "Profil mentve", label_en: "Profile saved" },
];

export const ENGAGEMENT_WINDOW_DAYS = 30;

/**
 * @returns {{score:number, signals:Array, lastActiveAt:string|null, daysSinceActive:number|null, window:number}}
 *
 * `score` is 0–100. Each signal contributes `count × points`, capped so no
 * single behaviour can carry the whole number, and the total is scaled by how
 * recently the account was last seen — an account that was busy three weeks ago
 * and silent since is not a hot account.
 */
export function engagementOf(activity = [], now = new Date()) {
  const since = now.getTime() - ENGAGEMENT_WINDOW_DAYS * DAY;
  const recent = activity.filter((a) => {
    const t = Date.parse(a.at);
    return Number.isFinite(t) && t >= since;
  });

  const signals = [];
  let raw = 0;
  for (const signal of ENGAGEMENT_SIGNALS) {
    const count = recent.filter((a) => a.type === signal.type).length;
    if (!count) continue;
    const points = Math.min(count * signal.points, signal.cap);
    raw += points;
    signals.push({ type: signal.type, count, points, label_hu: signal.label_hu, label_en: signal.label_en });
  }

  const lastAt = activity.length ? activity.map((a) => a.at).sort().at(-1) : null;
  const lastMs = lastAt ? Date.parse(lastAt) : NaN;
  const daysSinceActive = Number.isFinite(lastMs) ? Math.max(0, Math.floor((now.getTime() - lastMs) / DAY)) : null;

  // Recency multiplier: full weight inside a week, tapering to a third by the
  // end of the window. Silence is the strongest negative signal there is.
  let recency = 1;
  if (daysSinceActive === null) recency = 0;
  else if (daysSinceActive > ENGAGEMENT_WINDOW_DAYS) recency = 0.2;
  else if (daysSinceActive > 14) recency = 0.5;
  else if (daysSinceActive > 7) recency = 0.75;

  const score = Math.max(0, Math.min(100, Math.round(raw * recency)));
  return { score, signals, lastActiveAt: lastAt, daysSinceActive, window: ENGAGEMENT_WINDOW_DAYS };
}

/** Three plain bands, so a table can be scanned rather than read. */
export function engagementBand(score) {
  if (score >= 55) return { key: "high", label_hu: "Aktív", label_en: "Active" };
  if (score >= 20) return { key: "medium", label_hu: "Mérsékelt", label_en: "Moderate" };
  if (score > 0) return { key: "low", label_hu: "Alacsony", label_en: "Low" };
  return { key: "none", label_hu: "Nincs aktivitás", label_en: "No activity" };
}

// Revenue — from the real price list, against subscriptions active right now

/**
 * What one grant of this plan is worth per 30 days.
 * A trial has no price, so it is worth zero until it converts.
 */
export function monthlyValueOf(planId) {
  const plan = planById(planId);
  if (!plan || !plan.priceHUF || !plan.days) return 0;
  return Math.round(plan.priceHUF / (plan.days / 30));
}

/** The price list, with the normalized monthly figure the console reports on. */
export function priceList() {
  return PLANS.map((p) => ({
    id: p.id,
    label_hu: p.label_hu,
    label_en: p.label_en,
    days: p.days,
    priceHUF: p.priceHUF ?? null,
    monthlyHUF: monthlyValueOf(p.id),
  }));
}

// Contact assembly

/**
 * Builds the CRM view of one account from what is actually recorded about it.
 *
 * Takes the raw pieces rather than the Store so the shape is testable without a
 * file on disk.
 */
export function buildContact({ user, crm, activity = [], subLog = [], profileVersions = 0 }, now = new Date()) {
  const lifecycle = lifecycleOf(user, subLog, now);
  const engagement = engagementOf(activity, now);
  const sub = user.subscription || {};
  const active = isSubscriptionActive(sub, now);
  const record = crm || {};

  const stage = record.stage || defaultStageFor(lifecycle);
  const openTasks = (record.tasks || []).filter((t) => !t.doneAt);
  const nextTask = [...openTasks].sort((a, b) => String(a.dueAt || "").localeCompare(String(b.dueAt || "")))[0] || null;

  return {
    id: user.id,
    kind: "account",
    username: user.username,
    email: user.email || null,
    company: user.company || null,
    role: user.role,
    disabled: Boolean(user.disabled),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || null,

    lifecycle,
    stage,
    stageSetBy: record.stageSetBy || null,
    stageSetAt: record.stageSetAt || null,
    // How long this record has sat where it is. Derived from the stage change,
    // or from sign-up when nobody has moved it yet.
    daysInStage: daysBetween(record.stageSetAt || user.createdAt, now),

    owner: record.owner || null,
    tags: record.tags || [],
    source: record.source || "signup",
    lostReason: record.lostReason || null,

    subscription: {
      status: sub.status || "none",
      plan: sub.plan || null,
      active,
      validUntil: sub.validUntil || null,
      daysLeft: subscriptionDaysLeft(sub, now),
      grantedBy: sub.grantedBy || null,
      grantedAt: sub.grantedAt || null,
      note: sub.note || null,
    },
    monthlyValueHuf: active && sub.status === "active" ? monthlyValueOf(sub.plan) : 0,

    engagement: { ...engagement, band: engagementBand(engagement.score) },
    profileVersions,
    hasProfile: Boolean(user.profile),
    // The company's own funding profile is the single most useful thing on a
    // sales call, so the summary travels with the contact.
    profile: user.profile
      ? {
          company: user.profile.company || null,
          employees: user.profile.employees ?? null,
          county: user.profile.county || null,
          region: user.profile.region || null,
          industryId: user.profile.industryId || null,
          teaor: user.profile.teaor || null,
          orgType: user.profile.orgType || null,
          revBand: user.profile.revBand || null,
          goals: user.profile.goals || [],
          investment_value: user.profile.investment_value ?? null,
          projectName: user.profile.projectName || null,
        }
      : null,

    notes: (record.notes || []).length,
    lastNote: (record.notes || [])[0] || null,
    openTasks: openTasks.length,
    nextTask,
    // An overdue follow-up is the one thing the board must not let you miss.
    overdueTasks: openTasks.filter((t) => t.dueAt && Date.parse(t.dueAt) < now.getTime()).length,
  };
}

/** A captured assessment lead, in the same shape the board can render. */
export function buildLeadContact(lead, now = new Date()) {
  const record = lead.crm || {};
  const openTasks = (record.tasks || []).filter((t) => !t.doneAt);
  const nextTask = [...openTasks].sort((a, b) => String(a.dueAt || "").localeCompare(String(b.dueAt || "")))[0] || null;

  return {
    id: lead.id,
    kind: "lead",
    username: null,
    email: lead.email || null,
    company: lead.company || null,
    contactName: lead.contactName || null,
    phone: lead.phone || null,
    role: "lead",
    disabled: false,
    createdAt: lead.createdAt,
    lastLoginAt: null,

    lifecycle: "lead",
    stage: record.stage || "new",
    stageSetBy: record.stageSetBy || null,
    stageSetAt: record.stageSetAt || null,
    daysInStage: daysBetween(record.stageSetAt || lead.createdAt, now),

    owner: record.owner || null,
    tags: record.tags || [],
    source: lead.source || "assessment",
    lostReason: record.lostReason || null,

    subscription: { status: "none", plan: null, active: false, validUntil: null, daysLeft: null },
    monthlyValueHuf: 0,

    // A lead has no account, so there is no activity log to read. The readiness
    // score it arrived with is the only signal, and it is reported as itself
    // rather than dressed up as engagement.
    engagement: { score: 0, signals: [], lastActiveAt: null, daysSinceActive: null, window: ENGAGEMENT_WINDOW_DAYS, band: engagementBand(0) },
    readiness: lead.readiness ?? null,
    answers: lead.answers || null,
    profile: lead.profile || null,
    profileVersions: 0,
    hasProfile: Boolean(lead.profile),
    convertedUserId: lead.convertedUserId || null,

    notes: (record.notes || []).length,
    lastNote: (record.notes || [])[0] || null,
    openTasks: openTasks.length,
    nextTask,
    overdueTasks: openTasks.filter((t) => t.dueAt && Date.parse(t.dueAt) < now.getTime()).length,
  };
}

function daysBetween(iso, now) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / DAY));
}

// Portfolio metrics

/**
 * The numbers the console reports, all of them counted from the contacts above.
 *
 * `pipelineValueHuf` is the one figure that depends on judgement: it prices
 * every non-terminal deal at the monthly value of the plan an admin marked it
 * for, defaulting to the monthly plan. It is labelled as an expectation in the
 * interface, because that is what it is.
 */
export function portfolioMetrics(contacts, { subscriptionLogs = {}, now = new Date() } = {}) {
  const accounts = contacts.filter((c) => c.kind === "account" && c.role !== "admin");
  const leads = contacts.filter((c) => c.kind === "lead");

  const subscribers = accounts.filter((c) => c.lifecycle === "subscriber");
  const trials = accounts.filter((c) => c.lifecycle === "trial");
  const expired = accounts.filter((c) => c.lifecycle === "expired");
  const registered = accounts.filter((c) => c.lifecycle === "registered");

  const mrr = subscribers.reduce((sum, c) => sum + (c.monthlyValueHuf || 0), 0);

  const byStage = {};
  for (const id of STAGE_IDS) byStage[id] = 0;
  for (const c of [...accounts, ...leads]) byStage[c.stage] = (byStage[c.stage] || 0) + 1;

  const byPlan = {};
  for (const c of subscribers) {
    const key = c.subscription.plan || "unknown";
    byPlan[key] = byPlan[key] || { count: 0, monthlyHuf: 0 };
    byPlan[key].count += 1;
    byPlan[key].monthlyHuf += c.monthlyValueHuf || 0;
  }

  const bySource = {};
  for (const c of [...accounts, ...leads]) bySource[c.source] = (bySource[c.source] || 0) + 1;

  // Trial → paid conversion, read off the subscription log rather than guessed:
  // accounts that were ever granted a trial, and of those, how many were later
  // granted a paid plan.
  let everTrial = 0;
  let trialConverted = 0;
  for (const c of accounts) {
    const log = subscriptionLogs[c.id] || [];
    const grants = log.filter((e) => e.action === "granted");
    const hadTrial = grants.some((e) => e.plan === "trial");
    if (!hadTrial) continue;
    everTrial += 1;
    if (grants.some((e) => e.plan && e.plan !== "trial")) trialConverted += 1;
  }

  // Lapsed in the last 30 days and not renewed since — the churn an operator
  // can still do something about.
  const churnWindowStart = now.getTime() - 30 * DAY;
  const recentlyLapsed = expired.filter((c) => {
    const until = Date.parse(c.subscription.validUntil);
    return Number.isFinite(until) && until >= churnWindowStart && until <= now.getTime();
  });

  const payingBase = subscribers.length + recentlyLapsed.length;

  const engaged = accounts.filter((c) => c.engagement.score > 0);
  const unsubscribedButActive = accounts
    .filter((c) => c.lifecycle !== "subscriber" && c.engagement.score >= 20)
    .sort((a, b) => b.engagement.score - a.engagement.score);

  const openDeals = [...accounts, ...leads].filter((c) => c.stage !== "won" && c.stage !== "lost");
  const pipelineValueHuf = openDeals.reduce((sum, c) => sum + monthlyValueOf(c.expectedPlan || "monthly"), 0);

  return {
    contacts: accounts.length + leads.length,
    accounts: accounts.length,
    leads: leads.length,
    subscribers: subscribers.length,
    trials: trials.length,
    expired: expired.length,
    registered: registered.length,

    mrrHuf: mrr,
    arrHuf: mrr * 12,
    arpaHuf: subscribers.length ? Math.round(mrr / subscribers.length) : 0,
    pipelineValueHuf,
    openDeals: openDeals.length,

    byStage,
    byPlan,
    bySource,

    trialStarted: everTrial,
    trialConverted,
    // null rather than 0 when nobody has ever trialled — "0%" would read as a
    // failure where the truth is "no data yet".
    trialConversionPct: everTrial ? Math.round((trialConverted / everTrial) * 100) : null,

    lapsed30d: recentlyLapsed.length,
    churnPct: payingBase ? Math.round((recentlyLapsed.length / payingBase) * 100) : null,

    engagedAccounts: engaged.length,
    warmUnsubscribed: unsubscribedButActive.slice(0, 8).map((c) => ({
      id: c.id,
      company: c.company,
      username: c.username,
      lifecycle: c.lifecycle,
      score: c.engagement.score,
      daysSinceActive: c.engagement.daysSinceActive,
    })),
  };
}

/**
 * Sign-ups and conversions per month, from the real timestamps.
 * Returns the last `months` buckets, oldest first, including empty ones — a
 * gap in the chart is information, so it is not skipped.
 */
export function signupTrend(contacts, months = 6, now = new Date()) {
  const buckets = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, year: d.getFullYear(), month: d.getMonth() + 1, signups: 0, leads: 0, won: 0 });
  }
  const index = new Map(buckets.map((b) => [b.key, b]));
  for (const c of contacts) {
    const t = new Date(c.createdAt);
    if (Number.isNaN(t.getTime())) continue;
    const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
    const bucket = index.get(key);
    if (!bucket) continue;
    if (c.kind === "lead") bucket.leads += 1;
    else bucket.signups += 1;
    if (c.stage === "won") bucket.won += 1;
  }
  return buckets;
}

// Filtering, sorting and export

const SORTS = {
  recent: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
  oldest: (a, b) => String(a.createdAt).localeCompare(String(b.createdAt)),
  engagement: (a, b) => b.engagement.score - a.engagement.score,
  value: (a, b) => b.monthlyValueHuf - a.monthlyValueHuf,
  company: (a, b) => String(a.company || a.username || "").localeCompare(String(b.company || b.username || "")),
  expiring: (a, b) => {
    const av = a.subscription.daysLeft, bv = b.subscription.daysLeft;
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return av - bv;
  },
  stale: (a, b) => (b.daysInStage ?? 0) - (a.daysInStage ?? 0),
};

export function filterContacts(contacts, query = {}) {
  const q = String(query.q || "").trim().toLowerCase();
  let out = contacts;

  if (q) {
    out = out.filter((c) =>
      [c.company, c.username, c.email, c.contactName, c.profile?.projectName, ...(c.tags || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }
  if (query.stage) out = out.filter((c) => c.stage === query.stage);
  if (query.lifecycle) out = out.filter((c) => c.lifecycle === query.lifecycle);
  if (query.source) out = out.filter((c) => c.source === query.source);
  if (query.owner) out = out.filter((c) => c.owner === query.owner);
  if (query.tag) out = out.filter((c) => (c.tags || []).includes(query.tag));
  if (query.kind) out = out.filter((c) => c.kind === query.kind);
  if (query.minEngagement != null) out = out.filter((c) => c.engagement.score >= Number(query.minEngagement));
  if (query.hasOpenTask) out = out.filter((c) => c.openTasks > 0);
  if (query.overdue) out = out.filter((c) => c.overdueTasks > 0);

  const sort = SORTS[query.sort] || SORTS.recent;
  return [...out].sort(sort);
}

const CSV_COLUMNS = [
  ["kind", (c) => c.kind],
  ["company", (c) => c.company || ""],
  ["contact", (c) => c.username || c.contactName || ""],
  ["email", (c) => c.email || ""],
  ["phone", (c) => c.phone || ""],
  ["lifecycle", (c) => c.lifecycle],
  ["stage", (c) => c.stage],
  ["owner", (c) => c.owner || ""],
  ["source", (c) => c.source || ""],
  ["tags", (c) => (c.tags || []).join(" ")],
  ["created_at", (c) => c.createdAt || ""],
  ["last_login_at", (c) => c.lastLoginAt || ""],
  ["plan", (c) => c.subscription.plan || ""],
  ["subscription_active", (c) => (c.subscription.active ? "yes" : "no")],
  ["valid_until", (c) => c.subscription.validUntil || ""],
  ["days_left", (c) => (c.subscription.daysLeft == null ? "" : c.subscription.daysLeft)],
  ["monthly_value_huf", (c) => c.monthlyValueHuf || 0],
  ["engagement", (c) => c.engagement.score],
  ["days_since_active", (c) => (c.engagement.daysSinceActive == null ? "" : c.engagement.daysSinceActive)],
  ["days_in_stage", (c) => (c.daysInStage == null ? "" : c.daysInStage)],
  ["open_tasks", (c) => c.openTasks],
  ["notes", (c) => c.notes],
  ["employees", (c) => c.profile?.employees ?? ""],
  ["county", (c) => c.profile?.county || ""],
  ["investment_value_huf", (c) => c.profile?.investment_value ?? ""],
  ["readiness", (c) => c.readiness ?? ""],
];

/** RFC 4180 quoting, with a BOM so Excel opens the Hungarian accents correctly. */
export function contactsToCsv(contacts) {
  const escape = (v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = CSV_COLUMNS.map(([name]) => name).join(",");
  const rows = contacts.map((c) => CSV_COLUMNS.map(([, get]) => escape(get(c))).join(","));
  return `﻿${[header, ...rows].join("\r\n")}\r\n`;
}

// Timeline

/**
 * One chronological story per contact, merging the four things that actually
 * happened to it: what they did, what we granted, how their profile changed and
 * what we wrote down.
 */
export function buildTimeline({ activity = [], subscriptions = [], versions = [], notes = [], tasks = [] }) {
  const entries = [];

  for (const a of activity) entries.push({ at: a.at, kind: "activity", type: a.type, detail: a });
  for (const s of subscriptions) {
    entries.push({
      at: s.at,
      kind: "subscription",
      type: s.action === "granted" ? "subscription.granted" : "subscription.revoked",
      detail: s,
    });
  }
  for (const v of versions) {
    entries.push({ at: v.at, kind: "profile", type: "profile.version", detail: { version: v.version, changed: v.changed, source: v.source } });
  }
  for (const n of notes) entries.push({ at: n.at, kind: "note", type: `note.${n.kind || "note"}`, detail: n });
  for (const t of tasks) {
    entries.push({ at: t.at, kind: "task", type: "task.created", detail: t });
    if (t.doneAt) entries.push({ at: t.doneAt, kind: "task", type: "task.completed", detail: t });
  }

  return entries
    .filter((e) => e.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

// Lead validation

/** Deliberately permissive: enough to catch a typo, not enough to reject a real address. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validates a lead capture from the public assessment screen.
 *
 * The answers and the readiness score are recomputed or re-derived server-side
 * where possible; what the browser sends is treated as a claim, not as truth,
 * and anything oversized is refused rather than stored.
 */
export function validateLead(body) {
  const email = String(body?.email || "").trim();
  if (!email) return { error: "Adj meg egy e-mail címet.", code: "EMAIL_REQUIRED" };
  if (email.length > 200 || !EMAIL_RE.test(email)) return { error: "Ez az e-mail cím nem érvényes.", code: "INVALID_EMAIL" };
  if (body?.consent !== true) return { error: "A megkereséshez hozzájárulás szükséges.", code: "CONSENT_REQUIRED" };

  const trim = (v, max) => (v === undefined || v === null ? null : String(v).trim().slice(0, max) || null);
  const readiness = Number(body?.readiness);

  return {
    lead: {
      email: email.slice(0, 200),
      company: trim(body?.company, 120),
      contactName: trim(body?.contactName, 120),
      phone: trim(body?.phone, 40),
      note: trim(body?.note, 500),
      source: "assessment",
      readiness: Number.isFinite(readiness) ? Math.max(0, Math.min(100, Math.round(readiness))) : null,
      answers: sanitizeAnswers(body?.answers),
      profile: sanitizeProfile(body?.profile),
      matchIds: Array.isArray(body?.matchIds) ? body.matchIds.slice(0, 5).map((v) => String(v).slice(0, 80)) : [],
    },
  };
}

const LEAD_ANSWER_FIELDS = ["employees", "county", "industryId", "closed_business_years", "goals", "investment_value"];

function sanitizeAnswers(answers) {
  if (!answers || typeof answers !== "object") return null;
  const out = {};
  for (const field of LEAD_ANSWER_FIELDS) {
    const v = answers[field];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) out[field] = v.slice(0, 25).map((x) => String(x).slice(0, 40));
    else if (typeof v === "number" && Number.isFinite(v)) out[field] = v;
    else out[field] = String(v).slice(0, 60);
  }
  return Object.keys(out).length ? out : null;
}

const LEAD_PROFILE_FIELDS = ["employees", "region", "county", "industryId", "teaor", "orgType", "goals", "investment_value", "closed_business_years"];

function sanitizeProfile(profile) {
  if (!profile || typeof profile !== "object") return null;
  const out = {};
  for (const field of LEAD_PROFILE_FIELDS) {
    const v = profile[field];
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) out[field] = v.slice(0, 25).map((x) => String(x).slice(0, 40));
    else if (typeof v === "number" && Number.isFinite(v)) out[field] = v;
    else out[field] = String(v).slice(0, 60);
  }
  return Object.keys(out).length ? out : null;
}
