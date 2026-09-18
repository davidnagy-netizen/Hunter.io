/**
 * CRM tests.
 *
 * The CRM's whole claim is that it invents nothing: the lifecycle is read off
 * the subscription, the engagement number is counted out of the activity log,
 * and the revenue figures come from the real price list. So these tests do not
 * check that the screens render — they check that each number is the one the
 * recorded facts produce, and that a number with no facts behind it comes back
 * null rather than zero.
 *
 * Three groups:
 *   1. the domain module, against hand-built inputs
 *   2. the store, against a scratch file
 *   3. the endpoints, against a live server on a scratch data directory
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  STAGES, STAGE_IDS, lifecycleOf, defaultStageFor, engagementOf, engagementBand,
  monthlyValueOf, priceList, buildContact, buildLeadContact, portfolioMetrics,
  signupTrend, filterContacts, contactsToCsv, buildTimeline, validateLead,
  ENGAGEMENT_WINDOW_DAYS,
} from "../server/crm.js";
import { Store } from "../server/store.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NOW = new Date("2026-09-12T12:00:00.000Z");
const ADMIN_PASSWORD = "teszt-jelszo";
const DAY = 86400000;

/** An ISO timestamp `days` before the fixed reference point. */
const ago = (days) => new Date(NOW.getTime() - days * DAY).toISOString();
const ahead = (days) => new Date(NOW.getTime() + days * DAY).toISOString();

