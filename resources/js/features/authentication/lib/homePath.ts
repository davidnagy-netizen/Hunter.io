import type { AuthUser } from "../types/auth.types";

/**
 * Where a signed-in account lands. An administrator works in the admin
 * console — they never need a company profile for it — everyone else goes to
 * the app, which sends them on to onboarding if they have no profile yet.
 */
export function homePathFor(user: Pick<AuthUser, "role"> | null | undefined): string {
  return user?.role === "admin" ? "/admin" : "/app";
}
