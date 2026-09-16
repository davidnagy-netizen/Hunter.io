/**
 * UI smoke tests.
 *
 * index.html ships as a single self-contained file, so its script has no module
 * boundary to import. These tests extract that script, run it against a minimal
 * DOM shim and a stubbed API, and then call the view functions directly.
 *
 * The point is not to test rendering fidelity — it is to catch the failures that
 * a single-file front end makes easy: a view that throws on a live-shaped
 * opportunity, a helper that assumes a field the API stopped sending, a screen
 * that breaks when the catalog is empty or a call has no budget.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

import { normalizeEuRecord } from "../src/pipeline/normalizeEu.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** A raw SEDIA record, trimmed to the fields the normalizer reads. */
const RAW_EU_RECORD = {
  url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/HORIZON-CL4-2026-TWIN-01",
  metadata: {
    identifier: ["HORIZON-CL4-2026-TWIN-01"],
    callIdentifier: ["HORIZON-CL4-2026-TWIN"],
    callTitle: ["Digital and Industrial Transition"],
    title: ["AI-driven production planning for manufacturing SMEs"],
    descriptionByte: ["<p>Supporting digitalisation, artificial intelligence and advanced manufacturing in industrial SMEs.</p>"],
    frameworkProgramme: ["43108390"],
    type: ["1"],
    status: ["31094502"],
    startDate: ["2026-05-05T00:00:00.000+0000"],
    deadlineDate: ["2027-01-20T00:00:00.000+0000"],
    deadlineModel: ["single-stage"],
    keywords: ["Artificial intelligence", "Advanced manufacturing"],
    crossCuttingPriorities: ["AI", "DigitalAgenda"],
    typesOfAction: ["HORIZON Innovation Actions"],
    links: [
      JSON.stringify([
        {
          criterionCode: "HORIZON-IA",
          criterionDescription: "HORIZON Innovation Actions",
          mgaCode: "HORIZON-AG",
          mgaDescription: "HORIZON Action Grant",
          url: "https://ec.europa.eu/submission/create-draft/99999",
        },
      ]),
    ],
    budgetOverview: [
      JSON.stringify({
        budgetTopicActionMap: {
          1: [
            {
              action: "HORIZON-CL4-2026-TWIN-01 - HORIZON-IA HORIZON Innovation Actions",
              expectedGrants: 4,
              minContribution: 4000000,
              maxContribution: 6000000,
              budgetYearMap: { 2026: "24000000" },
              plannedOpeningDate: "2026-05-05",
              deadlineModel: "single-stage",
              deadlineDates: ["2027-01-20"],
            },
          ],
        },
      }),
    ],
  },
};

/**
 * Loads index.html's script into a sandbox with just enough browser to run.
 * Returns the sandbox so tests can poke at its globals.
 */
function loadApp({ opportunities, meta } = {}) {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const open = html.indexOf("<script>");
  const close = html.lastIndexOf("</script>");
  assert.ok(open > -1 && close > open, "index.html must contain an inline script");
  const source = html.slice(open + "<script>".length, close);

  const noopElement = () => ({
    innerHTML: "",
    style: {},
    classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    querySelector: () => noopElement(),
    querySelectorAll: () => [],
    addEventListener() {},
    setAttribute() {},
    focus() {},
    value: "",
  });

  const sandbox = {
    console,
    document: {
      documentElement: { lang: "hu" },
      getElementById: () => noopElement(),
      querySelector: () => noopElement(),
      querySelectorAll: () => [],
      createElement: () => noopElement(),
      body: noopElement(),
      addEventListener() {},
    },
    localStorage: {
      _s: new Map(),
      getItem(k) { return this._s.has(k) ? this._s.get(k) : null; },
      setItem(k, v) { this._s.set(k, String(v)); },
      removeItem(k) { this._s.delete(k); },
    },
    // Every request is stubbed: the tests exercise the views, not the network.
    fetch: async () => ({ ok: true, status: 200, json: async () => ({}) }),
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    IntersectionObserver: class { observe() {} disconnect() {} unobserve() {} },
    URLSearchParams,
    URL,
    scrollTo() {},
    Math,
    Date,
    JSON,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "index.html#script" });

  // Function declarations land on the sandbox object, but top-level `const` and
  // `let` stay in the script's lexical scope and are invisible from outside.
  // A second script in the same context bridges the ones the tests need.
  const LEXICAL = ["state", "OPPS", "catalog", "TODAY", "DEMO_PROFILE", "api", "IC", "GOALS", "REGIONS", "OB_STEPS", "ASSESS_Q", "TR"];
  const accessors = LEXICAL.map((name) => `${name}: { get: () => ${name}, set: (v) => { ${name} = v; } }`).join(", ");
  vm.runInContext(`globalThis.__bridge = { ${accessors} };`, sandbox);

  for (const [name, { get, set }] of Object.entries(sandbox.__bridge)) {
    // `const` bindings throw on assignment; only expose a setter where one works.
    let settable = true;
    try {
      set(get());
    } catch {
      settable = false;
    }
    Object.defineProperty(sandbox, name, settable ? { get, set, configurable: true } : { get, configurable: true });
  }

  if (opportunities) sandbox.setCatalog(opportunities, meta || { today: "2026-09-11", labels: { programmes: {}, actions: {} } });
  return sandbox;
}

/** Rough check that a view returned real markup rather than "undefined". */
function assertRendersHtml(html, label) {
  assert.equal(typeof html, "string", `${label} must return a string`);
  assert.ok(html.length > 50, `${label} returned suspiciously little markup`);
  assert.ok(!html.includes("undefined"), `${label} leaked "undefined" into the markup`);
  assert.ok(!html.includes("[object Object]"), `${label} leaked "[object Object]" into the markup`);
  assert.ok(!/\bNaN\b/.test(html), `${label} leaked NaN into the markup`);
}

test("index.html script evaluates and exposes the engine and views", () => {
  const app = loadApp();
  for (const fn of [
    "hunterScore", "evaluateEligibility", "checkRule", "scoreBand",
    "viewSearch", "viewDashboard", "viewOpportunities", "viewDetail", "viewCalendar",
    "setCatalog", "loadCatalog", "ruleLabel",
  ]) {
    assert.equal(typeof app[fn], "function", `${fn} should be defined`);
  }
  // Arrays created inside the VM have that realm's prototype, so compare shape
  // rather than identity.
  assert.equal(app.OPPS.length, 0, "the catalog starts empty and is filled from the API");
  assert.equal(app.catalog.loaded, false, "nothing is loaded until the API answers");
});

