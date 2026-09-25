import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useMeQuery } from "@/features/authentication/api/auth.queries";

/**
 * The admin console is for administrators. Waits for the session to resolve
 * first, so a signed-in admin reloading `/admin` isn't bounced to the login
 * page while it loads. The server enforces this too (every `/api/admin/*`
 * route answers 403 to anyone else); this only keeps the screens from
 * rendering empty for people who shouldn't be there.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const me = useMeQuery();

  if (me.isLoading) return null;
  const user = me.data?.user;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/app" replace />;
  return <>{children}</>;
}
