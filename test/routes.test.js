import test from "node:test";
import assert from "node:assert/strict";
import { createRouter } from "../server/router.js";
import { registerAuthRoutes } from "../server/routes/authRoutes.js";
import { registerCatalogRoutes } from "../server/routes/catalogRoutes.js";
import { registerCrmRoutes } from "../server/routes/crmRoutes.js";
import { registerAdminRoutes } from "../server/routes/adminRoutes.js";

test("router matches exact and parameterized paths with URL decoding", async () => {
  const router = createRouter();
  let exactHit = false;
  let paramValue = null;

  router.get("/api/exact", () => {
    exactHit = true;
  });
  router.get("/api/items/:id/details", ({ params }) => {
    paramValue = params.id;
  });

  const exactDispatched = await router.dispatch(
    { method: "GET" },
    {},
    new URL("http://localhost/api/exact")
  );
  assert.equal(exactDispatched, true);
  assert.equal(exactHit, true);

  const paramDispatched = await router.dispatch(
    { method: "GET" },
    {},
    new URL("http://localhost/api/items/hello%20world/details")
  );
  assert.equal(paramDispatched, true);
  assert.equal(paramValue, "hello world");

  const missingDispatched = await router.dispatch(
    { method: "GET" },
    {},
    new URL("http://localhost/api/unknown")
  );
  assert.equal(missingDispatched, false);
});

test("authRoutes registers profile and password endpoints", async () => {
  const router = createRouter();
  const calls = [];
  registerAuthRoutes(router, {
    store: { findByUsername: () => null },
    send: (_req, _res, status, payload) => calls.push({ status, payload }),
    readBody: async () => ({}),
    currentUser: () => null,
    publicUser: (u) => u,
    entitlementsFor: () => ({ tier: "free" }),
    validateCredentials: () => null,
    hashPassword: () => ({ salt: "s", passwordHash: "h" }),
    verifyPassword: () => false,
    parseCookies: () => ({}),
    sessionCookie: () => "",
    clearCookie: () => "",
    SESSION_COOKIE: "hunter_session",
    SESSION_TTL_MS: 1000,
    COOKIE_SECURE: false,
    PLANS: [],
    adminSeed: { usingDefaultPassword: false, username: "admin" },
    normalizeProfile: (p) => p,
    DEMO_PROFILE: {},
    EMPTY_DB: {},
    loadDb: () => ({}),
    saveDb: () => {},
  });

  const resAuthMe = await router.dispatch({ method: "GET" }, {}, new URL("http://localhost/api/auth/me"));
  assert.equal(resAuthMe, true);
  assert.equal(calls[0].status, 200);

  const resPasswordAnon = await router.dispatch({ method: "POST" }, {}, new URL("http://localhost/api/auth/password"));
  assert.equal(resPasswordAnon, true);
  assert.equal(calls[1].status, 401);
});

test("adminRoutes and crmRoutes enforce authentication and role guards", async () => {
  const router = createRouter();
  const calls = [];
  const send = (_req, _res, status, payload) => calls.push({ status, payload });

  registerAdminRoutes(router, {
    store: { listUsers: () => [], stats: () => ({ sessions: 0 }) },
    catalogState: { opportunities: [], meta: null },
    currentUser: () => ({ id: "u1", role: "user" }),
    publicUser: (u) => u,
    send,
    readBody: async () => ({}),
    isSubscriptionActive: () => false,
    subscriptionDaysLeft: () => null,
    planById: () => null,
    PLANS: [],
    refresher: null,
  });

  registerCrmRoutes(router, {
    store: {},
    catalogState: { opportunities: [] },
    referenceDate: () => new Date(),
    send,
    sendBuffer: () => {},
    readBody: async () => ({ email: "invalid", consent: true }),
    currentUser: () => ({ id: "u1", role: "user" }),
    validateLead: () => ({ error: "Invalid email", code: "INVALID_EMAIL" }),
    hunterScore: () => ({ score: 0 }),
    daysToDeadline: () => 10,
    allContacts: () => [],
    buildContact: () => ({}),
    buildLeadContact: () => ({}),
    buildTimeline: () => [],
    portfolioMetrics: () => ({}),
    signupTrend: () => [],
    filterContacts: () => [],
    contactsToCsv: () => "",
    subjectExists: () => false,
    numParam: () => undefined,
    STAGES: {},
    STAGE_IDS: [],
    LIFECYCLES: {},
    LEAD_SOURCES: {},
    PLANS: [],
    priceList: () => [],
    NOTE_KINDS: [],
    ENGAGEMENT_WINDOW_DAYS: 30,
  });

  const adminOverview = await router.dispatch({ method: "GET" }, {}, new URL("http://localhost/api/admin/overview"));
  assert.equal(adminOverview, true);
  assert.equal(calls[0].status, 403);

  const crmBoard = await router.dispatch({ method: "GET" }, {}, new URL("http://localhost/api/admin/crm"));
  assert.equal(crmBoard, true);
  assert.equal(calls[1].status, 403);

  const leadPost = await router.dispatch({ method: "POST" }, {}, new URL("http://localhost/api/leads"));
  assert.equal(leadPost, true);
  assert.equal(calls[2].status, 400);
});
