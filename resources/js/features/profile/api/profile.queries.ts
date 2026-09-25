import { authKeys } from "@/features/authentication/api/auth.queries";
import { opportunitiesKeys } from "@/api/opportunitiesKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompanyProfile } from "../types/profile.types";
import { profileApi } from "./profile.api";

export const profileKeys = {
  all: ["profile"] as const,
  detail: () => [...profileKeys.all, "detail"] as const,
  history: () => [...profileKeys.all, "history"] as const,
};

/**
 * The server-held profile — only meaningful for a signed-in account. Callers
 * should gate this on `useIsAuthenticated()`; see `useCompanyProfile` for the
 * hook that actually decides server vs. local storage.
 */
export function useServerProfileQuery(enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: profileApi.get,
    enabled,
    staleTime: 60_000,
  });
}

export function useProfileHistoryQuery(enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.history(),
    queryFn: profileApi.history,
    enabled,
  });
}

/** The server scores every call for the stored profile, so any change to it makes the scored data stale. */
function invalidateProfileAndScores(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: profileKeys.all }),
    queryClient.invalidateQueries({ queryKey: opportunitiesKeys.all }),
  ]);
}

export function useSaveProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: CompanyProfile) => profileApi.save(profile),
    onSuccess: () =>
      Promise.all([
        invalidateProfileAndScores(queryClient),
        queryClient.invalidateQueries({ queryKey: authKeys.me() }),
      ]),
  });
}

export function useLoadDemoProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.loadDemo,
    onSuccess: () => invalidateProfileAndScores(queryClient),
  });
}

export function useRestoreProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => profileApi.restore(version),
    onSuccess: () => invalidateProfileAndScores(queryClient),
  });
}
