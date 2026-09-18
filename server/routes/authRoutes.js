/**
 * Authentication and company profile endpoints.
 */
export function registerAuthRoutes(router, {
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
}) {
  router.post("/api/auth/register", async ({ req, res }) => {
    const body = await readBody(req);
    const { username, password, email, company } = body || {};
    const problem = validateCredentials(username, password);
    if (problem) return send(req, res, 400, { error: problem.message, code: problem.code });
    if (store.findByUsername(username)) {
      return send(req, res, 409, { error: "Ez a felhasználónév már foglalt.", code: "USERNAME_TAKEN" });
    }
    const { salt, passwordHash } = hashPassword(String(password));
    const user = store.createUser({ username: String(username).trim(), email, company, passwordHash, salt });
    store.recordActivity(user.id, "account.created", { username: user.username });

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
  });

  router.post("/api/auth/login", async ({ req, res }) => {
    const body = await readBody(req);
    const { username, password } = body || {};
    const user = store.findByUsername(username);
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
  });

  router.post("/api/auth/logout", async ({ req, res }) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) store.destroySession(token);
    res.setHeader("Set-Cookie", clearCookie());
    return send(req, res, 200, { success: true });
  });

  router.get("/api/auth/me", ({ req, res }) => {
    const user = currentUser(req);
    return send(req, res, 200, {
      user: publicUser(user),
      entitlements: entitlementsFor(user),
      plans: PLANS,
      adminSeed: { usingDefaultPassword: adminSeed.usingDefaultPassword, username: adminSeed.username },
    });
  });

  router.post("/api/auth/password", async ({ req, res }) => {
    const user = currentUser(req);
    if (!user) return send(req, res, 401, { error: "Bejelentkezés szükséges.", code: "LOGIN_REQUIRED" });
    const body = await readBody(req);
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
  });

  router.get("/api/profile/history", ({ req, res }) => {
    const user = currentUser(req);
    if (!user) return send(req, res, 401, { error: "Bejelentkezés szükséges.", code: "LOGIN_REQUIRED" });
    return send(req, res, 200, {
      current: user.profile || null,
      versions: store.profileHistory(user.id),
      activity: store.activity(user.id, 40),
    });
  });

  router.post("/api/profile/restore", async ({ req, res }) => {
    const user = currentUser(req);
    if (!user) return send(req, res, 401, { error: "Bejelentkezés szükséges.", code: "LOGIN_REQUIRED" });
    const body = await readBody(req);
    const version = Number(body?.version);
    const entry = store.profileHistory(user.id).find((v) => v.version === version);
    if (!entry) return send(req, res, 404, { error: `Nincs ilyen mentett verzió: ${version}`, code: "NO_SUCH_VERSION" });

    const profile = normalizeProfile(entry.profile);
    store.updateUser(user.id, { profile });
    store.recordProfile(user.id, profile, `restored from v${version}`);
    store.recordActivity(user.id, "profile.restored", { version });
    return send(req, res, 200, { success: true, profile, versions: store.profileHistory(user.id) });
  });

  router.get("/api/profile", ({ req, res }) => {
    const db = loadDb();
    const user = currentUser(req);
    return send(req, res, 200, {
      profile: user?.profile ? normalizeProfile(user.profile) : db.profile ? normalizeProfile(db.profile) : null,
      answers: user?.answers || db.answers,
      saved: user?.saved || db.saved,
      demoProfile: normalizeProfile(DEMO_PROFILE),
      versions: user ? store.profileHistory(user.id).length : 0,
      lastEuSync: db.lastEuSync,
    });
  });

  router.post("/api/profile", async ({ req, res }) => {
    const body = await readBody(req);
    const profile = normalizeProfile(body?.profile || body);
    const user = currentUser(req);
    if (user) {
      store.updateUser(user.id, { profile, company: profile.company || user.company });
      const entry = store.recordProfile(user.id, profile, body?.source || "profile form");
      store.recordActivity(user.id, "profile.saved", { version: entry.version, changed: entry.changed.length });
      return send(req, res, 200, { success: true, profile, version: entry.version, changed: entry.changed });
    }
    const db = loadDb();
    db.profile = profile;
    saveDb(db);
    return send(req, res, 200, { success: true, profile });
  });

  router.post("/api/profile/load-demo", ({ req, res }) => {
    const db = loadDb();
    db.profile = normalizeProfile({ ...DEMO_PROFILE });
    saveDb(db);
    return send(req, res, 200, { success: true, profile: db.profile });
  });

  router.post("/api/profile/reset", ({ req, res }) => {
    saveDb({ ...EMPTY_DB });
    return send(req, res, 200, { success: true });
  });
}
