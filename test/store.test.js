import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { Store } from "../server/store.js";
import { createShutdown } from "../server/shutdown.js";

const timeout = globalThis.setTimeout;
const tick = () => new Promise(resolve => timeout(resolve, 10));
const failure = code => Object.assign(new Error("private user payload must not be logged"), { code });
const deferred = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};

async function fixture(t) {
  const dir = await fs.mkdtemp(path.resolve(".store-test-"));
  const file = path.join(dir, "users.json");
  const store = new Store(file);
  t.after(async () => {
    t.mock.restoreAll();
    await store.flush();
    await fs.rm(dir, { recursive: true, force: true });
  });
  const logs = [];
  t.mock.method(console, "error", (...args) => logs.push(args));
  const delays = [];
  t.mock.method(globalThis, "setTimeout", (fn, ms) => {
    delays.push(ms);
    return timeout(fn, 0);
  });
  return { store, file, dir, logs, delays };
}

for (const code of ["EBUSY", "EPERM", "EACCES"]) {
  test(`rename recovers from two transient ${code} failures`, async t => {
    const { store, file, dir, delays } = await fixture(t);
    const rename = fs.rename;
    let calls = 0;
    t.mock.method(fs, "rename", async (from, to) => {
      assert.equal(path.dirname(from), path.dirname(to));
      assert.match(from, /\.\d+\.\d+\.[\da-f-]+\.tmp$/);
      if (++calls < 3) throw failure(code);
      return rename(from, to);
    });
    const user = store.createUser({ username: "sample" });
    assert.equal(user.username, "sample");
    assert.equal(user.then, undefined);
    await store.flush();
    assert.equal(calls, 3);
    assert.deepEqual(delays, [25, 50]);
    assert.equal(JSON.parse(await fs.readFile(file, "utf8")).users[user.id].username, "sample");
    assert.deepEqual(await fs.readdir(dir), ["users.json"]);
  });
}

test("a non-retryable rename error fails immediately and a later flush retries", async t => {
  const { store, delays, logs } = await fixture(t);
  const error = failure("ENOSPC");
  const rename = t.mock.method(fs, "rename", async () => { throw error; });
  store.createUser({ username: "secret" });
  await assert.rejects(store.flush(), e => e === error);
  assert.equal(rename.mock.callCount(), 1);
  assert.deepEqual(delays, []);
  assert.deepEqual(logs, [["[store] rename ENOSPC"]]);
  rename.mock.restore();
  await store.flush();
});

test("exhausted retries retain pending state, preserve destination and clean temp files", async t => {
  const { store, file, dir, delays } = await fixture(t);
  const user = store.createUser({ username: "before" });
  await store.flush();
  const before = await fs.readFile(file, "utf8");
  const error = failure("EBUSY");
  const rename = t.mock.method(fs, "rename", async () => { throw error; });
  const unlink = fs.unlink;
  t.mock.method(fs, "unlink", async target => {
    assert.notEqual(target, file, "must never delete the destination");
    return unlink(target);
  });
  store.updateUser(user.id, { company: "pending" });
  await assert.rejects(store.flush(), e => e === error);
  assert.equal(rename.mock.callCount(), 6);
  assert.deepEqual(delays, [25, 50, 100, 200, 400]);
  assert.equal(await fs.readFile(file, "utf8"), before);
  assert.deepEqual(await fs.readdir(dir), ["users.json"]);
  assert.equal(store.getUser(user.id).company, "pending");
  rename.mock.restore();
  store.updateUser(user.id, { email: "later@example.test" });
  await store.flush();
  const saved = new Store(file).getUser(user.id);
  assert.equal(saved.company, "pending");
  assert.equal(saved.email, "later@example.test");
});

test("serialization failure is sanitized and pending state can be corrected", async t => {
  const { store, logs, file } = await fixture(t);
  const user = store.createUser({ username: "sample", profile: { value: 1n } });
  await assert.rejects(store.flush(), TypeError);
  assert.deepEqual(logs, [["[store] serialize UNKNOWN"]]);
  store.updateUser(user.id, { profile: { value: 1 } });
  await store.flush();
  assert.equal(new Store(file).getUser(user.id).profile.value, 1);
});

test("cleanup failure never replaces the original persistence failure", async t => {
  const { store, logs } = await fixture(t);
  const root = failure("EIO");
  t.mock.method(fs, "rename", async () => { throw root; });
  t.mock.method(fs, "unlink", async () => { throw failure("EACCES"); });
  store.createUser({ username: "private" });
  await assert.rejects(store.flush(), e => e === root);
  assert.deepEqual(logs, [["[store] rename EIO"]]);
});