function account(over = {}) {
  return {
    id: "u_1", username: "alfa", email: "info@alfa.hu", company: "Alfa Kft.", role: "user",
    createdAt: ago(40), lastLoginAt: ago(2), disabled: false, profile: null, saved: [], answers: {},
    subscription: { status: "none", plan: null, validUntil: null, grantedBy: null, grantedAt: null, note: null },
    ...over,
  };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

test("lifecycle is read off the subscription, never chosen by hand", () => {
  const never = account();
  assert.equal(lifecycleOf(never, [], NOW), "registered");

  const onTrial = account({ subscription: { status: "trial", plan: "trial", validUntil: ahead(3) } });
  assert.equal(lifecycleOf(onTrial, [{ action: "granted", plan: "trial" }], NOW), "trial");

  const paying = account({ subscription: { status: "active", plan: "monthly", validUntil: ahead(18) } });
  assert.equal(lifecycleOf(paying, [{ action: "granted", plan: "monthly" }], NOW), "subscriber");

  // An expired subscription is a different sales conversation from one that
  // never started, so it must not collapse back to "registered".
  const lapsed = account({ subscription: { status: "active", plan: "monthly", validUntil: ago(5) } });
  assert.equal(lifecycleOf(lapsed, [{ action: "granted", plan: "monthly" }], NOW), "expired");

  // Revoked rather than expired: the log still proves access was once granted.
  const revoked = account({ subscription: { status: "none", plan: null, validUntil: null } });
  assert.equal(lifecycleOf(revoked, [{ action: "revoked" }, { action: "granted", plan: "monthly" }], NOW), "expired");
});

test("the default stage follows the lifecycle until a person takes a view", () => {
  assert.equal(defaultStageFor("subscriber"), "won");
  assert.equal(defaultStageFor("trial"), "proposal");
  assert.equal(defaultStageFor("expired"), "contacted");
  assert.equal(defaultStageFor("registered"), "new");
  assert.equal(defaultStageFor("lead"), "new");

  // A stage an operator set wins over the derived one, and is not silently
  // overwritten when the subscription changes underneath it.
  const c = buildContact(
    {
      user: account({ subscription: { status: "active", plan: "monthly", validUntil: ahead(10) } }),
      crm: { stage: "qualified", stageSetBy: "admin", stageSetAt: ago(3) },
    },
    NOW
  );
  assert.equal(c.lifecycle, "subscriber");
  assert.equal(c.stage, "qualified");
  assert.equal(c.stageSetBy, "admin");
  assert.equal(c.daysInStage, 3);
});

// ---------------------------------------------------------------------------
// Engagement
// ---------------------------------------------------------------------------

test("engagement counts real activity and shows the arithmetic that produced it", () => {
  const activity = [
    { at: ago(1), type: "account.login" },
    { at: ago(2), type: "account.login" },
    { at: ago(3), type: "opportunity.viewed" },
    { at: ago(3), type: "opportunity.saved" },
    { at: ago(4), type: "profile.answered" },
    { at: ago(200), type: "account.login" }, // outside the window: must not count
  ];
  const e = engagementOf(activity, NOW);

  // 2 logins x4 + 1 view x3 + 1 save x6 + 1 answer x8 = 25, all inside a week,
  // so the recency multiplier is 1.
  assert.equal(e.score, 25);
  assert.equal(e.window, ENGAGEMENT_WINDOW_DAYS);
  assert.equal(e.daysSinceActive, 1);
  assert.equal(e.signals.reduce((n, s) => n + s.points, 0), 25, "the breakdown accounts for the whole score");
  assert.equal(e.signals.find((s) => s.type === "account.login").count, 2, "the out-of-window login is excluded");

  // Nothing recorded is zero with an empty breakdown, not a small number.
  const silent = engagementOf([], NOW);
  assert.equal(silent.score, 0);
  assert.deepEqual(silent.signals, []);
  assert.equal(silent.lastActiveAt, null);
  assert.equal(silent.daysSinceActive, null);
});

test("silence discounts engagement, and one behaviour cannot carry the score", () => {
  const busy = Array.from({ length: 10 }, (_, i) => ({ at: ago(20 + i * 0.01), type: "account.login" }));
  const stale = engagementOf(busy, NOW);
  // 10 logins would be 40 points, but the per-signal cap is 20 and everything
  // is 20 days old, so the multiplier is 0.5.
  assert.equal(stale.score, 10);
  assert.equal(stale.signals[0].points, 20, "a single behaviour is capped");

  const fresh = engagementOf(busy.map((a) => ({ ...a, at: ago(1) })), NOW);
  assert.equal(fresh.score, 20, "the same behaviour today is worth the full capped value");
  assert.ok(fresh.score > stale.score, "recency has to matter");
});

test("engagement bands are plain and include a distinct empty state", () => {
  assert.equal(engagementBand(70).key, "high");
  assert.equal(engagementBand(30).key, "medium");
  assert.equal(engagementBand(5).key, "low");
  assert.equal(engagementBand(0).key, "none", "no activity is its own band, not 'low'");
});

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

test("monthly value normalizes the real price list and prices a trial at nothing", () => {
  assert.equal(monthlyValueOf("monthly"), 5990);
  assert.equal(monthlyValueOf("quarterly"), Math.round(16990 / 3));
  assert.equal(monthlyValueOf("yearly"), Math.round(59900 / (365 / 30)));
  assert.equal(monthlyValueOf("trial"), 0, "a trial is worth nothing until it converts");
  assert.equal(monthlyValueOf("nonexistent"), 0);

  const list = priceList();
  assert.equal(list.find((p) => p.id === "monthly").priceHUF, 5990);
  assert.equal(list.find((p) => p.id === "trial").priceHUF, null);
});

test("MRR counts only subscriptions that are active right now", () => {
  const contacts = [
    buildContact({ user: account({ id: "a", subscription: { status: "active", plan: "monthly", validUntil: ahead(10) } }) }, NOW),
    buildContact({ user: account({ id: "b", subscription: { status: "active", plan: "yearly", validUntil: ahead(200) } }) }, NOW),
    buildContact({ user: account({ id: "c", subscription: { status: "trial", plan: "trial", validUntil: ahead(2) } }) }, NOW),
    buildContact({ user: account({ id: "d", subscription: { status: "active", plan: "monthly", validUntil: ago(1) } }) }, NOW),
    buildContact({ user: account({ id: "admin", role: "admin", subscription: { status: "active", plan: "admin", validUntil: null } }) }, NOW),
  ];
  const m = portfolioMetrics(contacts, { now: NOW });

  assert.equal(m.subscribers, 2, "the trial, the lapsed account and the admin are not subscribers");
  assert.equal(m.mrrHuf, 5990 + Math.round(59900 / (365 / 30)));
  assert.equal(m.arrHuf, m.mrrHuf * 12);
  assert.equal(m.arpaHuf, Math.round(m.mrrHuf / 2));
  assert.equal(m.trials, 1);
  assert.equal(m.expired, 1);
  assert.equal(m.accounts, 4, "the administrator is staff, not a customer");
});

test("a rate with no data behind it is null, not zero", () => {
  const nobody = portfolioMetrics([], { now: NOW });
  assert.equal(nobody.trialConversionPct, null, "0% would read as a failure where the truth is 'no data'");
  assert.equal(nobody.churnPct, null);
  assert.equal(nobody.mrrHuf, 0, "but money with nothing in it really is zero");
});

test("trial conversion is read off the subscription log, not guessed", () => {
  const contacts = [
    buildContact({ user: account({ id: "a", subscription: { status: "active", plan: "monthly", validUntil: ahead(10) } }) }, NOW),
    buildContact({ user: account({ id: "b", subscription: { status: "trial", plan: "trial", validUntil: ahead(2) } }) }, NOW),
    buildContact({ user: account({ id: "c", subscription: { status: "none" } }) }, NOW),
  ];
  const subscriptionLogs = {
    a: [{ action: "granted", plan: "trial" }, { action: "granted", plan: "monthly" }],
    b: [{ action: "granted", plan: "trial" }],
    c: [], // never trialled: must not count against the rate
  };
  const m = portfolioMetrics(contacts, { subscriptionLogs, now: NOW });

  assert.equal(m.trialStarted, 2);
  assert.equal(m.trialConverted, 1);
  assert.equal(m.trialConversionPct, 50);
});

test("churn counts subscriptions that lapsed inside the window and were not renewed", () => {
  const contacts = [
    buildContact({ user: account({ id: "a", subscription: { status: "active", plan: "monthly", validUntil: ahead(10) } }) }, NOW),
    buildContact({ user: account({ id: "b", subscription: { status: "active", plan: "monthly", validUntil: ago(5) } }) }, NOW),
    buildContact({ user: account({ id: "c", subscription: { status: "active", plan: "monthly", validUntil: ago(120) } }) }, NOW),
  ];
  const m = portfolioMetrics(contacts, { now: NOW });

  assert.equal(m.lapsed30d, 1, "the one that lapsed four months ago is outside the window");
  assert.equal(m.expired, 2);
  assert.equal(m.churnPct, 50, "one lapse against a paying base of two");
});

test("the warm list is the accounts using the product without paying for it", () => {
  const activeUser = buildContact(
    {
      user: account({ id: "warm", subscription: { status: "none" } }),
      activity: [
        { at: ago(1), type: "opportunity.saved" },
        { at: ago(1), type: "opportunity.saved" },
        { at: ago(2), type: "profile.answered" },
        { at: ago(2), type: "account.login" },
      ],
    },
    NOW
  );
  const payingUser = buildContact(
    {
      user: account({ id: "paying", subscription: { status: "active", plan: "monthly", validUntil: ahead(9) } }),
      activity: [{ at: ago(1), type: "opportunity.saved" }, { at: ago(1), type: "profile.answered" }],
    },
    NOW
  );
  const m = portfolioMetrics([activeUser, payingUser], { now: NOW });

  assert.equal(m.warmUnsubscribed.length, 1);
  assert.equal(m.warmUnsubscribed[0].id, "warm");
  assert.ok(m.warmUnsubscribed[0].score >= 20);
});

// ---------------------------------------------------------------------------
// Leads, filtering, export, timeline
// ---------------------------------------------------------------------------

test("a lead renders in the same shape as an account without borrowing its numbers", () => {
  const c = buildLeadContact(
    { id: "l_1", createdAt: ago(6), source: "assessment", email: "a@b.hu", company: "Beta Kft.", readiness: 78, profile: { employees: 12 } },
    NOW
  );
  assert.equal(c.kind, "lead");
  assert.equal(c.lifecycle, "lead");
  assert.equal(c.stage, "new");
  assert.equal(c.daysInStage, 6);
  assert.equal(c.readiness, 78, "the readiness score it arrived with is reported as itself");
  assert.equal(c.engagement.score, 0, "a lead has no activity log, so it gets no engagement score");
  assert.equal(c.monthlyValueHuf, 0);
  assert.equal(c.subscription.active, false);
});

test("signup trend buckets by real timestamp and keeps the empty months", () => {
  const contacts = [
    { kind: "account", createdAt: NOW.toISOString(), stage: "won" },
    { kind: "account", createdAt: NOW.toISOString(), stage: "new" },
    { kind: "lead", createdAt: new Date(NOW.getFullYear(), NOW.getMonth() - 2, 5).toISOString(), stage: "new" },
  ];
  const trend = signupTrend(contacts, 6, NOW);

  assert.equal(trend.length, 6);
  assert.equal(trend.at(-1).signups, 2);
  assert.equal(trend.at(-1).won, 1);
  assert.equal(trend.at(-3).leads, 1);
  assert.ok(trend.some((b) => b.signups === 0 && b.leads === 0), "a month with nothing in it is still a bucket");
});

test("filtering and sorting work over the assembled contacts", () => {
  const contacts = [
    buildContact({ user: account({ id: "a", username: "alfa", email: "info@alfa.hu", company: "Alfa Gyártó Kft." }), crm: { tags: ["gyarto"], owner: "anna" } }, NOW),
    buildContact({ user: account({ id: "b", username: "beta", email: "info@beta.hu", company: "Beta Zrt.", subscription: { status: "active", plan: "monthly", validUntil: ahead(3) } }) }, NOW),
    buildLeadContact({ id: "l", createdAt: ago(1), company: "Gamma Bt.", email: "g@gamma.hu", source: "assessment" }, NOW),
  ];

  assert.deepEqual(filterContacts(contacts, { q: "alfa" }).map((c) => c.id), ["a"]);
  assert.deepEqual(filterContacts(contacts, { q: "GYARTO" }).map((c) => c.id), ["a"], "tags are searched, case-insensitively");
  assert.deepEqual(filterContacts(contacts, { kind: "lead" }).map((c) => c.id), ["l"]);
  assert.deepEqual(filterContacts(contacts, { lifecycle: "subscriber" }).map((c) => c.id), ["b"]);
  assert.deepEqual(filterContacts(contacts, { owner: "anna" }).map((c) => c.id), ["a"]);
  assert.deepEqual(filterContacts(contacts, { sort: "value" })[0].id, "b");
  assert.deepEqual(filterContacts(contacts, { sort: "expiring" })[0].id, "b", "an account with a countdown sorts ahead of ones without");
  assert.equal(filterContacts(contacts, { q: "semmi ilyen nincs" }).length, 0);
});

test("CSV export quotes properly and carries the figures the console shows", () => {
  const contacts = [
    buildContact(
      {
        user: account({ id: "a", company: 'Alfa "Gyártó", Kft.', subscription: { status: "active", plan: "monthly", validUntil: ahead(7) } }),
        crm: { tags: ["gyarto", "pest"] },
      },
      NOW
    ),
  ];
  const csv = contactsToCsv(contacts);
  const lines = csv.split("\r\n");

  assert.ok(csv.startsWith("﻿"), "a BOM so Excel reads the Hungarian accents");
  assert.ok(lines[0].includes("monthly_value_huf"));
  assert.ok(lines[1].includes('"Alfa ""Gyártó"", Kft."'), "quotes and commas are escaped, not stripped");
  assert.ok(lines[1].includes("5990"));
  assert.ok(lines[1].includes("gyarto pest"));
});

test("the timeline merges the four things that happen to a contact, newest first", () => {
  const tl = buildTimeline({
    activity: [{ at: ago(1), type: "account.login" }],
    subscriptions: [{ at: ago(2), action: "granted", plan: "monthly" }],
    versions: [{ at: ago(3), version: 2, changed: [{ field: "employees", from: 28, to: 45 }] }],
    notes: [{ at: ago(4), kind: "call", body: "Felhívtuk." }],
    tasks: [{ at: ago(5), title: "Visszahívás", dueAt: ahead(2), doneAt: ago(0.5) }],
  });

  assert.deepEqual(tl.map((e) => e.kind), ["task", "activity", "subscription", "profile", "note", "task"]);
  assert.equal(tl[0].type, "task.completed", "completing a task is its own moment, not a mutation of the first one");
  assert.equal(tl.at(-1).type, "task.created");
});

test("lead capture refuses anything it should not store", () => {
  assert.equal(validateLead({ email: "", consent: true }).code, "EMAIL_REQUIRED");
  assert.equal(validateLead({ email: "not-an-address", consent: true }).code, "INVALID_EMAIL");
  assert.equal(validateLead({ email: "a@b.hu" }).code, "CONSENT_REQUIRED", "no consent, no record");
  assert.equal(validateLead({ email: "a@b.hu", consent: false }).code, "CONSENT_REQUIRED");

  const ok = validateLead({
    email: "  Kapcsolat@Alfa.hu  ",
    consent: true,
    company: "x".repeat(500),
    readiness: 210,
    answers: { employees: 30, county: "Pest", rubbish: "drop me" },
    profile: { employees: 30, secret: "drop me" },
    matchIds: ["a", "b", "c", "d", "e", "f", "g"],
  });
  assert.equal(ok.error, undefined);
  assert.equal(ok.lead.email, "Kapcsolat@Alfa.hu", "trimmed, but the address itself is left alone");
  assert.equal(ok.lead.company.length, 120, "oversized input is truncated rather than refused");
  assert.equal(ok.lead.readiness, 100, "an out-of-range score is clamped, not stored as given");
  assert.deepEqual(Object.keys(ok.lead.answers), ["employees", "county"], "unknown fields are dropped");
  assert.equal(ok.lead.matchIds.length, 5);
});

test("every stage in the vocabulary is usable and unique", () => {
  assert.equal(new Set(STAGE_IDS).size, STAGE_IDS.length);
  for (const s of STAGES) {
    assert.ok(s.label_hu && s.label_en, `stage ${s.id} needs both languages`);
  }
  assert.deepEqual(STAGE_IDS.slice(-2), ["won", "lost"], "the terminal stages come last so the board reads left to right");
});

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

function scratchStore() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hunter-crm-"));
  return { store: new Store(path.join(dir, "users.json")), dir };
}

