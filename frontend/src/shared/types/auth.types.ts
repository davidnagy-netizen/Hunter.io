export type UserRole = "admin" | "user";

export type EntitlementTier = "anonymous" | "registered" | "subscriber" | "admin";

/** Mirrors `entitlementsFor()` in `server/auth.js`. */
export interface Entitlements {
  tier: EntitlementTier;
  maxResults: number;
  teasers?: number;
  explanations: boolean;
  calculator: boolean;
  applyLinks: boolean;
  exportData: boolean;
  admin: boolean;
}

export interface SubscriptionSummary {
  status?: string;
  plan?: string;
  validUntil?: string | null;
  grantedBy?: string;
  grantedAt?: string;
  note?: string;
  active: boolean;
  daysLeft: number | null;
}

/** Mirrors `publicUser()` in `server/auth.js` — never includes a password hash. */
export interface AuthUser {
  emailVerified?: boolean;
  metricsComplete?: boolean;
  id: string;
  username: string;
  email: string | null;
  company: string | null;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string | null;
  disabled: boolean;
  subscription: SubscriptionSummary;
  entitlements: Entitlements;
  hasProfile: boolean;
}

export interface Plan {
  id: string;
  label_hu: string;
  label_en: string;
  days: number;
  status: string;
  priceHUF?: number;
}

export interface AdminSeed {
  usingDefaultPassword: boolean;
  username: string;
}

/** Response shape of `GET /api/auth/me`. */
export interface MeResponse {
  user: AuthUser | null;
  entitlements: Entitlements;
  plans: Plan[];
  /** Development-only demo hint; the backend omits it (and must, in production). */
  adminSeed?: AdminSeed;
}

/** Response shape of `POST /api/auth/login` and `/register`. */
export interface AuthActionResponse {
  success: true;
  user: AuthUser;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  password: string;
  password_confirmation: string;
  email: string;
  verification_receipt: string;
  accept_terms: boolean;
  accept_privacy: boolean;
  marketing_opt_in: boolean;
  metrics: import("@/features/authentication/types/metrics.types").CompanyMetrics;
}

/** The official record NAV holds for a tax number (`POST /api/nav/taxpayer`). */
export interface Taxpayer {
  verificationReceipt?: string;
  expiresAt?: string;
  taxNumber: string;
  companyName: string;
  /** The trading name; equals `companyName` when NAV has none. */
  shortName: string;
  postalCode: string | null;
  city: string | null;
  streetAddress: string | null;
  fullAddress: string;
  /** `VALID`, or a reason the company cannot register (`SUSPENDED`, `DELETED`, …). */
  status: string;
  incorporationDate: string | null;
}