test("rapid mutations coalesce, then save consecutive revisions without overlapping writes", async t => {
  const { store, file } = await fixture(t);
  const started = deferred();
  const release = deferred();
  const rename = fs.rename;
  let calls = 0;
  let active = 0;
  t.mock.method(fs, "rename", async (from, to) => {
    assert.equal(++active, 1);
    if (++calls === 1) {
      started.resolve();
      await release.promise;
    }
    await rename(from, to);
    active--;
  });
  const user = store.createUser({ username: "burst" });
  for (let i = 0; i < 20; i++) store.updateUser(user.id, { company: String(i) });
  let settled = false;
  const first = store.flush().then(() => { settled = true; });
  await started.promise;
  for (let i = 20; i < 40; i++) store.updateUser(user.id, { company: String(i) });
  const second = store.flush();
  assert.equal(settled, false);
  release.resolve();
  await Promise.all([first, second]);
  assert.equal(calls, 2);
  assert.equal(new Store(file).getUser(user.id).company, "39");
  await store.flush();
  assert.equal(calls, 2, "a clean flush performs no write");
});

test("snapshots are exclusively created, written, synced and closed before rename", async t => {
  const { store, file } = await fixture(t);
  const events = [];
  const open = fs.open;
  const rename = fs.rename;
  t.mock.method(fs, "open", async (target, flags) => {
    assert.notEqual(target, file);
    assert.equal(flags, "wx");
    const handle = await open(target, flags);
    return {
      async writeFile(...args) { events.push("write"); return handle.writeFile(...args); },
      async sync() { events.push("sync"); return handle.sync(); },
      async close() { await handle.close(); events.push("close"); },
    };
  });
  t.mock.method(fs, "rename", async (...args) => {
    events.push("rename");
    return rename(...args);
  });
  store.createUser({ username: "ordering" });
  await store.flush();
  assert.deepEqual(events, ["write", "sync", "close", "rename"]);
});

for (const operation of ["writeFile", "sync", "close"]) {
  test(`${operation} failure closes and cleans the temporary file without renaming`, async t => {
    const { store, dir } = await fixture(t);
    const open = fs.open;
    const root = failure("EIO");
    const rename = t.mock.method(fs, "rename", async () => assert.fail("rename after failed write"));
    let closed = false;
    t.mock.method(fs, "open", async (...args) => {
      const handle = await open(...args);
      return {
        async writeFile(...values) { if (operation === "writeFile") throw root; return handle.writeFile(...values); },
        async sync() { if (operation === "sync") throw root; return handle.sync(); },
        async close() {
          await handle.close();
          closed = true;
          if (operation === "close") throw root;
        },
      };
    });
    store.createUser({ username: "failure" });
    await assert.rejects(store.flush(), e => e === root);
    assert.equal(closed, true);
    assert.equal(rename.mock.callCount(), 0);
    assert.deepEqual(await fs.readdir(dir), []);
  });
}

test("discarded synchronous mutation results do not cause unhandled rejections", async t => {
  const { store, logs } = await fixture(t);
  const unhandled = [];
  const listener = error => unhandled.push(error);
  process.on("unhandledRejection", listener);
  t.after(() => process.removeListener("unhandledRejection", listener));
  const rename = t.mock.method(fs, "rename", async () => { throw failure("EIO"); });
  store.createUser({ username: "ignored" });
  // No flush attaches a caller's rejection handler to this background attempt.
  for (let i = 0; !logs.length && i < 100; i++) await tick();
  await tick();
  assert.equal(logs.length, 1);
  assert.deepEqual(unhandled, []);
  rename.mock.restore();
  await store.flush();
});

test("shutdown drains admitted mutations, flushes once and ignores overlapping signals", async () => {
  const events = [];
  const gate = deferred();
  const shutdown = createShutdown({
    pause: () => events.push("pause"),
    resume: () => assert.fail("unexpected recovery"),
    flush: async () => { events.push("flush"); await gate.promise; },
    close: async () => events.push("close"),
    exit: () => events.push("exit"),
    report: () => assert.fail("unexpected error"),
  });
  const release = shutdown.enter();
  const pending = shutdown.shutdown();
  assert.equal(shutdown.shutdown(), pending);
  assert.equal(shutdown.enter(), null);
  await Promise.resolve();
  assert.deepEqual(events, ["pause"]);
  events.push("mutation");
  release();
  await Promise.resolve();
  assert.deepEqual(events, ["pause", "mutation", "flush"]);
  gate.resolve();
  await pending;
  assert.deepEqual(events, ["pause", "mutation", "flush", "close", "exit"]);
});

test("failed shutdown keeps service available and permits a later successful shutdown", async () => {
  const events = [];
  let fail = true;
  const shutdown = createShutdown({
    pause: () => events.push("pause"), resume: () => events.push("resume"),
    flush: async () => { if (fail) throw failure("EBUSY"); },
    close: async () => events.push("close"), exit: () => events.push("exit"),
    report: (...args) => events.push(args),
  });
  await shutdown.shutdown();
  assert.equal(shutdown.stopping, false);
  assert.deepEqual(events, ["pause", ["shutdown", "EBUSY"], "resume"]);
  const release = shutdown.enter();
  assert.equal(typeof release, "function");
  release();
  fail = false;
  await shutdown.shutdown();
  assert.deepEqual(events.slice(-3), ["pause", "close", "exit"]);
});
