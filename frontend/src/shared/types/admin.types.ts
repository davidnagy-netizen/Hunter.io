import type { AuthUser, Plan } from "@/shared/types/auth.types";
import type { CompanyProfile } from "@/shared/types/profile.types";

/** One line of the activity log. `store.recordActivity` spreads whatever detail the action had, so only `at` and `type` are guaranteed. */
export interface AdminActivityEntry {
  at: string;
  type: string;
  userId?: string;
  username?: string;
  company?: string | null;
  title?: string;
  q?: string;
  field?: string;
  by?: string;
  plan?: string;
}

/** `refresher.status` from `server/refresh.js`; `{ enabled: false }` when no refresher is running. */
export interface RefreshStatus {
  enabled: boolean;
  intervalHours?: number;
  lastAttemptAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: { message: string; at: string } | null;
  nextRunAt?: string | null;
  runs?: number;
  failures?: number;
}

export interface SystemInfo {
  catalogTotal: number;
  catalogOpen: number;
  builtAt: string | null;
  builtBy: string;
  eurHuf: number | null;
  refresh: RefreshStatus;
}

export interface AdminStats {
  users: number;
  admins: number;
  disabled: number;
  activeSubscriptions: number;
  withoutSubscription: number;
  newThisWeek: number;
  sessions: number;
  profilesSaved: number;
}

export interface ExpiringUser extends AuthUser {
  daysLeft: number;
}

/** Response of `GET /api/admin/overview`. */
export interface AdminOverview {
  stats: AdminStats;
  byPlan: Record<string, number>;
  expiringSoon: ExpiringUser[];
  awaitingAccess: AuthUser[];
  recentSignups: AuthUser[];
  activity: AdminActivityEntry[];
  plans: Plan[];
  system: SystemInfo;
}

export interface AdminUser extends AuthUser {
  profileVersions: number;
  lastActivity: AdminActivityEntry | null;
}

/** Response of `GET /api/admin/users`. */
export interface AdminUsersResponse {
  stats: { users: number; admins: number; activeSubscriptions: number; sessions: number; leads: number };
  plans: Plan[];
  users: AdminUser[];
}

export interface SubscriptionLogEntry {
  at: string;
  action: "granted" | "revoked";
  by?: string;
  plan?: string;
  days?: number;
  validUntil?: string;
  note?: string | null;
}

export interface ProfileVersionChange {
  field: string;
  from: unknown;
  to: unknown;
}

export interface ProfileVersionEntry {
  version: number;
  at: string;
  source?: string;
  changed: ProfileVersionChange[];
}

/** Response of `GET /api/admin/history?userId=`. */
export interface AdminUserHistory {
  user: AuthUser;
  /** The profile's live state, not a version snapshot — `null` if this account never saved one. */
  current: CompanyProfile | null;
  versions: ProfileVersionEntry[];
  subscriptions: SubscriptionLogEntry[];
  activity: AdminActivityEntry[];
}

export interface GrantPayload {
  userId: string;
  planId: string;
  days?: number;
  note?: string;
}

export interface UserPatchPayload {
  userId: string;
  disabled?: boolean;
}

/** Response of `POST /api/refresh`. Only what the console reads; the report is the refresher's own. */
export interface RefreshResponse {
  ok: boolean;
  total: number;
  status: RefreshStatus;
}
