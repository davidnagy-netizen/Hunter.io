/**
 * Accounts, sessions and subscription entitlements.
 *
 * Passwords are hashed with scrypt from `node:crypto` — memory-hard, in the
 * standard library, no dependency. Comparison is constant-time, so a wrong
 * password cannot be found by timing.
 *
 * Sessions are opaque random tokens held server-side rather than signed claims
 * in the client, because an admin revoking a subscription or disabling an
 * account has to take effect immediately, and a self-contained token cannot be
 * withdrawn before it expires.
 *
 * Entitlements are resolved here and enforced on the server. Gating in the
 * browser alone would be decoration: anyone can read the JSON the API returns.
 */

import crypto from "node:crypto";
import { isSubscriptionActive, subscriptionDaysLeft } from "./store.js";

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
export const SESSION_TTL_MS = 7 * 24 * 3600 * 1000;
export const SESSION_COOKIE = "hunter_session";

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return { salt, passwordHash: hash.toString("hex") };
}

export function verifyPassword(password, salt, expectedHex) {
  if (!salt || !expectedHex) return false;
  const actual = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

export function parseCookies(header) {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function sessionCookie(token, { secure = false, maxAgeMs = SESSION_TTL_MS } = {}) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;
export const MIN_PASSWORD = 4;

/**
 * @returns {{code:string, message:string}|null} null when acceptable.
 * The code lets the browser render the rule in the reader's language; the
 * message is the fallback for anything that is not the browser.
 */
export function validateCredentials(username, password) {
  if (!username || !USERNAME_RE.test(username)) {
    return {
      code: "INVALID_USERNAME",
      message: "A felhasználónév 3–32 karakter, betű, szám, pont, kötőjel vagy aláhúzás lehet.",
    };
  }
  if (!password || String(password).length < MIN_PASSWORD) {
    return { code: "WEAK_PASSWORD", message: `A jelszó legalább ${MIN_PASSWORD} karakter legyen.` };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Subscription plans and entitlements
// ---------------------------------------------------------------------------

/**
 * Plans an admin can grant. There is no payment gateway yet — a Hungarian
 * provider comes later — so access is granted by hand and this is the list of
 * what "granted" can mean.
 */
export const PLANS = [
  { id: "trial", label_hu: "5 napos próba", label_en: "5-day trial", days: 5, status: "trial" },
  { id: "monthly", label_hu: "Havi előfizetés", label_en: "Monthly subscription", days: 30, status: "active", priceHUF: 5990 },
  { id: "quarterly", label_hu: "Negyedéves előfizetés", label_en: "Quarterly subscription", days: 90, status: "active", priceHUF: 16990 },
  { id: "yearly", label_hu: "Éves előfizetés", label_en: "Annual subscription", days: 365, status: "active", priceHUF: 59900 },
];

export function planById(id) {
  return PLANS.find((p) => p.id === id) || null;
}

/**
 * How many censored teaser rows a gated visitor is shown.
 *
 * They carry a score and a grant figure and nothing that identifies the call,
 * so the number can be generous: it is the size of the prize, not a sample of
 * the product.
 */
export const TEASER_RESULTS = 12;

/**
 * What this account may see.
 *
 * Without an active subscription nothing is shown in full. The counts are real
 * and so is every score — what is withheld is *which call* each score belongs
 * to. A visitor can see that eleven strong matches exist and roughly what they
 * are worth; naming them is what the subscription buys.
 */
export function entitlementsFor(user) {
  if (user?.role === "admin") {
    return { tier: "admin", maxResults: Infinity, explanations: true, calculator: true, applyLinks: true, exportData: true, admin: true };
  }
  if (isSubscriptionActive(user?.subscription)) {
    return { tier: "subscriber", maxResults: Infinity, explanations: true, calculator: true, applyLinks: true, exportData: true, admin: false };
  }
  if (user) {
    return { tier: "registered", maxResults: 0, teasers: TEASER_RESULTS, explanations: false, calculator: false, applyLinks: false, exportData: false, admin: false };
  }
  return { tier: "anonymous", maxResults: 0, teasers: TEASER_RESULTS, explanations: false, calculator: false, applyLinks: false, exportData: false, admin: false };
}

/** The account summary sent to the client. Never includes the password hash. */
export function publicUser(user) {
  if (!user) return null;
  const entitlements = entitlementsFor(user);
  return {
    id: user.id,
    username: user.username,
    email: user.email || null,
    company: user.company || null,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    disabled: Boolean(user.disabled),
    subscription: {
      ...user.subscription,
      active: isSubscriptionActive(user.subscription),
      daysLeft: subscriptionDaysLeft(user.subscription),
    },
    entitlements,
    hasProfile: Boolean(user.profile),
  };
}

/**
 * Seeds the administrator account on first boot.
 *
 * The default credentials are admin/admin because this build is meant to be
 * demonstrated, not deployed to real customers as-is. They are overridable with
 * HUNTER_ADMIN_USER / HUNTER_ADMIN_PASSWORD, and the server says loudly at
 * startup when the defaults are still in place.
 *
 * @returns {{created:boolean, usingDefaultPassword:boolean, username:string}}
 */
export function ensureAdmin(store, logger = console) {
  const username = process.env.HUNTER_ADMIN_USER || "admin";
  const password = process.env.HUNTER_ADMIN_PASSWORD || "admin";
  const usingDefaultPassword = !process.env.HUNTER_ADMIN_PASSWORD;

  let admin = store.findByUsername(username);
  if (!admin) {
    const { salt, passwordHash } = hashPassword(password);
    admin = store.createUser({
      username,
      role: "admin",
      company: "Hunter — adminisztráció",
      passwordHash,
      salt,
      subscription: { status: "active", plan: "admin", validUntil: null, grantedBy: "system", grantedAt: new Date().toISOString(), note: "Administrator account" },
    });
    logger.log(`[auth] administrator account "${username}" created`);
    if (usingDefaultPassword) {
      logger.warn(
        `[auth] WARNING: "${username}" is using the default password. ` +
          "Set HUNTER_ADMIN_PASSWORD before putting this anywhere public."
      );
    }
    return { created: true, usingDefaultPassword, username };
  }
  return { created: false, usingDefaultPassword, username };
}