test("a live-shaped EU opportunity renders through every screen", () => {
  const opp = normalizeEuRecord(RAW_EU_RECORD, { eurHuf: 364.45 });
  assert.ok(opp, "the fixture should normalize");

  const app = loadApp({ opportunities: [opp] });
  app.state.profile = { ...app.DEMO_PROFILE };
  app.TODAY = new Date("2026-09-11");

  const ranked = app.rankedOpps(app.state.profile);
  assert.equal(ranked.length, 1);

  assertRendersHtml(app.viewDashboard(ranked), "viewDashboard");
  assertRendersHtml(app.viewOpportunities(ranked), "viewOpportunities");
  assertRendersHtml(app.viewCalendar(ranked), "viewCalendar");

  app.state.detailId = opp.id;
  const detail = app.viewDetail();
  assertRendersHtml(detail, "viewDetail");
  // The consortium requirement is the decisive fact for a Hungarian SME, so it
  // has to reach the page rather than sit unused in the data.
  assert.ok(detail.includes("Konzorciumi követelmény"), "detail should show the consortium panel");
  assert.ok(detail.includes(opp.sourceUrl), "detail should link to the official call");
});

test("the detail page leads to the real application, not a dead end", () => {
  const opp = normalizeEuRecord(RAW_EU_RECORD, { eurHuf: 364.45 });
  const app = loadApp({ opportunities: [opp] });
  app.state.profile = { ...app.DEMO_PROFILE };
  app.state.answers = { consortium_ready: true };
  app.TODAY = new Date("2026-09-11");
  app.state.detailId = opp.id;

  const html = app.viewDetail();

  // Both destinations the portal gives us must be reachable from the page.
  assert.ok(html.includes(opp.sourceUrl), "the official call page must be linked");
  assert.ok(html.includes(opp.submissionUrl), "the submission system must be linked");
  assert.ok(html.includes('target="_blank"'), "external links open in a new tab");
  assert.ok(html.includes('rel="noopener"'), "external links must set rel=noopener");

  // The primary action is a link, not the old upsell modal.
  const actions = html.slice(html.indexOf('class="detail-actions"'));
  assert.ok(/<a class="btn btn-gold"[^>]*href=/.test(actions), "the primary action must be a real link");
  assert.ok(!actions.includes("openUpgrade()"), "the primary action must not be the upsell stub");

  // And the list cards offer the same link without opening the detail page.
  const ranked = app.rankedOpps(app.state.profile);
  assert.ok(app.viewOpportunities(ranked).includes(opp.sourceUrl), "list cards link to the official call");
});

test("a curated reference entry says so instead of offering a fake link", () => {
  const app = loadApp({
    opportunities: [
      {
        id: "hu-demo",
        title: "Vállalati digitalizáció",
        program: "GINOP Plusz",
        programShort: "HU",
        sourceSystem: "HU_NATIONAL",
        sourceRef: "GINOP_PLUSZ_DIG_felhivas_v1.3",
        sourceUrl: null,
        submissionUrl: null,
        curated: true,
        status: "open",
        deadline: "2027-01-30",
        intensity: 0.5,
        fundingMin: 5e6,
        fundingMax: 50e6,
        goals: ["digitalization"],
        sectors: [],
        docs: ["Utolsó lezárt évi beszámoló"],
        consortium: { required: false, minPartners: 1, minCountries: 1 },
        hard: [],
        soft: [],
      },
    ],
  });
  app.state.profile = { ...app.DEMO_PROFILE };
  app.TODAY = new Date("2026-09-11");
  app.state.detailId = "hu-demo";

  const html = app.viewDetail();
  assertRendersHtml(html, "viewDetail (curated entry)");
  assert.ok(html.includes("referencia-bejegyzés"), "a curated entry must identify itself as one");
  assert.ok(html.includes("palyazat.gov.hu"), "and point at the portal where real calls appear");
  assert.ok(!/<a class="btn btn-gold"[^>]*href=/.test(html), "no apply link may be invented for it");
});

test("the search view survives every state it can be in", () => {
  const opp = normalizeEuRecord(RAW_EU_RECORD, { eurHuf: 364.45 });
  const app = loadApp({ opportunities: [opp] });
  app.state.profile = { ...app.DEMO_PROFILE };
  app.state.appTab = "search";

  assertRendersHtml(app.viewSearch(), "viewSearch (idle)");

  app.state.search.loading = true;
  assertRendersHtml(app.viewSearch(), "viewSearch (loading)");

  app.state.search.loading = false;
  app.state.search.error = "503 Service Unavailable";
  assertRendersHtml(app.viewSearch(), "viewSearch (error)");

  app.state.search.error = null;
  app.state.search.q = "hydrogen";
  app.state.search.result = { total: 0, page: 1, pageSize: 20, results: [], facets: {} };
  assertRendersHtml(app.viewSearch(), "viewSearch (no hits)");

  // A result row as /api/search actually returns it.
  app.state.search.result = {
    total: 1,
    page: 1,
    pageSize: 20,
    results: [
      {
        id: opp.id,
        title: opp.title,
        program: opp.program,
        sourceRef: opp.sourceRef,
        deadline: opp.deadline,
        daysLeft: 40,
        intensity: opp.intensity,
        fundingMax: opp.fundingMax,
        consortium: opp.consortium,
        goals: opp.goals,
        score: 78,
        blocked: false,
        estimated: false,
        band: { key: "relevant", label: "Releváns lehetőség" },
        blockedReasons: [],
      },
    ],
    facets: {
      program: [{ value: "HORIZON", count: 1 }],
      goals: [{ value: "ai", count: 1 }],
      actionCode: [{ value: "HORIZON-IA", count: 1 }],
      consortium: [{ value: "required", count: 1 }],
    },
  };
  const withHits = app.viewSearch();
  assertRendersHtml(withHits, "viewSearch (with hits)");
  assert.ok(withHits.includes(opp.title), "the result title should render");
  assert.ok(withHits.includes("HORIZON"), "facet values should render");
});

test("screens stay intact when the catalog is empty or a call lacks a budget", () => {
  const empty = loadApp({ opportunities: [] });
  empty.state.profile = { ...empty.DEMO_PROFILE };
  assertRendersHtml(empty.viewDashboard(empty.rankedOpps(empty.state.profile)), "viewDashboard (empty catalog)");
  assertRendersHtml(empty.viewSearch(), "viewSearch (empty catalog)");

  // Many real topics publish no contribution range at all.
  const raw = JSON.parse(JSON.stringify(RAW_EU_RECORD));
  delete raw.metadata.budgetOverview;
  const opp = normalizeEuRecord(raw, { eurHuf: 364.45 });
  assert.equal(opp.fundingMin, null, "a call without a budget table has no funding floor");

  const app = loadApp({ opportunities: [opp] });
  app.state.profile = { ...app.DEMO_PROFILE };
  app.state.detailId = opp.id;
  assertRendersHtml(app.viewDetail(), "viewDetail (no budget published)");
});

