/**
 * Lead capture and CRM administration endpoints.
 */
export function registerCrmRoutes(router, {
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

  router.post("/api/leads", async ({ req, res }) => {
    const body = await readBody(req);
    const checked = validateLead(body);
    if (checked.error) return send(req, res, 400, { error: checked.error, code: checked.code });

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
  });

  router.get("/api/admin/crm", ({ req, res }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

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
  });

  router.get("/api/admin/crm/contacts", ({ req, res, url }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const { searchParams } = url;
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
  });

  router.get("/api/admin/crm/contact", ({ req, res, url }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const id = url.searchParams.get("id");
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
  });

  router.post("/api/admin/crm/contact", async ({ req, res }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const body = await readBody(req);
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
  });

  router.post("/api/admin/crm/note", async ({ req, res }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const body = await readBody(req);
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
  });

  router.post("/api/admin/crm/task", async ({ req, res }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const body = await readBody(req);
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
  });

  router.get("/api/admin/crm/leads", ({ req, res }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const now = referenceDate();
    return send(req, res, 200, {
      leads: store.listLeads().map((lead) => buildLeadContact(lead, now)),
      vocabulary: { stages: STAGES, sources: LEAD_SOURCES },
    });
  });

  router.post("/api/admin/crm/lead", async ({ req, res }) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;

    const body = await readBody(req);
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
  });
}
