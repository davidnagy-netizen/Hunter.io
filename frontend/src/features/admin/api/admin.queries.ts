import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { metaKeys } from "@/shared/api/meta.queries";
import { opportunitiesKeys } from "@/features/opportunities/api/opportunities.queries";
import { adminApi } from "./admin.api";
import type { GrantPayload, UserPatchPayload } from "../types/admin.types";

export const adminKeys = {
  all: ["admin"] as const,
  overview: () => [...adminKeys.all, "overview"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  history: (userId: string) => [...adminKeys.all, "history", userId] as const,
};

export function useAdminOverviewQuery() {
  return useQuery({ queryKey: adminKeys.overview(), queryFn: adminApi.overview });
}

export function useAdminUsersQuery() {
  return useQuery({ queryKey: adminKeys.users(), queryFn: adminApi.users });
}

export function useAdminUserHistoryQuery(userId: string) {
  return useQuery({ queryKey: adminKeys.history(userId), queryFn: () => adminApi.history(userId) });
}

/** Any account change shows up in the overview counters, the user list and that user's history, so all of `admin` goes stale together. */
function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: adminKeys.all });
}

export function useGrantSubscriptionMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({ mutationFn: (payload: GrantPayload) => adminApi.grant(payload), onSuccess: invalidate });
}

export function useRevokeSubscriptionMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({ mutationFn: (userId: string) => adminApi.revoke(userId), onSuccess: invalidate });
}

export function usePatchUserMutation() {
  const invalidate = useInvalidateAdmin();
  return useMutation({ mutationFn: (payload: UserPatchPayload) => adminApi.patchUser(payload), onSuccess: invalidate });
}

/**
 * Rebuilds the catalog from the live portal. Beyond the console's own numbers,
 * every catalog-derived result any screen cached is now stale, so the
 * opportunities and reference-data caches are dropped too.
 */
export function useRefreshCatalogMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.refreshCatalog,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.all }),
        queryClient.invalidateQueries({ queryKey: opportunitiesKeys.all }),
        queryClient.invalidateQueries({ queryKey: metaKeys.all }),
      ]),
  });
}