test("the funnel screens render before and after the catalog arrives", () => {
  // The landing page and the free assessment are reachable before any data has
  // loaded, so neither may depend on the catalog being there.
  const cold = loadApp();
  assertRendersHtml(cold.viewLanding(), "viewLanding (no catalog)");
  assertRendersHtml(cold.viewAssess(), "viewAssess (no catalog)");

  cold.state.ob.data = { goals: [], funding_pref: ["non_refundable"] };
  for (let step = 0; step < cold.OB_STEPS.length; step++) {
    cold.state.ob.step = step;
    assertRendersHtml(cold.viewOnboard(), `viewOnboard step ${step} (${cold.OB_STEPS[step].type})`);
  }

  const opp = normalizeEuRecord(RAW_EU_RECORD, { eurHuf: 364.45 });
  const warm = loadApp({ opportunities: [opp] });
  warm.state.profile = { ...warm.DEMO_PROFILE };
  warm.state.subscription = { active: true, tier: "pro" };
  assertRendersHtml(warm.viewPlus(), "viewPlus (with catalog)");
  assertRendersHtml(warm.viewSaved(warm.rankedOpps(warm.state.profile)), "viewSaved");

  // And Hunter Plus must say so rather than throw when nothing is loaded.
  const empty = loadApp({ opportunities: [] });
  empty.state.profile = { ...empty.DEMO_PROFILE };
  empty.state.subscription = { active: true, tier: "pro" };
  assertRendersHtml(empty.viewPlus(), "viewPlus (empty catalog)");
});

test("onboarding derives SME status from headcount and captures consortium capability", () => {
  const app = loadApp();
  app.state.ob.data = { goals: [], funding_pref: [] };

  app.obSet("employees", 28);
  assert.equal(app.state.ob.data.orgType, "sme", "28 staff is an SME under the EU definition");

  app.obSet("employees", 900);
  assert.equal(app.state.ob.data.orgType, "large");

  // An explicit choice must survive a later headcount edit.
  app.obSet("orgType", "research");
  app.obSet("employees", 12);
  assert.equal(app.state.ob.data.orgType, "research");

  const setupStep = app.OB_STEPS.findIndex((s) => s.type === "setup");
  assert.ok(setupStep > -1, "onboarding should ask how the company would apply");
  assert.equal(app.obStepValid(setupStep), false, "the step is incomplete until consortium capability is answered");
  app.obSet("consortium_ready", true);
  assert.equal(app.obStepValid(setupStep), true);
});

test("the sign-in screen renders in both modes and surfaces errors", () => {
  const app = loadApp();

  app.state.screen = "auth";
  app.state.auth.mode = "login";
  const login = app.viewAuth();
  assertRendersHtml(login, "viewAuth (login)");
  assert.ok(login.includes('id="au_user"') && login.includes('id="au_pass"'));
  assert.ok(!login.includes('id="au_company"'), "the company field belongs to registration");

  app.state.auth.mode = "register";
  const register = app.viewAuth();
  assert.ok(register.includes('id="au_company"'), "registration asks for the company");

  app.state.auth.error = "Hibás felhasználónév vagy jelszó.";
  assert.ok(app.viewAuth().includes("Hibás felhasználónév"), "the server's message is shown, not an HTTP code");

  // The demo credentials are surfaced only while the default password stands.
  app.state.auth.error = null;
  app.state.auth.mode = "login";
  app.state.auth.adminSeed = { usingDefaultPassword: true, username: "admin" };
  assert.ok(app.viewAuth().includes("admin"), "the demo hint helps a presenter sign in");
  app.state.auth.adminSeed = { usingDefaultPassword: false, username: "admin" };
  assert.ok(!app.viewAuth().includes("Bemutató hozzáférés"), "and disappears once the password is changed");
});

test("the account screen shows the subscription and the profile history", () => {
  const app = loadApp();
  app.state.profile = { ...app.DEMO_PROFILE };
  app.state.auth.user = {
    username: "alfa",
    company: "Alfa Gyártó Kft.",
    role: "user",
    subscription: { status: "active", plan: "monthly", active: true, daysLeft: 22, validUntil: "2026-10-04T00:00:00.000Z", grantedBy: "admin" },
    entitlements: { tier: "subscriber", maxResults: Infinity, explanations: true },
  };
  app.state.auth.entitlements = app.state.auth.user.entitlements;
  app.state.history.data = {
    current: app.DEMO_PROFILE,
    versions: [
      { version: 2, at: "2026-09-11T10:00:00.000Z", source: "profile form", changed: [{ field: "employees", from: 28, to: 45 }, { field: "investment_value", from: 30e6, to: 80e6 }] },
      { version: 1, at: "2026-09-10T10:00:00.000Z", source: "onboarding", changed: [] },
    ],
    activity: [{ at: "2026-09-11T10:00:00.000Z", type: "profile.saved", version: 2 }],
  };

  const html = app.viewAccount();
  assertRendersHtml(html, "viewAccount");
  assert.ok(html.includes("Alfa Gyártó Kft."));
  assert.ok(html.includes("22"), "days remaining on the subscription are shown");
  // The diff has to read as a change, not as two opaque snapshots.
  assert.ok(html.includes("Létszám") && html.includes("45"), "a change names the field and the new value");
  assert.ok(html.includes("Cégprofil mentve"), "activity is translated, not shown as a raw event key");

  // Without a subscription the screen explains how access is granted.
  app.state.auth.user.subscription = { status: "none", active: false, daysLeft: null };
  app.state.auth.user.entitlements = { tier: "registered", maxResults: 3, explanations: false };
  app.state.auth.entitlements = app.state.auth.user.entitlements;
  const free = app.viewAccount();
  assert.ok(free.includes("adminisztrátor"), "it must say access is granted by an administrator");
});

