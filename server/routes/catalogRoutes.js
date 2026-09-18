/**
 * Catalog, search, opportunity detail, and saved opportunity endpoints.
 */
export function registerCatalogRoutes(router, {
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
}) {
  router.get("/api/refresh", ({ req, res }) => {
    return send(req, res, 200, refresher ? refresher.status : { enabled: false });
  });

  router.post("/api/refresh", async ({ req, res }) => {
    if (!refresher) return send(req, res, 503, { error: "the refresher is not running" });
    const result = await refresher.runOnce("api");
    return send(req, res, result.ok ? 200 : 502, {
      ...result,
      catalog: { total: catalogState.opportunities.length, builtAt: catalogState.meta?.builtAt || null },
      status: refresher.status,
    });
  });

  router.get("/api/meta", ({ req, res }) => {
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
  });

  async function handleSearch({ req, res, url }) {
    const { searchParams } = url;
    const lang = searchParams.get("lang") === "en" ? "en" : "hu";
    const db = loadDb();
    const body = await readBody(req);
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

  router.get("/api/search", handleSearch);
  router.post("/api/search", handleSearch);

  async function handleDashboard({ req, res, url }) {
    const { searchParams } = url;
    const lang = searchParams.get("lang") === "en" ? "en" : "hu";
    const db = loadDb();
    const body = await readBody(req);
    const st = resolveState(req, db, body);
    const profile = st.profile;
    const ref = referenceDate();

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
      matches: gatedMatches.results,
      lockedCount: gatedMatches.lockedCount,
      excluded: st.entitlements.explanations ? blocked.slice(0, 12).map((x) => toCard(x.opp, x.res, lang)) : [],
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

  router.get("/api/dashboard", handleDashboard);
  router.post("/api/dashboard", handleDashboard);

  async function handleCatalog({ req, res, url }) {
    const { searchParams } = url;
    const lang = searchParams.get("lang") === "en" ? "en" : "hu";
    const db = loadDb();
    const body = await readBody(req);
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

    if (st.entitlements.maxResults === Infinity) {
      return send(req, res, 200, { ...base, gated: false, total: live.length, opportunities: live.map(trim) });
    }

    const scored = live
      .filter((o) => o.awardsFunding !== false)
      .map((opp) => ({ opp, res: hunterScore(opp, st.profile, st.answers, ref) }));
    const eligible = scored.filter((x) => !x.res.blocked).sort((a, b) => (b.res.score || 0) - (a.res.score || 0));
    const allowed = eligible.slice(0, st.entitlements.maxResults).map((x) => trim(x.opp));
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

  router.get("/api/catalog", handleCatalog);
  router.post("/api/catalog", handleCatalog);

  router.get("/api/benchmarks", ({ req, res }) => {
    return send(req, res, 200, catalogState.benchmarks || { projectCount: 0 });
  });

  async function handleOpportunityDetail({ req, res, url, params }) {
    const id = params.id;
    const opp = catalogState.byId.get(id);
    if (!opp) return send(req, res, 404, { error: `No opportunity with id '${id}'` });

    const lang = url.searchParams.get("lang") === "en" ? "en" : "hu";
    const db = loadDb();
    const body = await readBody(req);
    const st = resolveState(req, db, body);
    if (st.user) store.recordActivity(st.user.id, "opportunity.viewed", { id, title: opp.title });

    return send(req, res, 200, {
      opportunity: gateDetail(toDetail(opp, st.profile, st.answers, lang), st.entitlements),
      saved: st.saved.includes(id),
      entitlements: st.entitlements,
    });
  }

  router.get("/api/opportunities/:id", handleOpportunityDetail);
  router.post("/api/opportunities/:id", handleOpportunityDetail);

  router.post("/api/opportunities/:id/answer", async ({ req, res, url, params }) => {
    const id = params.id;
    const opp = catalogState.byId.get(id);
    if (!opp) return send(req, res, 404, { error: `No opportunity with id '${id}'` });

    const body = await readBody(req);
    const { field, value, scope = "global" } = body || {};
    if (!field) return send(req, res, 400, { error: "field is required" });
    const key = scope === "call" ? `${id}:${field}` : field;
    const db = loadDb();
    const st = resolveState(req, db, body);

    const answers = { ...st.answers };
    if (value === null) delete answers[key];
    else answers[key] = value;

    if (st.user) {
      store.updateUser(st.user.id, { answers });
      store.recordActivity(st.user.id, "profile.answered", { field: key, value });
    } else {
      if (value === null) delete db.answers[key];
      else db.answers[key] = value;
      saveDb(db);
    }

    const lang = url.searchParams.get("lang") === "en" ? "en" : "hu";
    return send(req, res, 200, {
      success: true,
      key,
      value,
      opportunity: gateDetail(toDetail(opp, st.profile, answers, lang), st.entitlements),
    });
  });

  router.post("/api/opportunities/:id/save", async ({ req, res, params }) => {
    const id = params.id;
    const opp = catalogState.byId.get(id);
    if (!opp) return send(req, res, 404, { error: `No opportunity with id '${id}'` });

    const db = loadDb();
    const body = await readBody(req);
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
  });

  async function handleSaved({ req, res, url }) {
    const db = loadDb();
    const body = await readBody(req);
    const st = resolveState(req, db, body);
    const ref = referenceDate();
    const lang = url.searchParams.get("lang") === "en" ? "en" : "hu";
    const items = st.saved
      .map((id) => catalogState.byId.get(id))
      .filter(Boolean)
      .map((opp) => toCard(opp, hunterScore(opp, st.profile, st.answers, ref), lang));
    const gated = gateResults(items, st.entitlements, st.profile);
    return send(req, res, 200, { total: items.length, results: gated.results, lockedCount: gated.lockedCount });
  }

  router.get("/api/saved", handleSaved);
  router.post("/api/saved", handleSaved);

  router.post("/api/sync", async ({ req, res }) => {
    const body = await readBody(req);
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

      const db = loadDb();
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
  });
}
