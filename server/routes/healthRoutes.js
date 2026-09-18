/** Register the operational health endpoint. */
export function registerHealthRoutes(router, { catalogState, referenceDate, send, refresher, persistProfile }) {
  router.get("/api/health", ({ req, res }) => {
    send(req, res, 200, {
      status: "healthy",
      service: "HUNTER API",
      version: "2.1.0",
      catalog: {
        opportunities: catalogState.opportunities.length,
        open: catalogState.opportunities.filter(opportunity => opportunity.status === "open").length,
        builtAt: catalogState.meta?.builtAt || null,
        builtBy: catalogState.meta?.builtBy || "build step",
        referenceDate: catalogState.meta?.referenceDate || null,
        eurHuf: catalogState.meta?.eurHuf || null,
      },
      refresh: refresher?.status || { enabled: false },
      storage: { persistProfile },
      timestamp: new Date().toISOString(),
    });
  });
}
