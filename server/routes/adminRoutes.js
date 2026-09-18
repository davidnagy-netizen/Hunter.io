/**
 * Administrative operations: overview, user management, and subscription grants.
 */
export function registerAdminRoutes(router, {
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
}) {
  function requireAdmin(req, res) {
    const admin = currentUser(req);
    if (!admin) {
      send(req, res, 401, { error: "Bejelentkezés szükséges.", code: "LOGIN_REQUIRED" });
      return null;
    }
    if (admin.role !== "admin") {
      send(req, res, 403, { error: "Adminisztrátori jogosultság szükséges.", code: "ADMIN_REQUIRED" });
      return null;
    }
    return admin;
  }

  router.get("/api/admin/overview", ({ req, res }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

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
  });

  router.get("/api/admin/users", ({ req, res }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    return send(req, res, 200, {
      stats: store.stats(),
      plans: PLANS,
      users: store.listUsers().map((u) => ({
        ...publicUser(u),
        profileVersions: store.profileHistory(u.id).length,
        lastActivity: store.activity(u.id, 1)[0] || null,
      })),
    });
  });

  router.post("/api/admin/subscription", async ({ req, res }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const body = await readBody(req);
    const { userId, planId, days, note, revoke } = body || {};
    const target = store.getUser(userId);
    if (!target) return send(req, res, 404, { error: "Nincs ilyen felhasználó.", code: "NO_SUCH_USER" });

    if (revoke) {
      const subscription = {
        status: "none",
        plan: null,
        validUntil: null,
        grantedBy: admin.username,
        grantedAt: new Date().toISOString(),
        note: note || null,
      };
      store.updateUser(target.id, { subscription });
      store.recordSubscription(target.id, { action: "revoked", by: admin.username, note: note || null });
      store.recordActivity(target.id, "subscription.revoked", { by: admin.username });
      return send(req, res, 200, { success: true, user: publicUser(store.getUser(target.id)) });
    }

    const plan = planById(planId);
    if (!plan) return send(req, res, 400, { error: `Ismeretlen csomag: ${planId}`, code: "UNKNOWN_PLAN" });
    const grantDays = Number.isFinite(Number(days)) && Number(days) > 0 ? Number(days) : plan.days;

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
    store.recordSubscription(target.id, {
      action: "granted",
      by: admin.username,
      plan: plan.id,
      days: grantDays,
      validUntil,
      note: note || null,
    });
    store.recordActivity(target.id, "subscription.granted", { plan: plan.id, days: grantDays, by: admin.username });
    return send(req, res, 200, { success: true, user: publicUser(store.getUser(target.id)) });
  });

  router.post("/api/admin/user", async ({ req, res }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const body = await readBody(req);
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
  });

  router.get("/api/admin/history", ({ req, res, url }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const userId = url.searchParams.get("userId");
    const target = store.getUser(userId);
    if (!target) return send(req, res, 404, { error: "Nincs ilyen felhasználó.", code: "NO_SUCH_USER" });
    return send(req, res, 200, {
      user: publicUser(target),
      versions: store.profileHistory(target.id),
      subscriptions: store.subscriptionLog(target.id),
      activity: store.activity(target.id, 60),
    });
  });

  router.post("/api/admin/user/delete", async ({ req, res }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const body = await readBody(req);
    const { userId } = body || {};
    if (userId === admin.id) return send(req, res, 400, { error: "Saját fiókodat nem törölheted.", code: "CANNOT_DELETE_SELF" });
    const ok = store.deleteUser(userId);
    return send(req, res, ok ? 200 : 404, ok ? { success: true } : { error: "Nincs ilyen felhasználó.", code: "NO_SUCH_USER" });
  });
}
