import { useCallback } from "react";
import { useIsAuthenticated } from "@/shared/hooks/useAuth";
import { useServerProfileQuery, useSaveProfileMutation, useLoadDemoProfileMutation } from "../api/profile.queries";
import { useLocalProfileStore } from "../store/localProfileStore";
import { DEMO_PROFILE } from "../data/demoProfile";
import type { CompanyProfile } from "../types/profile.types";

/**
 * The single place that decides "does this company's profile live on the
 * server or only in this browser" — every component reads/writes the
 * profile through this, never through `useServerProfileQuery` or
 * `useLocalProfileStore` directly.
 *
 * This is also where a real, previously-open bug gets fixed: in the legacy
 * app, `finishOnboard()` called a `syncProfileToServer()` that was a no-op
 * stub — a signed-in company's profile only ever reached the server once,
 * right after login, and every edit after that silently stayed in
 * `localStorage` only, never versioned. Here, `saveProfile` always calls the
 * server when authenticated, on every save, with no such gap.
 */
export function useCompanyProfile() {
  const isAuthenticated = useIsAuthenticated();
  const serverQuery = useServerProfileQuery(isAuthenticated);
  const localProfile = useLocalProfileStore((state) => state.profile);
  const setLocalProfile = useLocalProfileStore((state) => state.setProfile);
  const saveMutation = useSaveProfileMutation();
  const loadDemoMutation = useLoadDemoProfileMutation();

  const profile = isAuthenticated ? (serverQuery.data?.profile ?? null) : localProfile;

  const saveProfile = useCallback(
    async (next: CompanyProfile) => {
      if (isAuthenticated) {
        const result = await saveMutation.mutateAsync(next);
        return result.profile;
      }
      setLocalProfile(next);
      return next;
    },
    [isAuthenticated, saveMutation, setLocalProfile],
  );

  const loadDemo = useCallback(async () => {
    if (isAuthenticated) {
      const result = await loadDemoMutation.mutateAsync();
      return result.profile;
    }
    setLocalProfile(DEMO_PROFILE);
    return DEMO_PROFILE;
  }, [isAuthenticated, loadDemoMutation, setLocalProfile]);

  return {
    profile,
    isLoading: isAuthenticated && serverQuery.isLoading,
    isSaving: saveMutation.isPending || loadDemoMutation.isPending,
    saveError: saveMutation.error,
    saveProfile,
    loadDemo,
  };
}
