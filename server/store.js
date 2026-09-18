/**
 * Persistent store for accounts, subscriptions and history.
 *
 * Until now the server kept nothing about a visitor, because there were no
 * accounts to key anything on. Accounts change that: a profile now has an owner,
 * has to follow them between devices, and has to be auditable — who granted this
 * subscription, when, and what did the company profile look like at the time.
 *
 * This is a JSON document written atomically, not a database. That is a
 * deliberate fit for the current scale — tens of accounts for a sales demo — and
 * the reasons are: no dependency to install on the host, no schema migration to
 * run before a presentation, and the whole document is small enough to hold in
 * memory beside the 12 MB catalog we already keep there.
 *
 * `node:sqlite` exists in Node 22 but is flagged experimental and may change
 * between releases, which is the wrong risk to carry into a hosted demo.
 *
 * Everything below is a repository interface on purpose. When accounts grow past
 * a few hundred, or two processes need to share state, the swap is this one file
 * — nothing above it knows how the rows are stored.
 *
 * Durability: every mutation goes through `#commit`, which serializes writes and
 * renames a temp file over the target, so a crash cannot leave a half-written
 * document. Writes are coalesced, so a burst of changes costs one fsync.
 */

import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const EMPTY = {
  version: 2,
  users: {},
  sessions: {},
  profileHistory: {},
  subscriptionLog: {},
  activity: {},
  // CRM state keyed by subject id — an account id, or a lead id. Kept beside the
  // account rather than inside it because it is written by a different person
  // (an operator) about a different thing (the relationship, not the login).
  crm: {},
  leads: {},
};

/** History is capped per user so a long-lived account cannot grow without bound. */
const MAX_PROFILE_VERSIONS = 50;
const MAX_ACTIVITY = 200;
/** The same reasoning for the relationship record. */
const MAX_NOTES = 200;
const MAX_TASKS = 200;

/** @param {string} prefix @returns {string} */
export function newId(prefix = "u") {
  return `${prefix}_${crypto.randomBytes(9).toString("base64url")}`;
}

/** JSON-backed application state with serialized durable writes. */
export class Store {
  #file;
  #data;
  #mutationRevision = 0;
  #persistedRevision = 0;
  #writing = null;

  constructor(file) {
    this.#file = file;
    this.#data = this.#load();
  }

