import axios from "axios";

/**
 * The one Axios instance for the whole app. Feature `*.api.ts` files import
 * this — nothing calls Axios directly from a component or hook.
 *
 * `withCredentials` is required for the httpOnly session cookie the server
 * sets (`server/auth.js`) to be sent back on every request.
 */
export const httpClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});
