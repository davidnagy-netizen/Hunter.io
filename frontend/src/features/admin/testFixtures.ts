import type { AuthUser, Plan } from "@/shared/types/auth.types";
import type { AdminOverview, AdminUser } from "@/shared/types/admin.types";

export const PLANS: Plan[] = [
  { id: "trial", label_hu: "5 napos próba", label_en: "5-day trial", days: 5, status: "trial" },
  { id: "monthly", label_hu: "Havi előfizetés", label_en: "Monthly subscription", days: 30, status: "active", priceHUF: 5990 },
];

export function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "u1",
    username: "kata",
    email: null,
    company: "Kata Kft.",
    role: "user",
    createdAt: "2026-09-10T08:00:00.000Z",
    lastLoginAt: null,
    disabled: false,
    subscription: { active: false, daysLeft: null },
    entitlements: { tier: "registered", maxResults: 0, explanations: false, calculator: false, applyLinks: false, exportData: false, admin: false },
    hasProfile: false,
    ...overrides,
  };
}

export function makeAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return { ...makeUser(), profileVersions: 0, lastActivity: null, ...overrides };
}

export function makeOverview(overrides: Partial<AdminOverview> = {}): AdminOverview {
  return {
    stats: { users: 3, admins: 1, disabled: 0, activeSubscriptions: 1, withoutSubscription: 1, newThisWeek: 2, sessions: 4, profilesSaved: 1 },
    byPlan: { monthly: 1 },
    expiringSoon: [],
    awaitingAccess: [],
    recentSignups: [],
    activity: [],
    plans: PLANS,
    system: {
      catalogTotal: 621,
      catalogOpen: 300,
      builtAt: "2026-09-12T06:03:17.424Z",
      builtBy: "live-refresh",
      eurHuf: 364.28,
      refresh: { enabled: true, intervalHours: 6, lastSuccessAt: null, nextRunAt: null, runs: 0, failures: 0 },
    },
    ...overrides,
  };
}