  #load() {
    if (!fs.existsSync(this.#file)) return structuredClone(EMPTY);
    try {
      return { ...structuredClone(EMPTY), ...JSON.parse(fs.readFileSync(this.#file, "utf8")) };
    } catch (err) {
      // A corrupt store must not silently become an empty one — that would look
      // like every account vanished. Keep the bad file for inspection.
      const backup = `${this.#file}.corrupt-${Date.now()}`;
      try {
        fs.renameSync(this.#file, backup);
        console.error(`[store] ${this.#file} is unreadable (${err.message}); moved to ${backup} and starting empty`);
      } catch {
        console.error(`[store] ${this.#file} is unreadable and could not be moved: ${err.message}`);
      }
      return structuredClone(EMPTY);
    }
  }

  /** Record a mutation and schedule a coalesced, serialized write. */
  #commit() {
    this.#mutationRevision++;
    this.#startWrite();
  }

  #startWrite() {
    if (this.#writing) return this.#writing;
    const attempt = Promise.resolve().then(async () => {
      try {
        while (this.#persistedRevision !== this.#mutationRevision) {
          const revision = this.#mutationRevision;
          await this.#save();
          this.#persistedRevision = revision;
        }
      } finally {
        this.#writing = null;
      }
    });
    this.#writing = attempt;
    // Mutations stay synchronous; explicit flush callers still see rejection.
    attempt.catch(() => {});
    return attempt;
  }

  async #save() {
    const tmp = `${this.#file}.${Date.now()}.${process.pid}.${crypto.randomUUID()}.tmp`;
    let handle;
    let created = false;
    let operation = "serialize";
    try {
      const snapshot = JSON.stringify(this.#data, null, 2);
      operation = "mkdir";
      await fsPromises.mkdir(path.dirname(this.#file), { recursive: true });
      operation = "open";
      handle = await fsPromises.open(tmp, "wx");
      created = true;
      operation = "write";
      await handle.writeFile(snapshot, "utf8");
      operation = "sync";
      await handle.sync();
      operation = "close";
      await handle.close();
      handle = null;
      operation = "rename";
      await this.#renameWithRetry(tmp);
      created = false;
    } catch (error) {
      console.error(`[store] ${operation} ${error.code || "UNKNOWN"}`);
      throw error;
    } finally {
      if (handle) await handle.close().catch(() => {});
      if (created) await fsPromises.unlink(tmp).catch(() => {});
    }
  }

  async #renameWithRetry(tmp) {
    const retryableCodes = new Set(["EPERM", "EACCES", "EBUSY"]);
    const backoffMs = [25, 50, 100, 200, 400];

    for (let attempt = 0; ; attempt++) {
      try {
        await fsPromises.rename(tmp, this.#file);
        return;
      } catch (error) {
        const canRetry = retryableCodes.has(error.code) && attempt < backoffMs.length;
        if (!canRetry) throw error;
        await new Promise(resolve => setTimeout(resolve, backoffMs[attempt]));
      }
    }
  }

  /** Forces any pending write to land — used by tests and on shutdown. */
  /** @returns {Promise<void>} Resolves only after all revisions are durable. */
  async flush() {
    while (this.#writing || this.#persistedRevision !== this.#mutationRevision) {
      await (this.#writing || this.#startWrite());
    }
  }

  // -- users ---------------------------------------------------------------

  listUsers() {
    return Object.values(this.#data.users).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }

  getUser(id) {
    return this.#data.users[id] || null;
  }

  findByUsername(username) {
    if (!username) return null;
    const wanted = String(username).trim().toLowerCase();
    return Object.values(this.#data.users).find((u) => u.username.toLowerCase() === wanted) || null;
  }

  createUser(user) {
    const id = user.id || newId();
    const record = {
      id,
      username: user.username,
      email: user.email || null,
      company: user.company || null,
      role: user.role === "admin" ? "admin" : "user",
      passwordHash: user.passwordHash,
      salt: user.salt,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      disabled: false,
      profile: user.profile || null,
      answers: {},
      saved: [],
      subscription: user.subscription || {
        status: "none",
        plan: null,
        validUntil: null,
        grantedBy: null,
        grantedAt: null,
        note: null,
      },
    };
    this.#data.users[id] = record;
    this.#commit();
    return record;
  }

  updateUser(id, patch) {
    const user = this.#data.users[id];
    if (!user) return null;
    Object.assign(user, patch);
    this.#commit();
    return user;
  }

  deleteUser(id) {
    if (!this.#data.users[id]) return false;
    delete this.#data.users[id];
    delete this.#data.profileHistory[id];
    delete this.#data.subscriptionLog[id];
    delete this.#data.activity[id];
    // The relationship record goes with the account. It holds notes an operator
    // wrote about a named person, so leaving it behind when the account is
    // deleted would keep exactly the data the deletion was meant to remove.
    delete this.#data.crm[id];
    for (const [token, session] of Object.entries(this.#data.sessions)) {
      if (session.userId === id) delete this.#data.sessions[token];
    }
    this.#commit();
    return true;
  }

  // -- sessions ------------------------------------------------------------

  createSession(userId, ttlMs, meta = {}) {
    const token = crypto.randomBytes(32).toString("base64url");
    this.#data.sessions[token] = {
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
      userAgent: meta.userAgent || null,
    };
    this.#commit();
    return token;
  }

  getSession(token) {
    if (!token) return null;
    const session = this.#data.sessions[token];
    if (!session) return null;
    if (new Date(session.expiresAt) <= new Date()) {
      delete this.#data.sessions[token];
      this.#commit();
      return null;
    }
    return session;
  }

  touchSession(token, ttlMs) {
    const session = this.#data.sessions[token];
    if (!session) return;
    session.expiresAt = new Date(Date.now() + ttlMs).toISOString();
    this.#commit();
  }

  destroySession(token) {
    if (this.#data.sessions[token]) {
      delete this.#data.sessions[token];
      this.#commit();
    }
  }

  /** Ends every session for a user — used when an admin disables an account. */
  destroyUserSessions(userId) {
    let n = 0;
    for (const [token, session] of Object.entries(this.#data.sessions)) {
      if (session.userId === userId) {
        delete this.#data.sessions[token];
        n += 1;
      }
    }
    if (n) this.#commit();
    return n;
  }

  purgeExpiredSessions() {
    const now = new Date();
    let n = 0;
    for (const [token, session] of Object.entries(this.#data.sessions)) {
      if (new Date(session.expiresAt) <= now) {
        delete this.#data.sessions[token];
        n += 1;
      }
    }
    if (n) this.#commit();
    return n;
  }

  // -- profile history -----------------------------------------------------

  /**
   * Records a profile version. The diff against the previous version is stored
   * with it, so the history reads as a list of changes rather than a list of
   * identical-looking snapshots.
   */
  recordProfile(userId, profile, source = "onboarding") {
    const list = (this.#data.profileHistory[userId] = this.#data.profileHistory[userId] || []);
    const previous = list.length ? list[list.length - 1].profile : null;
    const changed = diffProfile(previous, profile);

    // An identical re-save is not a new version.
    if (previous && !changed.length) return list[list.length - 1];

    const entry = {
      version: list.length + 1,
      at: new Date().toISOString(),
      source,
      changed,
      profile: structuredClone(profile),
    };
    list.push(entry);
    if (list.length > MAX_PROFILE_VERSIONS) list.splice(0, list.length - MAX_PROFILE_VERSIONS);
    this.#commit();
    return entry;
  }

  profileHistory(userId) {
    return [...(this.#data.profileHistory[userId] || [])].reverse();
  }

  // -- subscription log ----------------------------------------------------

  recordSubscription(userId, entry) {
    const list = (this.#data.subscriptionLog[userId] = this.#data.subscriptionLog[userId] || []);
    list.push({ at: new Date().toISOString(), ...entry });
    this.#commit();
    return list[list.length - 1];
  }

  subscriptionLog(userId) {
    return [...(this.#data.subscriptionLog[userId] || [])].reverse();
  }

  // -- activity ------------------------------------------------------------

  recordActivity(userId, type, detail = {}) {
    if (!userId) return;
    const list = (this.#data.activity[userId] = this.#data.activity[userId] || []);
    list.push({ at: new Date().toISOString(), type, ...detail });
    if (list.length > MAX_ACTIVITY) list.splice(0, list.length - MAX_ACTIVITY);
    this.#commit();
  }

  activity(userId, limit = 50) {
    return [...(this.#data.activity[userId] || [])].reverse().slice(0, limit);
  }

  /**
   * The most recent activity across every account, newest first.
   * Each entry carries who it belongs to, which is what makes an operations
   * view useful rather than an anonymous stream.
   */
  recentActivity(limit = 25) {
    const out = [];
    for (const [userId, entries] of Object.entries(this.#data.activity)) {
      const user = this.#data.users[userId];
      if (!user) continue;
      for (const entry of entries) out.push({ ...entry, userId, username: user.username, company: user.company || null });
    }
    return out.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, limit);
  }

  // -- CRM: relationship records ------------------------------------------
  //
  // One record per subject, where a subject is an account or a captured lead.
  // Everything an operator writes lands here: the pipeline stage they put it in,
  // who owns it, what was said, and what has to happen next. The derived facts
  // (lifecycle, engagement, revenue) are NOT stored — they are computed from the
  // account and the activity log every time they are asked for, so they cannot
  // drift away from the truth.

  crmFor(subjectId) {
    return this.#data.crm[subjectId] || null;
  }

  /** Patches the record, creating it on first write. Returns the whole record. */
  updateCrm(subjectId, patch) {
    const record = (this.#data.crm[subjectId] = this.#data.crm[subjectId] || {
      notes: [],
      tasks: [],
      tags: [],
      stage: null,
      owner: null,
      source: null,
      lostReason: null,
    });
    Object.assign(record, patch, { updatedAt: new Date().toISOString() });
    this.#commit();
    return record;
  }

  /** Records a stage move with who made it — a stage nobody owns is not a decision. */
  setStage(subjectId, stage, by, lostReason = null) {
    return this.updateCrm(subjectId, {
      stage,
      stageSetBy: by || null,
      stageSetAt: new Date().toISOString(),
      lostReason: stage === "lost" ? lostReason || null : null,
    });
  }

  addNote(subjectId, { body, kind = "note", by }) {
    const record = this.updateCrm(subjectId, {});
    const note = {
      id: newId("n"),
      at: new Date().toISOString(),
      by: by || null,
      kind,
      body: String(body),
    };
    record.notes = [note, ...(record.notes || [])].slice(0, MAX_NOTES);
    this.#commit();
    return note;
  }

  deleteNote(subjectId, noteId) {
    const record = this.#data.crm[subjectId];
    if (!record || !record.notes) return false;
    const before = record.notes.length;
    record.notes = record.notes.filter((n) => n.id !== noteId);
    if (record.notes.length === before) return false;
    this.#commit();
    return true;
  }

  addTask(subjectId, { title, dueAt = null, by }) {
    const record = this.updateCrm(subjectId, {});
    const task = {
      id: newId("t"),
      at: new Date().toISOString(),
      by: by || null,
      title: String(title),
      dueAt: dueAt || null,
      doneAt: null,
      doneBy: null,
    };
    record.tasks = [task, ...(record.tasks || [])].slice(0, MAX_TASKS);
    this.#commit();
    return task;
  }

  /** Completing and re-opening are the same operation from opposite ends. */
  setTaskDone(subjectId, taskId, done, by) {
    const record = this.#data.crm[subjectId];
    const task = record?.tasks?.find((t) => t.id === taskId);
    if (!task) return null;
    task.doneAt = done ? new Date().toISOString() : null;
    task.doneBy = done ? by || null : null;
    this.#commit();
    return task;
  }

  deleteTask(subjectId, taskId) {
    const record = this.#data.crm[subjectId];
    if (!record || !record.tasks) return false;
    const before = record.tasks.length;
    record.tasks = record.tasks.filter((t) => t.id !== taskId);
    if (record.tasks.length === before) return false;
    this.#commit();
    return true;
  }

  /** Every open task across every subject, for the operator's own to-do list. */
  allOpenTasks() {
    const out = [];
    for (const [subjectId, record] of Object.entries(this.#data.crm)) {
      for (const task of record.tasks || []) {
        if (task.doneAt) continue;
        const user = this.#data.users[subjectId];
        const lead = this.#data.leads[subjectId];
        out.push({
          ...task,
          subjectId,
          subjectKind: user ? "account" : lead ? "lead" : "unknown",
          company: user?.company || lead?.company || null,
          username: user?.username || lead?.email || null,
        });
      }
    }
    return out.sort((a, b) => {
      // Undated tasks sort last: a task with a date is a commitment.
      if (!a.dueAt && !b.dueAt) return String(a.at).localeCompare(String(b.at));
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return String(a.dueAt).localeCompare(String(b.dueAt));
    });
  }

  // -- CRM: captured leads -------------------------------------------------
  //
  // The free assessment is the top of the funnel, and until now it produced
  // nothing an operator could follow up. A lead is what it produces: the
  // answers the visitor actually gave, the readiness score those answers
  // actually yielded, and a way to reach them — stored only with consent.

  createLead(lead) {
    const id = lead.id || newId("l");
    const record = {
      id,
      createdAt: new Date().toISOString(),
      source: lead.source || "assessment",
      email: lead.email || null,
      company: lead.company || null,
      contactName: lead.contactName || null,
      phone: lead.phone || null,
      note: lead.note || null,
      readiness: lead.readiness ?? null,
      answers: lead.answers || null,
      profile: lead.profile || null,
      matchIds: lead.matchIds || [],
      convertedUserId: null,
      userAgent: lead.userAgent || null,
    };
    this.#data.leads[id] = record;
    this.#commit();
    return record;
  }

  getLead(id) {
    return this.#data.leads[id] || null;
  }

  /** Leads carry their CRM record with them, so the board can render either. */
  listLeads() {
    return Object.values(this.#data.leads)
      .map((lead) => ({ ...lead, crm: this.#data.crm[lead.id] || null }))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  findLeadByEmail(email) {
    if (!email) return null;
    const wanted = String(email).trim().toLowerCase();
    return Object.values(this.#data.leads).find((l) => String(l.email || "").toLowerCase() === wanted) || null;
  }

  updateLead(id, patch) {
    const lead = this.#data.leads[id];
    if (!lead) return null;
    Object.assign(lead, patch);
    this.#commit();
    return lead;
  }

  deleteLead(id) {
    if (!this.#data.leads[id]) return false;
    delete this.#data.leads[id];
    delete this.#data.crm[id];
    this.#commit();
    return true;
  }

  /**
   * Links a lead to the account it became.
   *
   * Called on registration when the address matches: the notes and tasks
   * written against the lead move onto the account, so the history of the
   * conversation survives the moment they sign up.
   */
  convertLead(leadId, userId) {
    const lead = this.#data.leads[leadId];
    if (!lead) return null;
    lead.convertedUserId = userId;

    const from = this.#data.crm[leadId];
    if (from) {
      const to = (this.#data.crm[userId] = this.#data.crm[userId] || { notes: [], tasks: [], tags: [] });
      to.notes = [...(from.notes || []), ...(to.notes || [])].slice(0, MAX_NOTES);
      to.tasks = [...(from.tasks || []), ...(to.tasks || [])].slice(0, MAX_TASKS);
      to.tags = [...new Set([...(from.tags || []), ...(to.tags || [])])];
      to.owner = to.owner || from.owner || null;
      to.updatedAt = new Date().toISOString();
    }
    this.#commit();
    return lead;
  }

  stats() {
    const users = this.listUsers();
    return {
      users: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      activeSubscriptions: users.filter((u) => isSubscriptionActive(u.subscription)).length,
      sessions: Object.keys(this.#data.sessions).length,
      leads: Object.keys(this.#data.leads).length,
    };
  }
}

/** Fields worth reporting as a change; the rest are derived or cosmetic. */
const TRACKED_FIELDS = [
  "company", "employees", "county", "region", "teaor", "industryId", "sector",
  "orgType", "revBand", "closed_business_years", "goals", "investment_value",
  "projectName", "funding_pref", "consortium_ready", "eu_experience", "de_minimis_ok",
];

/** @param {object|null} before @param {object|null} after @returns {Array<object>} */
export function diffProfile(before, after) {
  const changes = [];
  for (const field of TRACKED_FIELDS) {
    const a = before ? before[field] : undefined;
    const b = after ? after[field] : undefined;
    const same = Array.isArray(a) && Array.isArray(b) ? a.join("|") === b.join("|") : a === b;
    if (!same) changes.push({ field, from: a === undefined ? null : a, to: b === undefined ? null : b });
  }
  return changes;
}

/** A subscription is active while it has not expired. */
/** @param {object|null} subscription @param {Date} now @returns {boolean} */
export function isSubscriptionActive(subscription, now = new Date()) {
  if (!subscription) return false;
  if (subscription.status !== "active" && subscription.status !== "trial") return false;
  if (!subscription.validUntil) return true;
  return new Date(subscription.validUntil) > now;
}

/** @param {object|null} subscription @param {Date} now @returns {number|null} */
export function subscriptionDaysLeft(subscription, now = new Date()) {
  if (!isSubscriptionActive(subscription, now) || !subscription.validUntil) return null;
  return Math.max(0, Math.ceil((new Date(subscription.validUntil) - now) / 86400000));
}