test("the admin screen lists accounts and is closed to ordinary users", () => {
  const app = loadApp();
  app.state.profile = { ...app.DEMO_PROFILE };

  app.state.auth.user = { username: "alfa", role: "user", subscription: { status: "none", active: false }, entitlements: { tier: "registered" } };
  assert.ok(app.viewAdmin().includes("Nincs jogosultságod"), "a non-admin is refused in the UI too");

  app.state.auth.user = { username: "admin", role: "admin", subscription: { status: "active", active: true, daysLeft: null }, entitlements: { tier: "admin" } };
  app.state.admin.data = {
    stats: { users: 2, admins: 1, activeSubscriptions: 1, sessions: 2 },
    plans: [
      { id: "trial", label_hu: "5 napos próba", label_en: "5-day trial", days: 5 },
      { id: "monthly", label_hu: "Havi előfizetés", label_en: "Monthly subscription", days: 30 },
    ],
    users: [
      {
        id: "u_1", username: "alfa", company: "Alfa Gyártó Kft.", role: "user", disabled: false,
        createdAt: "2026-09-10T09:00:00.000Z", profileVersions: 2,
        subscription: { status: "none", active: false, daysLeft: null },
        entitlements: { tier: "registered" },
      },
    ],
  };

  const html = app.viewAdmin();
  assertRendersHtml(html, "viewAdmin");
  assert.ok(html.includes("alfa") && html.includes("Alfa Gyártó Kft."));
  assert.ok(html.includes("Havi előfizetés"), "the grantable plans appear in the control");
  assert.ok(html.includes("grantSubscription('u_1')"), "each row can grant access");
  assert.ok(html.includes("openUserHistory('u_1')"), "and open that account's history");
});

test("locked results show the count without leaking the calls", () => {
  const app = loadApp();
  app.state.profile = { ...app.DEMO_PROFILE };
  app.state.auth.entitlements = { tier: "registered", maxResults: 0, teasers: 12, explanations: false };

  // The teaser shows what the visitor gains — the fit and the money — and
  // nothing that names the call. The programme used to be the teaser; it is
  // now the product, so it must not appear.
  const locked = app.lockedCard({
    ref: "t0", locked: true, score: 81, band: { key: "relevant", label: "Releváns lehetőség" },
    grantHuf: 24000000, intensity: 0.8, closingSoon: true,
  });
  assertRendersHtml(locked, "lockedCard");
  assert.ok(locked.includes("81"), "the match score is the hook and is shown");
  assert.ok(locked.includes("redact"), "the call's identity is redacted, not blurred text");
  assert.ok(!/Horizon|LIFE|eu-x/.test(locked), "no programme, title or id reaches the page");

  const upsell = app.upsellBlock(9);
  assert.ok(upsell.includes("9"), "the number of withheld matches is stated honestly");
  assert.ok(upsell.includes("adminisztrátor"), "and how access is granted right now");

  // A subscriber is never shown the upsell.
  app.state.auth.entitlements = { tier: "subscriber", maxResults: Infinity, explanations: true };
  assert.equal(app.upsellBlock(9), "");
});

