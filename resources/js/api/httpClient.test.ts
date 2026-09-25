import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { httpClient } from "./httpClient";

/** Runs a request through the real interceptors and hands back what would have been sent. */
async function send(run: (adapter: AxiosAdapter) => Promise<unknown>) {
  let seen: InternalAxiosRequestConfig | undefined;
  const adapter: AxiosAdapter = async (config) => {
    seen = config;
    return { data: {}, status: 200, statusText: "OK", headers: {}, config };
  };
  await run(adapter);
  return seen!;
}

describe("httpClient", () => {
  it("talks to /api with the session cookie and asks for JSON", async () => {
    const config = await send((adapter) => httpClient.get("/auth/me", { adapter }));
    expect(config.baseURL).toBe("/api");
    expect(config.withCredentials).toBe(true);
    expect(config.headers.get("Accept")).toBe("application/json");
  });

  it("sends an empty JSON object for a POST with nothing to say, with its content type", async () => {
    const config = await send((adapter) => httpClient.post("/auth/logout", undefined, { adapter }));
    expect(config.data).toBe("{}");
    expect(config.headers.get("Content-Type")).toMatch(/application\/json/);
  });

  it("leaves a real body alone", async () => {
    const config = await send((adapter) => httpClient.post("/profile/restore", { version: 3 }, { adapter }));
    expect(JSON.parse(config.data)).toEqual({ version: 3 });
  });

  it("does not invent a body for a GET", async () => {
    const config = await send((adapter) => httpClient.get("/meta", { adapter }));
    expect(config.data).toBeUndefined();
  });

  it("does not turn an explicit empty object or empty string into something else", async () => {
    const explicit = await send((adapter) => httpClient.post("/refresh", {}, { adapter }));
    expect(explicit.data).toBe("{}");
  });
});
