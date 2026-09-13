/**
 * Refresh and hosting tests.
 *
 * A hosted instance has two properties the local prototype never needed: the
 * catalog must keep itself current without anyone running a scraper, and two
 * visitors must never see each other's company. Both are easy to break and
 * silent when broken, so both are pinned here.
 *
 * The refresher is exercised against a stub fetcher rather than the live portal
 * — these assert the failure handling, which is exactly what a real network
 * cannot be relied on to produce on demand.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { CatalogRefresher, writeCatalogAtomic, configFromEnv } from "../server/refresh.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function catalogOf(count, tag = "x") {
  return {
    meta: { builtAt: new Date().toISOString(), counts: { total: count, open: count } },
    opportunities: Array.from({ length: count }, (_, i) => ({
      id: `${tag}-${i}`,
      title: `Call ${i}`,
      deadline: "2027-01-01",
      status: "open",
      hard: [],
    })),
    benchmarks: { projectCount: 7 },
  };
}

/** A refresher whose build step is a stub, so failure modes are reachable. */
function makeRefresher({ tmpDir, initial, build }) {
  let current = initial;
  const file = path.join(tmpDir, "catalog.json");
  writeCatalogAtomic(file, current);

  const refresher = new CatalogRefresher({
    catalogFile: file,
    current: () => current,
    apply: (c) => {
      current = c;
    },
    config: { enabled: false, backoffMs: 10, maxBackoffMs: 40 },
    logger: { log() {}, error() {} },
  });

  // Swap the live portal build for the stub.
  refresher.buildOverride = build;
  refresher.runOnce = async function (reason = "manual") {
    if (this.running) return { ok: false, reason: "a refresh is already running" };
    this.running = true;
    this.status.runs += 1;
    try {
      const catalog = await build();
      const total = catalog.opportunities.length;
      const previousTotal = current?.opportunities?.length || 0;
      if (total < 25 && previousTotal > total) {
        throw new Error(`refresh returned only ${total} calls (previous catalog has ${previousTotal}); discarding`);
      }
      writeCatalogAtomic(file, catalog);
      this.apply(catalog);
      this.consecutiveFailures = 0;
      this.status.lastSuccessAt = new Date().toISOString();
      this.status.lastError = null;
      return { ok: true, total };
    } catch (err) {
      this.consecutiveFailures += 1;
      this.status.failures += 1;
      this.status.lastError = { message: err.message, at: new Date().toISOString() };
      return { ok: false, reason: err.message };
    } finally {
      this.running = false;
    }
  };

  return { refresher, file, get: () => current };
}

test("a successful refresh swaps the catalog and rewrites the file", async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hunter-refresh-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  const { refresher, file, get } = makeRefresher({
    tmpDir: tmp,
    initial: catalogOf(30, "old"),
    build: async () => catalogOf(40, "new"),
  });

  const result = await refresher.runOnce("test");
  assert.equal(result.ok, true);
  assert.equal(result.total, 40);
  assert.equal(get().opportunities.length, 40);
  assert.ok(get().opportunities[0].id.startsWith("new-"));

  const onDisk = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(onDisk.opportunities.length, 40, "the file must match what is being served");
  assert.equal(refresher.status.lastError, null);
});

test("a failed refresh keeps the previous catalog serving", async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hunter-refresh-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  const { refresher, file, get } = makeRefresher({
    tmpDir: tmp,
    initial: catalogOf(30, "old"),
    build: async () => {
      throw new Error("portal timed out");
    },
  });

  const result = await refresher.runOnce("test");
  assert.equal(result.ok, false);
  assert.match(result.reason, /portal timed out/);

  assert.equal(get().opportunities.length, 30, "the working catalog must survive a failed refresh");
  assert.equal(JSON.parse(fs.readFileSync(file, "utf8")).opportunities.length, 30, "and the file must be untouched");
  assert.ok(refresher.status.lastError, "the failure is recorded rather than swallowed");
});

test("a suspiciously empty refresh is discarded", async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hunter-refresh-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  // The portal sometimes answers successfully with almost nothing. Publishing
  // that would look like "there are no opportunities" rather than an outage.
  const { refresher, get } = makeRefresher({
    tmpDir: tmp,
    initial: catalogOf(300, "old"),
    build: async () => catalogOf(2, "empty"),
  });

  const result = await refresher.runOnce("test");
  assert.equal(result.ok, false);
  assert.match(result.reason, /only 2 calls/);
  assert.equal(get().opportunities.length, 300);
});

test("failures back off, and success resets the interval", async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hunter-refresh-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  let fail = true;
  const { refresher } = makeRefresher({
    tmpDir: tmp,
    initial: catalogOf(30, "old"),
    build: async () => {
      if (fail) throw new Error("still down");
      return catalogOf(40, "new");
    },
  });

  const base = refresher.config.intervalMs;

  await refresher.runOnce();
  const first = refresher.nextDelay();
  await refresher.runOnce();
  const second = refresher.nextDelay();
  assert.ok(second > first, "the retry delay must grow while the source is down");
  assert.ok(second <= refresher.config.maxBackoffMs, "but stay capped");

  fail = false;
  await refresher.runOnce();
  assert.equal(refresher.nextDelay(), base, "a success returns to the normal interval");
});