test("every string the UI shows has an English rendering", () => {
  // A single-file bilingual UI makes it very easy to add a Hungarian string and
  // forget the dictionary entry — the interface then silently stays Hungarian
  // for an English reader, with nothing failing. This catches that.
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const source = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));
  const app = loadApp();
  const TR = app.TR;

  const missing = new Set();
  for (const m of source.matchAll(/\bL\(\s*(["'])((?:(?!\1)[^\\]|\\.)*)\1\s*\)/g)) {
    const literal = m[2].replace(/\\"/g, '"').replace(/\\'/g, "'");
    if (literal.trim() && TR[literal] === undefined) missing.add(literal);
  }

  assert.deepEqual(
    [...missing],
    [],
    "these strings are passed to L() but absent from the TR dictionary, so they stay Hungarian in English mode"
  );

  // L() must also be total: an unknown key returns the input rather than
  // "undefined", so a miss degrades to Hungarian instead of breaking the page.
  app.state.lang = "en";
  assert.equal(app.L("Belépés"), "Sign in");
  assert.equal(app.L("egy teljesen ismeretlen szöveg"), "egy teljesen ismeretlen szöveg");
  assert.equal(app.L(undefined), undefined);
  app.state.lang = "hu";
  assert.equal(app.L("Belépés"), "Belépés", "Hungarian mode returns the source string untouched");
});

test("the language toggle reaches every screen, including sign-in", () => {
  const app = loadApp();
  app.state.profile = { ...app.DEMO_PROFILE };

  // The sign-in screen is the first thing a visitor sees, so it is the one that
  // most needs the toggle — it had none.
  app.state.screen = "auth";
  assert.ok(app.viewAuth().includes("setLang("), "the sign-in screen must offer a language toggle");
  assert.ok(app.viewLanding().includes("setLang("), "so must the landing page");
  app.state.ob.data = { goals: [], funding_pref: [] };
  assert.ok(app.viewOnboard().includes("setLang("), "and onboarding");
  assert.ok(app.viewAssess().includes("setLang("), "and the free assessment");
  assert.ok(app.viewApp().includes("setLang("), "and the application shell");
});

test("the new screens render fully in English", () => {
  const app = loadApp();
  app.state.lang = "en";
  app.state.profile = { ...app.DEMO_PROFILE };
  app.state.auth.user = {
    username: "alfa", company: "Alfa Kft.", role: "admin",
    subscription: { status: "active", plan: "monthly", active: true, daysLeft: 12, validUntil: "2026-09-24T00:00:00.000Z", grantedBy: "admin" },
    entitlements: { tier: "admin", maxResults: Infinity, explanations: true },
  };
  app.state.auth.entitlements = app.state.auth.user.entitlements;
  app.state.history.data = { current: app.DEMO_PROFILE, versions: [], activity: [] };
  app.state.admin.data = {
    stats: { users: 1, admins: 1, activeSubscriptions: 1, sessions: 1 },
    plans: [{ id: "monthly", label_hu: "Havi előfizetés", label_en: "Monthly subscription", days: 30 }],
    users: [],
  };

  // Hungarian-only diacritics are the giveaway that a string was never
  // translated. Programme and place names legitimately keep theirs, so the
  // check looks for the specific words the new screens would leak.
  const leaks = ["Előfizetés", "Felhasználónév", "Kijelentkezés", "Keresés", "Betöltés", "Visszaállítás", "Adminisztráció"];
  for (const [name, html] of [
    ["viewAuth", app.viewAuth()],
    ["viewAccount", app.viewAccount()],
    ["viewAdmin", app.viewAdmin()],
    ["viewSearch", app.viewSearch()],
  ]) {
    for (const word of leaks) {
      assert.ok(!html.includes(word), `${name} still shows the Hungarian "${word}" in English mode`);
    }
  }

  assert.ok(app.viewAuth().includes("Sign in"));
  assert.ok(app.viewAccount().includes("Subscription"));
  assert.ok(app.viewAdmin().includes("Users"), "the user list is titled in English");
});

test("an administrator can switch between the client view and the console", () => {
  const app = loadApp();
  app.state.profile = { ...app.DEMO_PROFILE };

  // An ordinary account has no switcher at all.
  app.state.auth.user = { username: "alfa", role: "user", company: "Alfa Kft.", subscription: { status: "none", active: false }, entitlements: { tier: "registered" } };
  assert.equal(app.workspaceSwitch(), "", "only an administrator gets the switcher");
  assert.ok(!app.viewApp().includes("setWorkspace("), "and it is absent from their shell");

  app.state.auth.user = { username: "admin", role: "admin", company: "Hunter", subscription: { status: "active", active: true, daysLeft: null }, entitlements: { tier: "admin" } };
  app.state.auth.entitlements = { tier: "admin", maxResults: Infinity, explanations: true };

  // Client view shows the product's own navigation.
  app.state.workspace = "user";
  const clientView = app.viewApp();
  assert.ok(clientView.includes("setWorkspace('admin')"), "the switcher offers the console");
  assert.ok(clientView.includes("setTab('dashboard')"), "and the client navigation is present");
  assert.ok(!clientView.includes("setTab('adminOverview')"), "without the console's own tabs");

  // Switching moves both the workspace and the landing tab.
  app.setWorkspace("admin");
  assert.equal(app.state.workspace, "admin");
  assert.equal(app.state.appTab, "adminOverview", "the console opens on its overview");

  const console_ = app.viewApp();
  assert.ok(console_.includes("setTab('adminOverview')"));
  assert.ok(console_.includes("setTab('adminSystem')"));
  assert.ok(!console_.includes("setTab('calendar')"), "the client's screens are not in the console");

  // A stale tab from the other workspace must not survive the switch.
  app.state.appTab = "calendar";
  assert.ok(app.viewApp().includes("setTab('adminOverview')"));
  assert.equal(app.state.appTab, "adminOverview", "an out-of-workspace tab falls back to the overview");
});

test("an administrator can reach the other workspace on a phone", () => {
  const app = loadApp();
  app.state.profile = { ...app.DEMO_PROFILE };

  // The rail is hidden below 900px, so the floating control is the only way
  // across on a phone. A client never sees it.
  app.state.auth.user = { username: "alfa", role: "user", company: "Alfa Kft.", subscription: { status: "none", active: false }, entitlements: { tier: "registered" } };
  assert.equal(app.workspaceSwitchMobile(), "", "only an administrator gets it");
  assert.ok(!app.viewApp().includes("mobile-ws"), "and it is absent from their shell");

  app.state.auth.user = { username: "admin", role: "admin", company: "Hunter", subscription: { status: "active", active: true, daysLeft: null }, entitlements: { tier: "admin" } };
  app.state.auth.entitlements = { tier: "admin", maxResults: Infinity, explanations: true };

  // It always offers the workspace the admin is not in.
  app.state.workspace = "user";
  const fromClient = app.viewApp();
  assert.ok(fromClient.includes("mobile-ws"), "the control is in the client shell");
  assert.ok(fromClient.includes("setWorkspace('admin')"), "and it points at the console");
  assert.ok(!fromClient.includes("setTab('adminOverview')"), "without leaking the console's tabs");

  app.setWorkspace("admin");
  const fromConsole = app.viewApp();
  assert.ok(fromConsole.includes("setWorkspace('user')"), "from the console it points back");
  assert.ok(!fromConsole.includes("setTab('calendar')"), "without leaking the client's tabs");
});

test("the admin overview surfaces what needs acting on", () => {
  const app = loadApp();
  app.state.profile = { ...app.DEMO_PROFILE };
  app.state.workspace = "admin";
  app.state.auth.user = { username: "admin", role: "admin", subscription: { status: "active", active: true }, entitlements: { tier: "admin" } };
  app.state.admin.overview = {
    stats: { users: 4, admins: 1, disabled: 0, activeSubscriptions: 1, withoutSubscription: 2, newThisWeek: 3, sessions: 2, profilesSaved: 3 },
    byPlan: { monthly: 1 },
    expiringSoon: [{ id: "u_2", username: "lejar", company: "Lejáró Kft.", subscription: { plan: "monthly", status: "active", active: true, daysLeft: 4 }, daysLeft: 4, createdAt: "2026-08-01T00:00:00.000Z" }],
    awaitingAccess: [{ id: "u_3", username: "varakozo", company: "Váró Kft.", subscription: { status: "none", active: false, daysLeft: null }, createdAt: "2026-09-10T00:00:00.000Z" }],
    recentSignups: [{ id: "u_3", username: "varakozo", company: "Váró Kft.", subscription: { status: "none", active: false, daysLeft: null }, createdAt: "2026-09-10T00:00:00.000Z" }],
    activity: [{ at: "2026-09-11T10:00:00.000Z", type: "account.login", username: "varakozo" }],
    plans: [{ id: "trial", label_hu: "5 napos próba", label_en: "5-day trial" }, { id: "monthly", label_hu: "Havi előfizetés", label_en: "Monthly subscription" }],
    system: {
      catalogTotal: 593, catalogOpen: 326, builtAt: "2026-09-11T17:00:00.000Z", builtBy: "live-refresh", eurHuf: 364.45,
      refresh: { enabled: true, intervalHours: 6, lastSuccessAt: "2026-09-11T17:00:00.000Z", nextRunAt: "2026-09-11T23:00:00.000Z", runs: 1, failures: 0, lastError: null },
    },
  };

  const html = app.viewAdminOverview();
  assertRendersHtml(html, "viewAdminOverview");
  // The two lists an admin has to act on, each with a one-click action.
  assert.ok(html.includes("varakozo") && html.includes("quickGrant('u_3','monthly')"), "awaiting access can be granted in one click");
  assert.ok(html.includes("lejar") && html.includes("quickGrant('u_2','monthly')"), "an expiring subscription can be extended in one click");
  assert.ok(html.includes("4"), "days remaining are shown");
  assert.ok(html.includes("account.login") || html.includes("Belépés") || html.includes("Signed in"), "cross-account activity is listed");

  const system = app.viewAdminSystem();
  assertRendersHtml(system, "viewAdminSystem");
  assert.ok(system.includes("593") && system.includes("326"), "catalog size is reported");
  assert.ok(system.includes("364.45"), "so is the exchange rate in use");
  assert.ok(system.includes("triggerRefresh()"), "and a refresh can be triggered by hand");

  // A non-admin must not reach either.
  app.state.auth.user = { username: "alfa", role: "user", subscription: { status: "none", active: false }, entitlements: { tier: "registered" } };
  assert.ok(app.viewAdminOverview().includes("Nincs jogosultságod"));
  assert.ok(app.viewAdminSystem().includes("Nincs jogosultságod"));
});

test("signing out is reachable from the shell, and the shell survives a missing profile", () => {
  const app = loadApp();
  app.state.profile = { ...app.DEMO_PROFILE };

  app.state.auth.user = { username: "alfa", role: "user", company: "Alfa Kft.", subscription: { status: "none", active: false }, entitlements: { tier: "registered" } };
  const shell = app.viewApp();
  assert.ok(shell.includes("logout()"), "sign-out must be present in the shell, not only on the account page");
  assert.ok(shell.includes("rail-out"), "and as its own control rather than buried in the navigation");

  // Signed out, the same slot offers signing in instead.
  app.state.auth.user = null;
  const anonymous = app.viewApp();
  assert.ok(!anonymous.includes("logout()"));
  assert.ok(anonymous.includes("goAuth('login')"));

  // An administrator has no company profile of their own; the shell reads one,
  // so it must not crash on them.
  app.state.profile = null;
  app.state.auth.user = { username: "admin", role: "admin", company: "Hunter", subscription: { status: "active", active: true }, entitlements: { tier: "admin" } };
  app.state.auth.entitlements = { tier: "admin", maxResults: Infinity, explanations: true };
  app.state.workspace = "admin";
  app.state.admin.overview = null;
  assertRendersHtml(app.viewApp(), "viewApp (admin without a company profile)");
});

test("every endpoint the client calls exists on the server", () => {
  // A single-file front end makes it easy to leave a fetch pointing at a route
  // that was renamed or removed; the call fails silently in the browser.
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const server = fs.readFileSync(path.join(ROOT, "server", "server.js"), "utf8");

  const called = new Set();
  for (const m of html.matchAll(/["'`](\/api\/[^"'`?\s]*)/g)) {
    // Template placeholders stand in for ids; compare the static prefix.
    called.add(m[1].replace(/\$\{[^}]*\}/g, ":id"));
  }
  assert.ok(called.size > 0, "the client should call the API at all");

  for (const route of called) {
    const segments = route.split("/").filter(Boolean).slice(1); // drop "api"
    const known =
      server.includes(`"/${["api", ...segments].join("/")}"`) ||
      // Parameterised routes are matched by regex on the server.
      segments.some((seg) => seg !== ":id" && new RegExp(`/api/[^"']*${seg}`).test(server));
    assert.ok(known, `index.html calls ${route}, which the server does not serve`);
  }
});

test("an anonymous visitor's data stays in their browser", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.ok(html.includes('localStorage.setItem("hunter_state"'), "the profile is kept in the browser");

  // Anonymous scoring requests carry the profile rather than relying on shared
  // server state, which is what keeps two visitors from seeing each other.
  const app = loadApp();
  app.state.profile = { company: "Teszt Kft.", goals: ["ai"] };
  app.state.answers = { consortium_ready: true };
  app.state.saved = ["eu-x"];
  const identity = app.api.identity();
  assert.equal(identity.profile.company, "Teszt Kft.", "requests carry the profile the browser holds");
  assert.equal(identity.answers.consortium_ready, true);
  assert.deepEqual([...identity.saved], ["eu-x"]);

  // Session cookies must actually be sent, or a signed-in user looks anonymous.
  assert.ok(html.includes('credentials:"same-origin"'), "the session cookie must accompany API calls");
});

test("an unknown opportunity id shows a message instead of throwing", () => {
  const app = loadApp({ opportunities: [] });
  app.state.profile = { ...app.DEMO_PROFILE };
  app.state.detailId = "eu-does-not-exist";
  const html = app.viewDetail();
  assert.ok(html.includes("nem elérhető"), "should explain that the call is gone");
});

test("answering a question applies to every call that asks it", () => {
  const opp = normalizeEuRecord(RAW_EU_RECORD, { eurHuf: 364.45 });
  const app = loadApp({ opportunities: [opp] });
  app.state.profile = { ...app.DEMO_PROFILE };
  app.TODAY = new Date("2026-09-11");

  const before = app.hunterScore(opp, app.state.profile);
  assert.equal(before.elig.status, "INSUFFICIENT_DATA", "consortium capability starts unknown");

  app.answerQuiz(opp.id, "consortium_ready", true);
  assert.equal(app.state.answers.consortium_ready, true, "the answer is stored globally, not per call");

  const after = app.hunterScore(opp, app.state.profile);
  assert.notEqual(after.elig.status, "INSUFFICIENT_DATA", "the verdict should resolve");
  assert.ok(after.score > 0, "a score should now be produced");

  app.answerQuiz(opp.id, "consortium_ready", false);
  const refused = app.hunterScore(opp, app.state.profile);
  assert.equal(refused.blocked, true, "declining a consortium blocks a consortium-only call");
});

// ---------------------------------------------------------------------------
// CRM screens
// ---------------------------------------------------------------------------

/**
 * The CRM is rendered entirely from what the API sends, so these fixtures are
 * shaped exactly like the real responses. The point of the tests below is the
 * same as everywhere else in this file: a screen that throws, or that prints
 * "undefined" where a number should be, is the failure mode a single-file front
 * end makes easy.
 */
const CRM_VOCABULARY = {
  stages: [
    { id: "new", label_hu: "Új", label_en: "New" },
    { id: "contacted", label_hu: "Megkeresve", label_en: "Contacted" },
    { id: "qualified", label_hu: "Minősítve", label_en: "Qualified" },
    { id: "proposal", label_hu: "Ajánlat / próba", label_en: "Proposal / trial" },
    { id: "won", label_hu: "Megnyert", label_en: "Won" },
    { id: "lost", label_hu: "Elveszett", label_en: "Lost" },
  ],
  lifecycles: [
    { id: "lead", label_hu: "Érdeklődő", label_en: "Lead" },
    { id: "registered", label_hu: "Regisztrált", label_en: "Registered" },
    { id: "trial", label_hu: "Próbaidő", label_en: "Trial" },
    { id: "subscriber", label_hu: "Előfizető", label_en: "Subscriber" },
    { id: "expired", label_hu: "Lejárt", label_en: "Lapsed" },
  ],
  sources: [
    { id: "assessment", label_hu: "Ingyenes felmérés", label_en: "Free assessment" },
    { id: "signup", label_hu: "Önálló regisztráció", label_en: "Self sign-up" },
  ],
  plans: [{ id: "monthly", label_hu: "Havi előfizetés", label_en: "Monthly subscription", days: 30, priceHUF: 5990, monthlyHUF: 5990 }],
};

const CRM_CONTACT = {
  id: "u_2", kind: "account", username: "betateszt", email: "info@beta.hu", company: "Beta Kft.",
  role: "user", disabled: false, createdAt: "2026-08-01T10:00:00.000Z", lastLoginAt: "2026-09-10T08:00:00.000Z",
  lifecycle: "subscriber", stage: "won", daysInStage: 4, owner: "admin", tags: ["gyarto"], source: "signup", lostReason: null,
  subscription: { status: "active", plan: "monthly", active: true, validUntil: "2026-10-12T00:00:00.000Z", daysLeft: 30, grantedBy: "admin" },
  monthlyValueHuf: 5990,
  engagement: {
    score: 42, window: 30, daysSinceActive: 2, lastActiveAt: "2026-09-10T08:00:00.000Z",
    signals: [{ type: "account.login", count: 3, points: 12, label_hu: "Belépés", label_en: "Sign-in" }],
    band: { key: "medium", label_hu: "Mérsékelt", label_en: "Moderate" },
  },
  profileVersions: 2, hasProfile: true,
  profile: { company: "Beta Kft.", employees: 28, county: "Pest", teaor: "28", goals: ["digitalization"], investment_value: 30000000, projectName: "ERP bevezetés" },
  notes: 1, lastNote: null, openTasks: 1, overdueTasks: 0,
  nextTask: { id: "t1", title: "Visszahívás", dueAt: "2026-09-20T00:00:00.000Z" },
};

const CRM_LEAD = {
  id: "l_1", kind: "lead", company: "Alfa Kft.", contactName: "Nagy Anna", email: "a@alfa.hu", phone: null,
  lifecycle: "lead", stage: "new", source: "assessment", createdAt: "2026-09-05T00:00:00.000Z", readiness: 78,
  profile: { employees: 30, county: "Pest", investment_value: 30000000 }, tags: [], convertedUserId: null,
  engagement: { score: 0, signals: [], window: 30, daysSinceActive: null, band: { key: "none", label_hu: "Nincs aktivitás", label_en: "No activity" } },
  openTasks: 0, overdueTasks: 0, notes: 0, daysInStage: 7,
  subscription: { status: "none", plan: null, active: false, validUntil: null, daysLeft: null }, monthlyValueHuf: 0,
};

const CRM_METRICS = {
  contacts: 3, accounts: 2, leads: 1, subscribers: 1, trials: 0, expired: 0, registered: 1,
  mrrHuf: 5990, arrHuf: 71880, arpaHuf: 5990, pipelineValueHuf: 11980, openDeals: 2,
  byStage: { new: 1, contacted: 0, qualified: 0, proposal: 0, won: 1, lost: 0 },
  byPlan: { monthly: { count: 1, monthlyHuf: 5990 } }, bySource: { signup: 2, assessment: 1 },
  trialStarted: 0, trialConverted: 0, trialConversionPct: null, lapsed30d: 0, churnPct: null, engagedAccounts: 1,
  warmUnsubscribed: [{ id: "u_3", company: "Gamma Zrt.", username: "gamma", lifecycle: "registered", score: 33, daysSinceActive: 1 }],
};

/** An app signed in as an administrator with the CRM responses already loaded. */
function loadCrmApp(lang = "hu") {
  const app = loadApp();
  app.state.lang = lang;
  app.state.profile = { ...app.DEMO_PROFILE };
  app.state.auth.user = {
    id: "u_1", username: "admin", role: "admin", company: "Hunter",
    subscription: { status: "active", plan: "admin", active: true, daysLeft: null },
    entitlements: { tier: "admin", maxResults: Infinity, explanations: true },
  };
  app.state.auth.entitlements = app.state.auth.user.entitlements;
  app.state.workspace = "admin";
  app.state.appTab = "crm";
  app.state.crm.vocabulary = CRM_VOCABULARY;
  app.state.crm.board = {
    vocabulary: CRM_VOCABULARY,
    metrics: CRM_METRICS,
    trend: [
      { key: "2026-08", year: 2026, month: 8, signups: 1, leads: 1, won: 0 },
      { key: "2026-09", year: 2026, month: 9, signups: 1, leads: 0, won: 1 },
    ],
    board: { new: [CRM_LEAD], contacted: [], qualified: [], proposal: [], won: [CRM_CONTACT], lost: [] },
    tasks: [{ id: "t1", at: "2026-09-01T00:00:00.000Z", by: "admin", title: "Visszahívás", dueAt: "2026-09-01T00:00:00.000Z", doneAt: null, subjectId: "u_2", subjectKind: "account", company: "Beta Kft.", username: "betateszt" }],
    engagementWindowDays: 30, generatedAt: "2026-09-12T06:00:00.000Z",
  };
  app.state.crm.list = { total: 2, page: 1, pageSize: 25, contacts: [CRM_CONTACT, CRM_LEAD], facets: {}, owners: ["admin"], tags: ["gyarto"], vocabulary: CRM_VOCABULARY };
  app.state.crm.leads = { leads: [CRM_LEAD], vocabulary: CRM_VOCABULARY };
  return app;
}

test("every CRM screen renders, in both languages and when empty", () => {
  for (const lang of ["hu", "en"]) {
    const app = loadCrmApp(lang);
    for (const tab of ["board", "contacts", "leads", "insights"]) {
      app.state.crm.tab = tab;
      assertRendersHtml(app.viewCrm(), `viewCrm/${tab} (${lang})`);
    }

    // A brand-new install has no contacts at all; every screen has to say so
    // rather than divide by zero.
    app.state.crm.board.board = { new: [], contacted: [], qualified: [], proposal: [], won: [], lost: [] };
    app.state.crm.board.tasks = [];
    app.state.crm.board.trend = [{ key: "2026-09", year: 2026, month: 9, signups: 0, leads: 0, won: 0 }];
    app.state.crm.board.metrics = {
      ...CRM_METRICS, contacts: 0, accounts: 0, leads: 0, subscribers: 0, registered: 0,
      mrrHuf: 0, arrHuf: 0, arpaHuf: 0, pipelineValueHuf: 0, openDeals: 0,
      byStage: { new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0 },
      byPlan: {}, bySource: {}, warmUnsubscribed: [],
    };
    app.state.crm.list = { total: 0, page: 1, pageSize: 25, contacts: [], facets: {}, owners: [], tags: [], vocabulary: CRM_VOCABULARY };
    app.state.crm.leads = { leads: [], vocabulary: CRM_VOCABULARY };
    for (const tab of ["board", "contacts", "leads", "insights"]) {
      app.state.crm.tab = tab;
      assertRendersHtml(app.viewCrm(), `empty viewCrm/${tab} (${lang})`);
    }
  }
});

test("the contact page renders for an account and for a lead", () => {
  const detail = {
    contact: CRM_CONTACT, profile: CRM_CONTACT.profile,
    notes: [{ id: "n1", at: "2026-09-10T09:00:00.000Z", by: "admin", kind: "call", body: "Egyeztetve." }],
    tasks: [{ id: "t1", at: "2026-09-01T00:00:00.000Z", by: "admin", title: "Visszahívás", dueAt: "2026-09-20T00:00:00.000Z", doneAt: null }],
    versions: [{ version: 2, at: "2026-09-02T00:00:00.000Z", source: "onboarding", changed: [{ field: "employees", from: 28, to: 45 }], profile: {} }],
    subscriptions: [{ at: "2026-09-01T00:00:00.000Z", action: "granted", by: "admin", plan: "monthly", days: 30 }],
    timeline: [
      { at: "2026-09-10T09:00:00.000Z", kind: "note", type: "note.call", detail: { kind: "call", body: "Egyeztetve." } },
      { at: "2026-09-04T00:00:00.000Z", kind: "task", type: "task.created", detail: { title: "Visszahívás", dueAt: "2026-09-20T00:00:00.000Z" } },
      { at: "2026-09-03T00:00:00.000Z", kind: "activity", type: "opportunity.viewed", detail: { title: "HORIZON call" } },
      { at: "2026-09-02T00:00:00.000Z", kind: "profile", type: "profile.version", detail: { version: 2, changed: [{ field: "employees", from: 28, to: 45 }] } },
      { at: "2026-09-01T00:00:00.000Z", kind: "subscription", type: "subscription.granted", detail: { action: "granted", plan: "monthly", days: 30, by: "admin" } },
    ],
    savedCalls: [{ id: "eu-1", title: "AI for SMEs", program: "Horizon", deadline: "2027-01-20" }],
    plans: CRM_VOCABULARY.plans, vocabulary: CRM_VOCABULARY,
  };

  for (const lang of ["hu", "en"]) {
    const app = loadCrmApp(lang);
    app.state.crm.openId = "u_2";
    app.state.crm.contact = detail;
    const account = app.viewCrmContact();
    assertRendersHtml(account, `viewCrmContact/account (${lang})`);
    assert.ok(account.includes("grantFromCrm("), "an account can be granted access from its own page");
    assert.ok(account.includes("addCrmNote("), "and a note can be written on it");

    // A lead has no subscription and no activity log; the same page must hold.
    app.state.crm.openId = "l_1";
    app.state.crm.contact = { ...detail, contact: CRM_LEAD, profile: CRM_LEAD.profile, subscriptions: [], versions: [], savedCalls: [] };
    const lead = app.viewCrmContact();
    assertRendersHtml(lead, `viewCrmContact/lead (${lang})`);
    assert.ok(!lead.includes("grantFromCrm("), "a lead has no account to grant access to");

    // Loading and error states must not throw either.
    app.state.crm.contact = null;
    assertRendersHtml(app.viewCrmContact(), `viewCrmContact/loading (${lang})`);
    app.state.crm.contactError = "Nincs ilyen kapcsolat.";
    assertRendersHtml(app.viewCrmContact(), `viewCrmContact/error (${lang})`);
  }
});

test("the CRM screens are fully translated", () => {
  const app = loadCrmApp("en");
  const leaks = ["Betöltés", "Kapcsolatok", "Érdeklődők", "Feljegyzések", "Megnyitás", "Teendők", "Hozzáférés", "Aktivitás", "Cégprofil"];
  for (const tab of ["board", "contacts", "leads", "insights"]) {
    app.state.crm.tab = tab;
    const html = app.viewCrm();
    for (const word of leaks) {
      assert.ok(!html.includes(word), `viewCrm/${tab} still shows the Hungarian "${word}" in English mode`);
    }
  }
  app.state.crm.tab = "board";
  assert.ok(app.viewCrm().includes("Pipeline"), "the board tab is named in English");
  assert.ok(app.viewCrm().includes("MRR"), "and the revenue tile is there");
});

test("the CRM is an administrator screen, reachable only from their workspace", () => {
  const app = loadCrmApp();
  assert.ok(app.viewApp().includes("setTab('crm')"), "an administrator gets the CRM in the rail");

  // An ordinary account must not see it, and must not be able to render it.
  app.state.auth.user = { username: "alfa", role: "user", company: "Alfa Kft.", subscription: { status: "none", active: false }, entitlements: { tier: "registered" } };
  app.state.auth.entitlements = { tier: "registered", maxResults: 3, explanations: false };
  app.state.workspace = "user";
  assert.ok(!app.viewApp().includes("setTab('crm')"), "a client never sees the CRM tab");
  assert.ok(app.viewCrm().includes("Nincs jogosultságod"), "and the view itself refuses to render for them");
});

test("the free assessment offers a follow-up, and only records one with consent", () => {
  const app = loadApp({ opportunities: [] });
  app.state.assess = {
    step: 6,
    answers: { employees: 30, county: "Pest", industryId: "manuf", closed_business_years: 3, goals: ["digitalization"], investment_value: 30000000 },
  };

  const result = app.assessResult();
  assertRendersHtml(result, "assessResult");
  assert.ok(result.includes("submitLead("), "the assessment has to produce a lead, or it is not a funnel");
  assert.ok(result.includes("lead_consent"), "and it must ask for consent before storing anything");

  // Nothing is sent when the consent box is unticked.
  let posted = null;
  app.api.post = async (path, body) => {
    posted = { path, body };
    return { success: true };
  };
  app.state.lead = { sent: false, busy: false, error: null };
  app.submitLead(78, []);
  assert.equal(posted, null, "without consent the address never leaves the browser");
  assert.ok(app.state.lead.error, "and the visitor is told why");

  // Once it is confirmed, the screen says so rather than offering the form again.
  app.state.lead = { sent: true, busy: false, error: null };
  const after = app.assessResult();
  assert.ok(!after.includes("lead_consent"), "a submitted form is replaced by its confirmation");
});
