import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useMeQuery } from "@/features/authentication/api/auth.queries";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";

/**
 * The app screens are meaningless without a company profile (everything is
 * ranked against it), so a visitor without one is sent to the onboarding
 * wizard. Waits for the session and the profile to resolve first — otherwise a
 * signed-in user with a saved profile would flash through onboarding.
 */
export function RequireProfile({ children }: { children: ReactNode }) {
  const me = useMeQuery();
  const { profile, isLoading } = useCompanyProfile();

  if (me.isLoading || isLoading) return null;
  if (me.data?.user?.emailVerified === false) return <Navigate to="/verify-email" replace />;
  if (me.data?.user && me.data.user.metricsComplete === false) return <Navigate to="/onboarding" replace />;
  if (!profile) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}
