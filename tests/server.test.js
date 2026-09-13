/**
 * API integration tests.
 *
 * The server is started as a real child process against a temporary data
 * directory, so these exercise the same code path a browser hits — routing,
 * persistence, ranking and search included — without touching the developer's
 * own saved profile.
 *
 * The reference date is pinned so deadline-sensitive assertions stay stable.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 3478;
const BASE = `http://127.0.0.1:${PORT}`;
const TODAY = "2026-09-11";

const CATALOG_FILE = path.join(ROOT, "server", "data", "catalog.json");

/** Waits for the server to answer, rather than sleeping and hoping. */
async function waitForHealth(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return res.json();
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`server did not become healthy within ${timeoutMs}ms`);
}

/**
 * A minimal cookie jar. Most of this suite runs as a signed-in account with a
 * subscription, because that is the product; the gate itself is asserted
 * separately with its own jars.
 */
function client() {
  let cookie = null;
  const headers = (extra = {}) => ({ ...(cookie ? { Cookie: cookie } : {}), ...extra });
  const capture = (res) => {
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    return res;
  };
  return {
    get cookie() {
      return cookie;
    },
    async raw(p, opts = {}) {
      return capture(await fetch(`${BASE}${p}`, { ...opts, headers: headers(opts.headers) }));
    },
    async get(p) {
      const res = await this.raw(p);
      assert.ok(res.ok, `GET ${p} returned ${res.status}`);
      return res.json();
    },
    async post(p, body) {
      const res = await this.raw(p, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      assert.ok(res.ok, `POST ${p} returned ${res.status}`);
      return res.json();
    },
    async tryPost(p, body) {
      const res = await this.raw(p, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    },
  };
}

// The default client for the suite; signed in as the administrator, which has
// full entitlements, so the assertions below describe the whole product.
const admin = client();
const get = (p) => admin.get(p);
const post = (p, body) => admin.post(p, body);

test("HUNTER API", async (t) => {
  if (!fs.existsSync(CATALOG_FILE)) {
    t.skip("no catalog built — run `npm run build:catalog` first");
    return;
  }

  // A scratch copy of server/data keeps the test run from overwriting the
  // developer's own profile and answers.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hunter-test-"));
  fs.copyFileSync(CATALOG_FILE, path.join(tmp, "catalog.json"));

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), HUNTER_TODAY: TODAY, HUNTER_DATA_DIR: tmp },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d));

  t.after(() => {
    child.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  let health;
  try {
    health = await waitForHealth();
  } catch (err) {
    throw new Error(`${err.message}\nserver stderr:\n${stderr}`);
  }

  await t.test("health reports a loaded catalog", () => {
    assert.equal(health.status, "healthy");
    assert.ok(health.catalog.opportunities > 0, "the catalog should be loaded at startup");
  });

  await t.test("the administrator account is seeded on first boot", async () => {
    const res = await admin.tryPost("/api/auth/login", { username: "admin", password: "admin" });
    assert.equal(res.status, 200, "the demo administrator must be able to sign in");
    assert.equal(res.body.user.role, "admin");
    assert.equal(res.body.user.entitlements.tier, "admin");
    assert.ok(admin.cookie, "a session cookie must be set");
    assert.match(admin.cookie, /^hunter_session=/);
  });

  await t.test("meta exposes the vocabularies the UI renders filters from", async () => {
    const meta = await get("/api/meta");
    assert.ok(meta.reference.goals.length > 0);
    assert.ok(meta.reference.orgTypes.length > 0);
    assert.ok(meta.reference.regions.length > 0);
    assert.ok(Object.keys(meta.labels.programmes).length > 0);
    assert.ok(Object.keys(meta.labels.actions).length > 0);
    assert.equal(meta.today, TODAY, "the pinned reference date must reach the client");
  });

  await t.test("the demo profile loads and is normalized on the way in", async () => {
    const res = await post("/api/profile/load-demo");
    assert.equal(res.success, true);
    assert.equal(res.profile.company, "Alfa Gyártó Kft.");
    assert.equal(res.profile.country, "HU", "country is derived, not asked twice");
    assert.equal(res.profile.orgType, "sme", "28 employees is an SME under the EU definition");
    assert.equal(res.profile.sector, "manufacturing", "TEÁOR 28 maps to manufacturing");
    assert.equal(res.profile.consortium_ready, undefined, "unknown stays unknown");
  });

  await t.test("the catalog endpoint carries the rules the browser ranks with", async () => {
    const data = await get("/api/catalog");
    assert.ok(data.total > 0);
    const opp = data.opportunities[0];
    assert.ok(Array.isArray(opp.hard), "declarative rules must reach the client");
    assert.ok(opp.deadline >= TODAY, "only live calls belong in the catalog");
    assert.equal(opp.description, undefined, "the heavy description is stripped from the list payload");
  });

  await t.test("free-text search ranks by relevance and reports facets", async () => {
    const res = await get("/api/search?q=energy&pageSize=5");
    assert.ok(res.total > 0, "the catalog should contain energy calls");
    assert.ok(res.results.length <= 5);
    assert.equal(res.sort, "relevance", "a text query defaults to relevance order");
    assert.ok(res.facets.program.length > 0);
    assert.ok(res.facets.goals.length > 0);

    const facetTotal = res.facets.consortium.reduce((n, f) => n + f.count, 0);
    assert.equal(facetTotal, res.total, "facet counts must describe the whole result set");
  });

  await t.test("a nonsense query returns nothing rather than everything", async () => {
    const res = await get("/api/search?q=zzzqqqxyz");
    assert.equal(res.total, 0);
    assert.equal(res.results.length, 0);
  });

  await t.test("filters narrow the result set and paginate", async () => {
    const all = await get("/api/search?pageSize=10");
    const horizon = await get("/api/search?program=HORIZON&pageSize=10");
    assert.ok(horizon.total > 0);
    assert.ok(horizon.total < all.total, "filtering must actually narrow");
    assert.ok(horizon.results.every((r) => r.programShort === "HORIZON"));

    const solo = await get("/api/search?consortium=solo&pageSize=10");
    assert.ok(solo.results.every((r) => !r.consortium.required));

    const page2 = await get("/api/search?pageSize=10&page=2&sort=deadline");
    assert.equal(page2.page, 2);
    assert.ok(page2.results.length > 0);
    const page1 = await get("/api/search?pageSize=10&page=1&sort=deadline");
    assert.notEqual(page1.results[0].id, page2.results[0].id, "pages must differ");
  });

  await t.test("results are scored against the saved profile, and can be scored without one", async () => {
    const personalized = await get("/api/search?pageSize=5&sort=-score");
    assert.ok(personalized.personalized);
    assert.ok(personalized.profileUsed, "the response says whose profile was used");
    assert.ok(personalized.results.some((r) => r.score !== null), "eligible calls carry a score");

    const anonymous = await get("/api/search?pageSize=5&personalized=false");
    assert.equal(anonymous.personalized, false);
    assert.ok(anonymous.results.every((r) => r.score === null), "without a profile there is nothing to score against");
  });

  await t.test("the dashboard separates matches from what the engine excluded", async () => {
    const dash = await get("/api/dashboard");
    assert.ok(dash.stats.openTotal > 0);
    assert.ok(dash.stats.eligible > 0);
    assert.ok(dash.matches.length > 0, "a manufacturing SME should match something");
    assert.ok(dash.excluded.length > 0, "and the engine should be able to say what it ruled out");
    assert.ok(
      dash.excluded.every((x) => x.blockedReasons.length > 0),
      "every exclusion must state its reason"
    );
    assert.ok(dash.deadlines.every((d) => d.daysLeft > 0), "past deadlines are not upcoming");
  });

  await t.test("opportunity detail explains the verdict in the company's own terms", async () => {
    const list = await get("/api/search?pageSize=1&sort=-score");
    const id = list.results[0].id;
    const { opportunity } = await get(`/api/opportunities/${encodeURIComponent(id)}`);

    assert.equal(opportunity.id, id);
    assert.ok(["ELIGIBLE", "CONDITIONAL", "INSUFFICIENT_DATA", "NOT_ELIGIBLE"].includes(opportunity.verdict));
    assert.equal(opportunity.factors.length, 5, "the score is made of exactly five weighted factors");
    assert.equal(
      opportunity.factors.reduce((n, f) => n + f.weight, 0).toFixed(2),
      "1.00",
      "the factor weights must sum to 1"
    );
    assert.ok(opportunity.factors.every((f) => f.detail && f.detail.length > 10), "each factor must justify itself");
    assert.ok(opportunity.checks.length > 0, "the hard rules and their outcomes must be visible");
    assert.ok(opportunity.calculator, "the grant calculator is part of the detail response");
  });

  await t.test("an unknown opportunity id is a 404, not a crash", async () => {
    const res = await fetch(`${BASE}/api/opportunities/does-not-exist`);
    assert.equal(res.status, 404);
  });

  await t.test("answering a question resolves it for every call that asks it", async () => {
    const before = await get("/api/dashboard");
    assert.ok(before.stats.needsAnswer > 0, "the demo profile should start with open questions");

    // Find a call whose only open question is about joining a consortium — a
    // call blocked on some other unknown would not resolve from this answer.
    const pending = await get("/api/search?pageSize=50&sort=-score");
    let target = null;
    let question = null;
    for (const row of pending.results.filter((r) => r.verdict === "INSUFFICIENT_DATA")) {
      const { opportunity } = await get(`/api/opportunities/${encodeURIComponent(row.id)}`);
      if (opportunity.questions.length === 1 && opportunity.questions[0].field === "consortium_ready") {
        target = row;
        question = opportunity.questions[0];
        break;
      }
    }
    assert.ok(target, "there should be a call awaiting only the consortium answer");
    assert.ok(question.question && question.options.length > 0, "an open question must be answerable in place");

    const yes = await post(`/api/opportunities/${encodeURIComponent(target.id)}/answer`, {
      field: "consortium_ready",
      value: true,
    });
    assert.notEqual(yes.opportunity.verdict, "INSUFFICIENT_DATA", "the verdict resolves immediately");
    assert.ok(yes.opportunity.score > 0, "and a real score appears");

    const after = await get("/api/dashboard");
    assert.ok(after.stats.needsAnswer < before.stats.needsAnswer, "one answer clears many calls at once");

    // And the opposite answer must close the consortium-only calls.
    await post(`/api/opportunities/${encodeURIComponent(target.id)}/answer`, { field: "consortium_ready", value: false });
    const refused = await get("/api/dashboard");
    assert.ok(refused.stats.blocked > after.stats.blocked, "declining a consortium rules those calls out");

    // Clear it again so later assertions are not affected.
    await post(`/api/opportunities/${encodeURIComponent(target.id)}/answer`, { field: "consortium_ready", value: null });
  });

  await t.test("favourites follow the account when signed in, and the visitor otherwise", async () => {
    const list = await get("/api/search?pageSize=2");
    const id = list.results[0].id;

    // Signed in, the list belongs to the account so it follows the user to
    // another device.
    const saved = await post(`/api/opportunities/${encodeURIComponent(id)}/save`, { saved: [] });
    assert.equal(saved.isSaved, true);
    assert.deepEqual(saved.saved, [id]);
    assert.equal(saved.persisted, true, "a signed-in account keeps its favourites");

    const scored = await post("/api/saved", { saved: saved.saved });
    assert.equal(scored.total, 1);
    assert.equal(scored.results[0].id, id);
    assert.ok(scored.results[0].deadline, "a saved call comes back fully scored, not just as an id");

    const unsaved = await post(`/api/opportunities/${encodeURIComponent(id)}/save`, { saved: saved.saved });
    assert.deepEqual(unsaved.saved, []);

    // Anonymous, nothing is stored on the server at all.
    const guest = client();
    const guestSave = await guest.post(`/api/opportunities/${encodeURIComponent(id)}/save`, { saved: [] });
    assert.equal(guestSave.persisted, false, "an anonymous visitor's favourites are never stored");
    assert.equal((await guest.post("/api/saved", { saved: [] })).total, 0);
  });

  // -- accounts, subscriptions and the gate ---------------------------------

  await t.test("registration creates an account with no subscription", async () => {
    const alfa = client();
    const res = await alfa.tryPost("/api/auth/register", {
      username: "alfa-test",
      password: "titok123",
      company: "Alfa Gyártó Kft.",
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, "user");
    assert.equal(res.body.user.subscription.status, "none");
    assert.equal(res.body.user.entitlements.tier, "registered");
    assert.equal(res.body.user.entitlements.explanations, false, "the reasoning is what a subscription buys");

    // The same username cannot be taken twice.
    const dup = await client().tryPost("/api/auth/register", { username: "alfa-test", password: "titok123" });
    assert.equal(dup.status, 409);

    // Weak input is refused with a readable message.
    const weak = await client().tryPost("/api/auth/register", { username: "ok", password: "x" });
    assert.equal(weak.status, 400);
    assert.ok(weak.body.error.length > 10, "the error must explain the rule, not just fail");
  });

  await t.test("a wrong password is refused without revealing whether the user exists", async () => {
    const wrong = await client().tryPost("/api/auth/login", { username: "alfa-test", password: "nope" });
    const missing = await client().tryPost("/api/auth/login", { username: "no-such-user", password: "nope" });
    assert.equal(wrong.status, 401);
    assert.equal(missing.status, 401);
    assert.equal(wrong.body.error, missing.body.error, "the two cases must be indistinguishable");
  });

  await t.test("without a subscription the counts are honest but the list is gated", async () => {
    const alfa = client();
    await alfa.post("/api/auth/login", { username: "alfa-test", password: "titok123" });
    await alfa.post("/api/profile", {
      profile: { company: "Alfa Gyártó Kft.", employees: 28, county: "Pest", teaor: "28", goals: ["digitalization"], investment_value: 30e6, closed_business_years: 4 },
    });

    const dash = await alfa.get("/api/dashboard");
    assert.equal(dash.entitlements.tier, "registered");
    assert.ok(dash.stats.eligible > 10, "the real count stays visible — that is the sales argument");
    assert.equal(
      dash.matches.filter((m) => !m.locked).length,
      0,
      "there is no free allowance of whole cards any more"
    );
    assert.ok(dash.matches.length > 0, "but the matches are still shown, censored");
    assert.ok(dash.deadlines.every((d) => d.locked), "the calendar rows are censored too");
    assert.equal(dash.excluded.length, 0, "the exclusion reasoning is part of the paid product");

    const found = await alfa.get("/api/search?pageSize=20&sort=-score");
    assert.ok(found.total > 3, "there should be plenty to match against");
    assert.equal(found.results.filter((r) => !r.locked).length, 0, "nothing is shown in full");
    assert.ok(found.lockedCount > 0, "every row comes back as a teaser");

    // The teaser inverts what the old free tier revealed: the score and the
    // money are the hook and stay, the identity of the call is the product and
    // goes. A teaser that leaked the programme would be pointless — so would
    // one that leaked the id, since ids like `eu-life-2026-cet-enerpov` name
    // the programme and the topic outright.
    const locked = found.results.find((r) => r.locked);
    assert.equal(typeof locked.score, "number", "the score is the hook and stays");
    assert.ok("grantHuf" in locked, "so does the grant this company would receive");
    for (const field of ["id", "title", "program", "programShort", "callId", "sourceRef", "sourceUrl", "submissionUrl", "deadline", "summary"]) {
      assert.equal(locked[field], undefined, `a teaser must not carry ${field}`);
    }
    assert.ok(
      !/HORIZON|LIFE|EURATOM/.test(JSON.stringify(found.results)),
      "no programme name survives anywhere in a gated payload"
    );

    // A free account cannot obtain an id any more, but guessing one must not
    // work either, so the detail endpoint is checked with a real id.
    const admin = client();
    await admin.post("/api/auth/login", { username: "admin", password: "admin" });
    const real = await admin.get("/api/search?pageSize=1&sort=-score");
    const detail = await alfa.get(`/api/opportunities/${encodeURIComponent(real.results[0].id)}`);
    assert.equal(detail.opportunity.locked, true);
    assert.equal(detail.opportunity.title, null, "guessing an id must not reveal the call");
    assert.equal(detail.opportunity.program, null);
    assert.equal(detail.opportunity.factors.length, 0, "no factor breakdown without a subscription");
    assert.equal(detail.opportunity.calculator, null);
    assert.equal(detail.opportunity.submissionUrl, null);

    // The saved list arrives in the request body, so it is attacker-controlled:
    // replaying real ids through it must not hand back whole cards.
    const replay = await alfa.post("/api/saved", { saved: [real.results[0].id] });
    assert.ok(replay.results.every((r) => r.locked), "saved ids cannot be used to walk around the gate");
  });

  await t.test("the catalog endpoint is gated, so the paywall is not decorative", async () => {
    // The browser ranks locally, so handing a free account the whole catalog
    // would put every paid answer in the page regardless of what the UI hides.
    const profile = { company: "T", employees: 28, county: "Pest", teaor: "28", goals: ["digitalization"], investment_value: 30e6, closed_business_years: 4 };

    const guest = client();
    const anonymous = await guest.post("/api/catalog", { profile });
    assert.equal(anonymous.gated, true);
    assert.equal(anonymous.opportunities.length, 0, "not one whole call is sent");
    assert.ok(anonymous.lockedTotal > 100, "the rest is withheld");
    assert.ok(anonymous.stats.eligible > 10, "but the real count still travels");

    // Censored rows go in their place, so the screen is not empty and the
    // local ranker still has nothing to rank.
    assert.ok(anonymous.teasers.length > 0, "censored rows take the place of the calls");
    assert.ok(
      anonymous.teasers.every((t) => typeof t.score === "number" && t.id === undefined && t.title === undefined),
      "each teaser carries a score and no identity"
    );
    assert.ok(
      !/HORIZON|LIFE|EURATOM/.test(JSON.stringify(anonymous.teasers)),
      "and no programme name"
    );

    const alfa = client();
    await alfa.post("/api/auth/login", { username: "alfa-test", password: "titok123" });
    const registered = await alfa.post("/api/catalog", { profile });
    assert.equal(registered.gated, true, "registering alone does not open the catalog");
    assert.equal(registered.opportunities.length, 0);
    assert.ok(registered.teasers.length > 0);

    // An administrator — and therefore a subscriber — gets the whole thing.
    const full = await post("/api/catalog", { profile });
    assert.equal(full.gated, false);
    assert.ok(full.opportunities.length > 100);
    assert.ok(Array.isArray(full.opportunities[0].hard), "with the rules the browser ranks on");
  });

  await t.test("an admin grants access, and the product opens up", async () => {
    const users = await get("/api/admin/users");
    const target = users.users.find((u) => u.username === "alfa-test");
    assert.ok(target, "the new account should be listed for the administrator");
    assert.ok(users.plans.length > 0, "the plans an admin can grant must be offered");

    const granted = await post("/api/admin/subscription", { userId: target.id, planId: "monthly", note: "Demo" });
    assert.equal(granted.user.subscription.status, "active");
    assert.equal(granted.user.subscription.plan, "monthly");
    assert.equal(granted.user.subscription.daysLeft, 30);
    assert.equal(granted.user.subscription.grantedBy, "admin", "who granted it is recorded");
    assert.equal(granted.user.entitlements.tier, "subscriber");

    const alfa = client();
    await alfa.post("/api/auth/login", { username: "alfa-test", password: "titok123" });
    const dash = await alfa.get("/api/dashboard");
    assert.equal(dash.entitlements.tier, "subscriber");
    assert.equal(dash.lockedCount, 0, "nothing is locked for a subscriber");
    assert.ok(dash.excluded.length > 0, "and the exclusions come with their reasons");
    const found = await alfa.get("/api/search?pageSize=20&sort=-score");
    assert.equal(found.lockedCount, 0, "the full result list is open");
    assert.ok(found.results.every((r) => !r.locked));

    const detail = await alfa.get(`/api/opportunities/${encodeURIComponent(dash.matches[0].id)}`);
    assert.ok(!detail.opportunity.locked);
    assert.equal(detail.opportunity.factors.length, 5);
    assert.ok(detail.opportunity.calculator);

    // Extending adds to the remaining time rather than discarding it.
    const extended = await post("/api/admin/subscription", { userId: target.id, planId: "monthly" });
    assert.ok(extended.user.subscription.daysLeft >= 59, "an extension adds to what is left");

    // And revoking takes effect on the next request.
    await post("/api/admin/subscription", { userId: target.id, revoke: true });
    const after = await alfa.get("/api/dashboard");
    assert.equal(after.entitlements.tier, "registered", "revoking takes effect on the next request");
    const gatedAgain = await alfa.get("/api/search?pageSize=20&sort=-score");
    assert.ok(gatedAgain.lockedCount > 0, "and the results are gated again");
  });

  await t.test("the admin overview reports what needs acting on", async () => {
    const overview = await get("/api/admin/overview");

    assert.ok(overview.stats.users >= 2);
    assert.ok(overview.stats.sessions >= 1);
    assert.ok(Array.isArray(overview.awaitingAccess), "accounts without access are listed for action");
    assert.ok(Array.isArray(overview.expiringSoon), "so are subscriptions about to lapse");
    assert.ok(overview.plans.length > 0, "with the plans that can be granted");

    // Activity spans accounts, and says whose it is — otherwise it is unusable
    // as an operations view.
    assert.ok(overview.activity.length > 0);
    assert.ok(overview.activity[0].username, "each entry names the account it belongs to");
    assert.ok(overview.activity[0].at);

    // System health, so an admin can see whether the catalog is current.
    assert.ok(overview.system.catalogTotal > 0);
    assert.ok(overview.system.catalogOpen > 0);
    assert.ok(overview.system.eurHuf > 0);
    assert.ok(overview.system.refresh, "and the state of the refresh loop");

    // An account with no subscription must appear in the actionable list.
    const waiting = overview.awaitingAccess.map((u) => u.username);
    assert.ok(waiting.includes("alfa-test"), "the free account should be flagged as awaiting access");
    assert.ok(!overview.awaitingAccess.some((u) => u.role === "admin"), "administrators are not awaiting anything");
  });

  await t.test("the overview is closed to non-administrators", async () => {
    assert.equal((await fetch(`${BASE}/api/admin/overview`)).status, 401);
    const alfa = client();
    await alfa.post("/api/auth/login", { username: "alfa-test", password: "titok123" });
    assert.equal((await alfa.raw("/api/admin/overview")).status, 403);
  });

  await t.test("administration is closed to everyone else", async () => {
    const anonymous = await fetch(`${BASE}/api/admin/users`);
    assert.equal(anonymous.status, 401);

    const alfa = client();
    await alfa.post("/api/auth/login", { username: "alfa-test", password: "titok123" });
    const forbidden = await alfa.raw("/api/admin/users");
    assert.equal(forbidden.status, 403, "a signed-in ordinary user is not an administrator");

    const escalation = await alfa.tryPost("/api/admin/subscription", { userId: "anything", planId: "yearly" });
    assert.equal(escalation.status, 403, "and cannot grant themselves a subscription");
  });

  await t.test("the company profile is versioned, and a version can be restored", async () => {
    const alfa = client();
    await alfa.post("/api/auth/login", { username: "alfa-test", password: "titok123" });

    const v2 = await alfa.post("/api/profile", {
      profile: { company: "Alfa Gyártó Kft.", employees: 60, county: "Pest", teaor: "28", goals: ["digitalization", "ai"], investment_value: 90e6, closed_business_years: 5 },
    });
    assert.equal(v2.version, 2);
    const changed = v2.changed.map((c) => c.field);
    assert.ok(changed.includes("employees"), "the diff names what actually changed");
    assert.ok(changed.includes("investment_value"));

    // Saving the same profile again is not a new version.
    const again = await alfa.post("/api/profile", {
      profile: { company: "Alfa Gyártó Kft.", employees: 60, county: "Pest", teaor: "28", goals: ["digitalization", "ai"], investment_value: 90e6, closed_business_years: 5 },
    });
    assert.equal(again.version, 2, "an identical re-save must not create a version");

    const history = await alfa.get("/api/profile/history");
    assert.equal(history.versions.length, 2);
    assert.equal(history.versions[0].version, 2, "newest first");
    assert.ok(history.activity.length > 0, "activity is recorded alongside");

    const restored = await alfa.post("/api/profile/restore", { version: 1 });
    assert.equal(restored.profile.employees, 28, "restoring brings back the earlier values");
    assert.equal(restored.versions.length, 3, "and is itself recorded as a new version");
  });

  await t.test("signing out ends the session", async () => {
    const alfa = client();
    await alfa.post("/api/auth/login", { username: "alfa-test", password: "titok123" });
    assert.ok((await alfa.get("/api/auth/me")).user, "signed in");
    await alfa.post("/api/auth/logout");
    const after = await alfa.get("/api/auth/me");
    assert.equal(after.user, null, "the session must be gone, not merely hidden");
  });

  await t.test("benchmarks come from funded Hungarian projects", async () => {
    const b = await get("/api/benchmarks");
    if (!b.projectCount) {
      t.diagnostic("no Kohesio benchmarks in this catalog");
      return;
    }
    assert.ok(b.overall.budgetEur.median > 0);
    assert.ok(b.examples.length > 0);
    assert.ok(b.source.includes("Kohesio"));
  });

  await t.test("static files are served, and traversal never escapes the project", async () => {
    const page = await fetch(`${BASE}/`);
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes("HUNTER"));

    // fetch() normalizes "../" away before it reaches the wire, so the request
    // has to be written by hand to test the guard at all.
    const rawRequest = (rawPath) =>
      new Promise((resolve, reject) => {
        const socket = net.connect(PORT, "127.0.0.1", () => {
          socket.write(`GET ${rawPath} HTTP/1.1\r\nHost: 127.0.0.1:${PORT}\r\nConnection: close\r\n\r\n`);
        });
        let data = "";
        socket.on("data", (c) => (data += c));
        socket.on("end", () => resolve(data));
        socket.on("error", reject);
      });

    // The project root holds source, tests, raw scrapes and the saved profile.
    // None of it is web content, so none of it may be reachable.
    for (const attempt of [
      "/../package.json",
      "/package.json",
      "/../../../../Windows/win.ini",
      "/..%2f..%2fpackage.json",
      "/%2e%2e/%2e%2e/package.json",
      "/server/data/db.json",
      "/server/server.js",
      "/src/engine/scoring.js",
    ]) {
      const response = await rawRequest(attempt);
      // Markers unique to each file, chosen so the app shell itself — which is
      // what every unmatched path correctly falls back to — never trips them.
      assert.ok(
        !response.includes('"build:catalog"') &&
          !response.includes("[fonts]") &&
          !response.includes("export function hunterScore") &&
          !response.includes('"lastEuSync"'),
        `${attempt} must not expose a file from outside the web root`
      );
    }
  });
});
