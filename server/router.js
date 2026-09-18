/**
 * Small method-and-path dispatcher for the HTTP server.
 * Handlers return a boolean so callers can fall back to legacy routing while
 * routes are migrated one subsystem at a time.
 */
export function createRouter() {
  const exactRoutes = new Map();
  const patternRoutes = [];

  function add(method, pathname, handler) {
    const upperMethod = method.toUpperCase();
    if (pathname.includes(":")) {
      const paramNames = [];
      const regexPattern = pathname.replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return "([^/]+)";
      });
      patternRoutes.push({
        method: upperMethod,
        regex: new RegExp(`^${regexPattern}$`),
        paramNames,
        handler,
      });
    } else {
      exactRoutes.set(`${upperMethod} ${pathname}`, handler);
    }
    return router;
  }

  const router = {
    add,
    get: (pathname, handler) => add("GET", pathname, handler),
    post: (pathname, handler) => add("POST", pathname, handler),
    put: (pathname, handler) => add("PUT", pathname, handler),
    async dispatch(req, res, url, context = {}) {
      const upperMethod = req.method.toUpperCase();
      const exact = exactRoutes.get(`${upperMethod} ${url.pathname}`);
      if (exact) {
        await exact({ req, res, url, params: {}, context });
        return true;
      }
      for (const route of patternRoutes) {
        if (route.method !== upperMethod) continue;
        const match = url.pathname.match(route.regex);
        if (!match) continue;
        const params = {};
        for (let i = 0; i < route.paramNames.length; i++) {
          params[route.paramNames[i]] = decodeURIComponent(match[i + 1]);
        }
        await route.handler({ req, res, url, params, context });
        return true;
      }
      return false;
    },
  };

  return router;
}