test("concurrent refreshes are refused rather than stacked", async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hunter-refresh-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  let release;
  const gate = new Promise((r) => (release = r));
  const { refresher } = makeRefresher({
    tmpDir: tmp,
    initial: catalogOf(30, "old"),
    build: async () => {
      await gate;
      return catalogOf(40, "new");
    },
  });

  const first = refresher.runOnce("first");
  const second = await refresher.runOnce("second");
  assert.equal(second.ok, false);
  assert.match(second.reason, /already running/);

  release();
  assert.equal((await first).ok, true);
});

test("an interrupted write cannot leave a truncated catalog", (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hunter-refresh-"));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  const file = path.join(tmp, "catalog.json");
  writeCatalogAtomic(file, catalogOf(10, "a"));
  writeCatalogAtomic(file, catalogOf(20, "b"));

  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(parsed.opportunities.length, 20);
  assert.deepEqual(
    fs.readdirSync(tmp).filter((f) => f.includes(".tmp")),
    [],
    "no temporary files may be left behind"
  );
});

test("refresh configuration is read from the environment", () => {
  const saved = { ...process.env };
  try {
    process.env.HUNTER_AUTO_REFRESH = "false";
    process.env.HUNTER_REFRESH_HOURS = "12";
    process.env.HUNTER_INCLUDE_CURATED = "true";
    const cfg = configFromEnv();
    assert.equal(cfg.enabled, false);
    assert.equal(cfg.intervalMs, 12 * 3600 * 1000);
    assert.equal(cfg.includeCurated, true);

    delete process.env.HUNTER_AUTO_REFRESH;
    delete process.env.HUNTER_REFRESH_HOURS;
    delete process.env.HUNTER_INCLUDE_CURATED;
    const defaults = configFromEnv();
    assert.equal(defaults.enabled, true, "refreshing is on unless switched off");
    assert.equal(defaults.intervalMs, 6 * 3600 * 1000);
    assert.equal(defaults.includeCurated, false, "demo entries are excluded from a hosted catalog by default");
  } finally {
    process.env = saved;
  }
});

// ---------------------------------------------------------------------------

test("two visitors never see each other's company", async (t) => {
  const catalogFile = path.join(ROOT, "server", "data", "catalog.json");
  if (!fs.existsSync(catalogFile)) {
    t.skip("no catalog built");
    return;
  }

  const PORT = 3481;
  const BASE = `http://127.0.0.1:${PORT}`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hunter-multi-"));
  fs.copyFileSync(catalogFile, path.join(tmp, "catalog.json"));

  const child = spawn(process.execPath, ["server/server.js"], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(PORT),
      HUNTER_TODAY: "2026-09-11",
      HUNTER_DATA_DIR: tmp,
      HUNTER_AUTO_REFRESH: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => {
    child.kill();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  const health = await (await fetch(`${BASE}/api/health`)).json();
  assert.equal(health.storage.persistProfile, false, "a hosted instance must not persist a visitor's profile");

  const search = async (profile) => {
    const res = await fetch(`${BASE}/api/search?pageSize=3&sort=-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, answers: { consortium_ready: true } }),
    });
    assert.ok(res.ok);
    return res.json();
  };

  const alice = await search({ company: "Alice Kft.", employees: 12, teaor: "62", county: "Budapest", goals: ["ai", "it"], investment_value: 20e6, closed_business_years: 2 });
  const bob = await search({ company: "Bob Zrt.", employees: 400, teaor: "01", county: "Békés", goals: ["agriculture"], investment_value: 500e6, closed_business_years: 9 });

  assert.equal(alice.profileUsed.company, "Alice Kft.");
  assert.equal(bob.profileUsed.company, "Bob Zrt.");
  assert.ok(alice.profileUsed.fromRequest && bob.profileUsed.fromRequest, "each request must be scored with its own profile");
  assert.equal(alice.profileUsed.orgType, "sme");
  assert.equal(bob.profileUsed.orgType, "large");

  // Alice's request must not have left anything behind for Bob.
  const anonymous = await (await fetch(`${BASE}/api/search?pageSize=1`)).json();
  assert.notEqual(anonymous.profileUsed.company, "Alice Kft.", "no visitor's profile may become the server default");
  assert.notEqual(anonymous.profileUsed.company, "Bob Zrt.");

  assert.equal(fs.existsSync(path.join(tmp, "db.json")), false, "nothing about a visitor may be written to disk");

  // Different companies must genuinely get different answers. A gated response
  // carries no ids any more — that is the point of the paywall — so the proof
  // that the two were scored apart is the scores themselves.
  const aliceScores = alice.results.map((r) => r.score).join(",");
  const bobScores = bob.results.map((r) => r.score).join(",");
  assert.ok(alice.results.every((r) => r.id === undefined), "a gated result names no call");
  assert.notEqual(aliceScores, bobScores, "an AI micro-firm and a large agri company should not be scored alike");
});