test("the store keeps notes, tasks and stages, and survives a reload", async () => {
  const { store, dir } = scratchStore();
  const file = path.join(dir, "users.json");
  const user = store.createUser({ username: "alfa", passwordHash: "x", salt: "y", company: "Alfa Kft." });

  store.setStage(user.id, "qualified", "admin");
  store.addNote(user.id, { body: "Felhívtuk, érdekli a havi csomag.", kind: "call", by: "admin" });
  const task = store.addTask(user.id, { title: "Visszahívás", dueAt: ahead(3), by: "admin" });
  await store.flush();

  const record = store.crmFor(user.id);
  assert.equal(record.stage, "qualified");
  assert.equal(record.stageSetBy, "admin");
  assert.equal(record.notes.length, 1);
  assert.equal(record.notes[0].kind, "call");

  // Everything has to come back after a restart, or none of it is worth writing.
  const reopened = new Store(file);
  const after = reopened.crmFor(user.id);
  assert.equal(after.stage, "qualified");
  assert.equal(after.notes[0].body, "Felhívtuk, érdekli a havi csomag.");
  assert.equal(after.tasks[0].id, task.id);

  assert.equal(reopened.setTaskDone(user.id, task.id, true, "admin").doneBy, "admin");
  assert.equal(reopened.allOpenTasks().length, 0, "a completed task leaves the to-do list");
  assert.equal(reopened.setTaskDone(user.id, task.id, false, "admin").doneAt, null, "and can be re-opened");
  assert.equal(reopened.allOpenTasks().length, 1);

  assert.equal(reopened.deleteNote(user.id, after.notes[0].id), true);
  assert.equal(reopened.deleteNote(user.id, "n_nonexistent"), false);
  assert.equal(reopened.deleteTask(user.id, task.id), true);
  await reopened.flush();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("a lead becomes an account without losing the conversation", async () => {
  const { store, dir } = scratchStore();

  const lead = store.createLead({ email: "kapcsolat@alfa.hu", company: "Alfa Kft.", readiness: 78, source: "assessment" });
  store.addNote(lead.id, { body: "Írt, hogy hívjuk vissza.", kind: "email", by: "admin" });
  store.addTask(lead.id, { title: "Első hívás", dueAt: ahead(1), by: "admin" });

  assert.equal(store.findLeadByEmail("KAPCSOLAT@ALFA.HU").id, lead.id, "address matching ignores case");

  const user = store.createUser({ username: "alfa", passwordHash: "x", salt: "y", email: "kapcsolat@alfa.hu" });
  store.convertLead(lead.id, user.id);

  const moved = store.crmFor(user.id);
  assert.equal(moved.notes.length, 1, "the note follows the account");
  assert.equal(moved.tasks.length, 1, "so does the open follow-up");
  assert.equal(store.getLead(lead.id).convertedUserId, user.id);

  // Deleting an account takes its relationship record with it.
  store.deleteUser(user.id);
  assert.equal(store.crmFor(user.id), null);
  await store.flush();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("the open-task list spans every subject and puts the dated ones first", async () => {
  const { store, dir } = scratchStore();
  const a = store.createUser({ username: "alfa", passwordHash: "x", salt: "y", company: "Alfa Kft." });
  const lead = store.createLead({ email: "b@beta.hu", company: "Beta Kft." });

  store.addTask(a.id, { title: "Késői", dueAt: ahead(9), by: "admin" });
  store.addTask(lead.id, { title: "Sürgős", dueAt: ahead(1), by: "admin" });
  store.addTask(a.id, { title: "Dátum nélkül", dueAt: null, by: "admin" });

  const open = store.allOpenTasks();
  assert.deepEqual(open.map((t) => t.title), ["Sürgős", "Késői", "Dátum nélkül"]);
  assert.equal(open[0].subjectKind, "lead");
  assert.equal(open[0].company, "Beta Kft.");
  assert.equal(open[1].subjectKind, "account");
  await store.flush();
  fs.rmSync(dir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * Boots a real server as a child process on a scratch data directory, the same
 * way tests/server.test.js does, and returns a client with its own cookie jar.
 *
 * A child process rather than an import, because server.js binds its port at
 * module load — and because each test here wants a store with nothing in it.
 */
let nextPort = 3520;

async function startServer() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hunter-crm-srv-"));
  const port = nextPort++;
  const base = `http://127.0.0.1:${port}`;

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      HUNTER_DATA_DIR: dir,
      HUNTER_AUTO_REFRESH: "false",
      HUNTER_ADMIN_PASSWORD: ADMIN_PASSWORD,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d));

  const deadline = Date.now() + 15000;
  let up = false;
  while (Date.now() < deadline && !up) {
    try {
      const res = await fetch(`${base}/api/health`);
      up = res.ok;
    } catch {
      await new Promise((r) => setTimeout(r, 120));
    }
  }
  if (!up) throw new Error(`server on ${port} did not come up\n${stderr}`);

  const jar = new Map();
  async function call(method, url, body, { raw = false } = {}) {
    const headers = { "Content-Type": "application/json" };
    const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    if (cookie) headers.Cookie = cookie;

    const res = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const header of res.headers.getSetCookie?.() || []) {
      const [pair] = header.split(";");
      const i = pair.indexOf("=");
      jar.set(pair.slice(0, i), pair.slice(i + 1));
    }
    const text = await res.text();
    if (raw) return { status: res.status, text, headers: res.headers };
    try {
      return { status: res.status, body: JSON.parse(text) };
    } catch {
      return { status: res.status, body: text };
    }
  }

  return {
    call,
    async stop() {
      if (child.exitCode === null && child.signalCode === null) {
        const exited = new Promise(resolve => child.once("exit", resolve));
        child.kill();
        await exited;
      }
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

test("the CRM endpoints are closed to everyone but an administrator", async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  for (const [method, url] of [
    ["GET", "/api/admin/crm"],
    ["GET", "/api/admin/crm/contacts"],
    ["GET", "/api/admin/crm/leads"],
    ["POST", "/api/admin/crm/note"],
    ["POST", "/api/admin/crm/task"],
    ["POST", "/api/admin/crm/contact"],
  ]) {
    const anon = await srv.call(method, url, method === "POST" ? {} : undefined);
    assert.equal(anon.status, 401, `${method} ${url} must refuse an anonymous caller`);
  }

  await srv.call("POST", "/api/auth/register", { username: "sima_user", password: "proba123", company: "Sima Kft." });
  for (const [method, url] of [
    ["GET", "/api/admin/crm"],
    ["GET", "/api/admin/crm/contacts"],
    ["POST", "/api/admin/crm/note"],
  ]) {
    const asUser = await srv.call(method, url, method === "POST" ? {} : undefined);
    assert.equal(asUser.status, 403, `${method} ${url} must refuse a signed-in non-admin`);
  }
});

test("lead capture is public, validated, and lands in the CRM", async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  const bad = await srv.call("POST", "/api/leads", { email: "nem-email", consent: true });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.code, "INVALID_EMAIL");

  const noConsent = await srv.call("POST", "/api/leads", { email: "a@b.hu" });
  assert.equal(noConsent.status, 400);
  assert.equal(noConsent.body.code, "CONSENT_REQUIRED");

  const created = await srv.call("POST", "/api/leads", {
    email: "kapcsolat@alfa.hu", company: "Alfa Kft.", contactName: "Nagy Anna", consent: true,
    readiness: 78, answers: { employees: 30, county: "Pest" }, profile: { employees: 30, county: "Pest" },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.updated, false);

  // A second submission from the same address updates rather than duplicating.
  const again = await srv.call("POST", "/api/leads", { email: "kapcsolat@alfa.hu", company: "Alfa Gyártó Kft.", consent: true, readiness: 80 });
  assert.equal(again.status, 200);
  assert.equal(again.body.updated, true);
  assert.equal(again.body.id, created.body.id);

  await srv.call("POST", "/api/auth/login", { username: "admin", password: ADMIN_PASSWORD });
  const leads = await srv.call("GET", "/api/admin/crm/leads");
  assert.equal(leads.status, 200);
  assert.equal(leads.body.leads.length, 1, "one address, one lead");
  assert.equal(leads.body.leads[0].company, "Alfa Gyártó Kft.");
  assert.equal(leads.body.leads[0].readiness, 80);
  assert.equal(leads.body.leads[0].lifecycle, "lead");
});

test("the board, the contact page and the metrics are assembled from recorded facts", async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  await srv.call("POST", "/api/leads", { email: "lead@gamma.hu", company: "Gamma Bt.", consent: true, readiness: 61 });
  await srv.call("POST", "/api/auth/register", { username: "betateszt", password: "proba123", email: "info@beta.hu", company: "Beta Kft." });
  await srv.call("POST", "/api/auth/logout");
  await srv.call("POST", "/api/auth/login", { username: "admin", password: ADMIN_PASSWORD });

  const users = await srv.call("GET", "/api/admin/crm/contacts");
  const beta = users.body.contacts.find((c) => c.username === "betateszt");
  assert.ok(beta, "the registered account is a contact");
  assert.equal(beta.lifecycle, "registered");
  assert.equal(beta.stage, "new");
  assert.equal(beta.source, "signup");
  assert.equal(beta.monthlyValueHuf, 0);

  // The stage is the one field a person sets.
  const moved = await srv.call("POST", "/api/admin/crm/contact", { id: beta.id, stage: "qualified", owner: "anna", tags: ["gyarto"] });
  assert.equal(moved.status, 200);
  assert.equal((await srv.call("POST", "/api/admin/crm/contact", { id: beta.id, stage: "kitalalt" })).status, 400);
  assert.equal((await srv.call("POST", "/api/admin/crm/contact", { id: "u_nincs_ilyen", stage: "won" })).status, 404);

  const note = await srv.call("POST", "/api/admin/crm/note", { id: beta.id, text: "Egyeztetve, 30M Ft beruházás.", kind: "call" });
  assert.equal(note.status, 201);
  assert.equal((await srv.call("POST", "/api/admin/crm/note", { id: beta.id, text: "   " })).status, 400);

  const task = await srv.call("POST", "/api/admin/crm/task", { id: beta.id, title: "Visszahívás", dueAt: "2026-09-20" });
  assert.equal(task.status, 201);
  assert.equal((await srv.call("POST", "/api/admin/crm/task", { id: beta.id, title: "Rossz dátum", dueAt: "nem-datum" })).status, 400);

  // Granting access has to move the derived numbers, without touching the stage.
  await srv.call("POST", "/api/admin/subscription", { userId: beta.id, planId: "monthly" });

  const board = await srv.call("GET", "/api/admin/crm");
  assert.equal(board.status, 200);
  assert.equal(board.body.metrics.mrrHuf, 5990, "MRR follows the real grant");
  assert.equal(board.body.metrics.arrHuf, 5990 * 12);
  assert.equal(board.body.metrics.subscribers, 1);
  assert.equal(board.body.metrics.leads, 1);
  assert.equal(board.body.board.qualified.length, 1, "the operator's stage is respected over the derived one");
  assert.equal(board.body.board.qualified[0].lifecycle, "subscriber", "while the lifecycle tracks the subscription");
  assert.ok(!Object.values(board.body.board).flat().some((c) => c.role === "admin"), "the admin account is not a sales contact");
  assert.equal(board.body.tasks.length, 1);

  const detail = await srv.call("GET", `/api/admin/crm/contact?id=${beta.id}`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.notes.length, 1);
  assert.equal(detail.body.tasks.length, 1);
  assert.equal(detail.body.contact.owner, "anna");
  assert.deepEqual(detail.body.contact.tags, ["gyarto"]);
  assert.ok(detail.body.timeline.length >= 3, "the timeline carries the note, the task and the grant");
  assert.ok(detail.body.timeline.some((e) => e.kind === "subscription"));
  assert.ok(!("passwordHash" in detail.body.contact), "no credential material reaches the console");
  assert.ok(!JSON.stringify(detail.body).includes("passwordHash"));

  const missing = await srv.call("GET", "/api/admin/crm/contact?id=u_nincs_ilyen");
  assert.equal(missing.status, 404);

  const csv = await srv.call("GET", "/api/admin/crm/contacts?format=csv", undefined, { raw: true });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get("content-type"), /text\/csv/);
  assert.ok(csv.text.includes("Beta Kft."));
  assert.ok(csv.text.includes("5990"));

  const filtered = await srv.call("GET", "/api/admin/crm/contacts?lifecycle=subscriber");
  assert.equal(filtered.body.total, 1);
  assert.equal(filtered.body.contacts[0].username, "betateszt");

  const searched = await srv.call("GET", "/api/admin/crm/contacts?q=gamma");
  assert.equal(searched.body.total, 1);
  assert.equal(searched.body.contacts[0].kind, "lead");
});

test("registering with a lead's address carries its history onto the account", async (t) => {
  const srv = await startServer();
  t.after(() => srv.stop());

  await srv.call("POST", "/api/leads", { email: "kapcsolat@delta.hu", company: "Delta Kft.", consent: true, readiness: 70 });
  await srv.call("POST", "/api/auth/login", { username: "admin", password: ADMIN_PASSWORD });
  const leads = await srv.call("GET", "/api/admin/crm/leads");
  const leadId = leads.body.leads[0].id;
  await srv.call("POST", "/api/admin/crm/note", { id: leadId, text: "Érdeklődött a havi csomagról.", kind: "email" });
  await srv.call("POST", "/api/auth/logout");

  await srv.call("POST", "/api/auth/register", { username: "deltateszt", password: "proba123", email: "kapcsolat@delta.hu", company: "Delta Kft." });
  await srv.call("POST", "/api/auth/logout");
  await srv.call("POST", "/api/auth/login", { username: "admin", password: ADMIN_PASSWORD });

  const contacts = await srv.call("GET", "/api/admin/crm/contacts");
  const delta = contacts.body.contacts.find((c) => c.username === "deltateszt");
  assert.equal(delta.source, "assessment", "the account inherits where the relationship actually started");

  const detail = await srv.call("GET", `/api/admin/crm/contact?id=${delta.id}`);
  assert.equal(detail.body.notes.length, 1, "the note written before they signed up is still there");
  assert.equal(detail.body.notes[0].body, "Érdeklődött a havi csomagról.");

  const afterLeads = await srv.call("GET", "/api/admin/crm/leads");
  assert.equal(afterLeads.body.leads[0].convertedUserId, delta.id);
});
