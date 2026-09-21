import axios from "axios";

/**
 * The one Axios instance for the whole app. Feature `*.api.ts` files import
 * this — nothing calls Axios directly from a component or hook.
 *
 * `withCredentials` is required for the httpOnly session cookie the backend
 * sets (`hunter_session`) to be sent back on every request.
 */
export const httpClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const WRITE_METHODS = new Set(["post", "put", "patch"]);

/**
 * The API answers `415 JSON_REQUIRED` to any mutation that isn't sent as JSON,
 * and Axios drops the body — and with it the `Content-Type` — when a POST has
 * none (logout, load-demo, refresh, save-toggle). So an action with nothing to
 * say is sent as `{}`, as the backend's frontend guide asks.
 */
httpClient.interceptors.request.use((config) => {
  if (WRITE_METHODS.has((config.method ?? "").toLowerCase()) && config.data === undefined) {
    config.data = {};
  }
  return config;
});
